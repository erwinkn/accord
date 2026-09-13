import { HttpError } from "./errors.js"
import {
  interpolatePath,
  isParameterValue,
  renderQueryString,
  serializeCookieParameter,
  serializeHeaderParameter,
  serializeQueryParameter,
} from "./serialize.js"
import type {
  ClientFor,
  ClientOptions,
  EndpointDescriptor,
  EndpointFunction,
  HeaderResolver,
  JsonPrimitive,
  JsonValue,
  ParameterValue,
  RequestBinary,
  RequestBodyDescriptor,
  RequestMiddlewareContext,
  RequestObject,
  RequestPrimitive,
  RequestValue,
  ResponseMiddlewareContext,
  ResponseOf,
  ResponsePayload,
} from "./types.js"

interface MutableRequestObject {
  [key: string]: RequestValue
}

interface MutableJsonObject {
  [key: string]: JsonValue
}

function isPlainObject<TValue>(value: TValue): value is TValue & object {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isRequestPrimitive<TValue>(value: TValue): value is TValue & RequestPrimitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  )
}

function isRequestBinary<TValue>(value: TValue): value is TValue & RequestBinary {
  return (
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof ReadableStream
  )
}

function parseRequestValue<TValue>(
  value: TValue,
  path: string,
  ancestors: WeakSet<object>,
): RequestValue {
  if (isRequestPrimitive(value) || value instanceof Date || isRequestBinary(value)) return value

  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError(`Circular request value at ${path}`)
    ancestors.add(value)
    try {
      return value.map((item, index) => parseRequestValue(item, `${path}[${index}]`, ancestors))
    } finally {
      ancestors.delete(value)
    }
  }

  if (!isPlainObject(value)) {
    throw new TypeError(`Unsupported request value at ${path}`)
  }
  if (ancestors.has(value)) throw new TypeError(`Circular request value at ${path}`)

  ancestors.add(value)
  try {
    const parsed: MutableRequestObject = Object.create(null)
    for (const [key, item] of Object.entries(value)) {
      parsed[key] = parseRequestValue(item, `${path}.${key}`, ancestors)
    }
    return parsed
  } finally {
    ancestors.delete(value)
  }
}

function isRequestObject(value: RequestValue): value is RequestObject {
  return isPlainObject(value)
}

function parseRequestInput<TValue>(value: TValue, endpoint: EndpointDescriptor): RequestObject {
  const parsed = parseRequestValue(value, "$", new WeakSet())
  if (!isRequestObject(parsed)) {
    throw new TypeError(`Input for ${endpoint.method} ${endpoint.path} must be an object`)
  }
  return parsed
}

export function isEndpointDescriptor<TValue>(value: TValue): value is TValue & EndpointDescriptor {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  return (
    "method" in value &&
    typeof value.method === "string" &&
    "path" in value &&
    typeof value.path === "string" &&
    "operationKind" in value &&
    (value.operationKind === "query" || value.operationKind === "mutation") &&
    "bodyMode" in value &&
    (value.bodyMode === "merge" || value.bodyMode === "separate") &&
    "parameters" in value &&
    Array.isArray(value.parameters) &&
    "responses" in value &&
    Array.isArray(value.responses)
  )
}

function mapApi<TValue>(value: TValue, options: ClientOptions): ClientFor<TValue> {
  if (isEndpointDescriptor(value)) {
    const endpointClient = createEndpointClient(value, options)
    // SAFETY: the descriptor predicate establishes the endpoint branch of ClientFor<TValue>.
    return endpointClient as ClientFor<TValue>
  }
  if (!isPlainObject(value)) {
    throw new TypeError("Accord API trees may contain only namespaces and endpoint descriptors")
  }

  const mapped = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, mapApi(child, options)]),
  )
  // SAFETY: every source key is preserved and recursively mapped through the same ClientFor contract.
  return mapped as ClientFor<TValue>
}

export function defineEndpoint<TEndpoint extends EndpointDescriptor>(
  descriptor: TEndpoint,
): TEndpoint {
  return descriptor
}

export function createClient<const TApi extends object>(
  api: TApi,
  options: ClientOptions = {},
): ClientFor<TApi> {
  return mapApi(api, options)
}

export function createEndpointClient<E extends EndpointDescriptor>(
  endpoint: E,
  options: ClientOptions = {},
): EndpointFunction<E> {
  const request = async (...args: Parameters<EndpointFunction<E>>): Promise<ResponseOf<E>> => {
    const input = parseRequestInput(args[0] ?? {}, endpoint)
    const requestOptions = args[1] ?? {}
    const fetchImplementation = options.fetch ?? globalThis.fetch
    if (!isFetchImplementation(fetchImplementation)) {
      throw new TypeError("No fetch implementation is available")
    }

    const path = interpolatePath(endpoint.path, endpoint.parameters, input)
    const queryPairs = endpoint.parameters
      .filter((parameter) => parameter.in === "query")
      .flatMap((parameter) => {
        const inputName = parameter.inputName ?? parameter.name
        const value = parameterInput(input, inputName, parameter.required, "query")
        return value === undefined ? [] : serializeQueryParameter(parameter, value)
      })

    const url = resolveUrl(path, options.baseUrl)
    const query = renderQueryString(queryPairs)
    if (query.length > 0) {
      url.search = url.search.length > 1 ? `${url.search.slice(1)}&${query}` : query
    }

    const headers = await resolveHeaders(options, endpoint, input)

    for (const parameter of endpoint.parameters.filter((item) => item.in === "header")) {
      const inputName = parameter.inputName ?? parameter.name
      const value = parameterInput(input, inputName, parameter.required, "header")
      if (value !== undefined) {
        headers.set(parameter.name, serializeHeaderParameter(parameter, value))
      }
    }

    const cookies = endpoint.parameters
      .filter((parameter) => parameter.in === "cookie")
      .flatMap((parameter) => {
        const inputName = parameter.inputName ?? parameter.name
        const value = parameterInput(input, inputName, parameter.required, "cookie")
        return value === undefined ? [] : serializeCookieParameter(parameter, value)
      })

    if (cookies.length > 0) {
      const existing = headers.get("cookie")
      const serialized = cookies
        .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
        .join("; ")
      headers.set("cookie", existing ? `${existing}; ${serialized}` : serialized)
    }

    for (const [name, value] of new Headers(requestOptions.headers)) headers.set(name, value)

    const body = buildRequestBody(endpoint, input, headers)
    const init: RequestInit = {
      method: endpoint.method,
      headers,
    }
    if (body !== undefined) init.body = body
    if (requestOptions.signal !== undefined) init.signal = requestOptions.signal

    const initialContext: RequestMiddlewareContext = {
      endpoint,
      input,
      url,
      init,
    }

    const requestContext = await runRequestMiddleware(initialContext, options)
    let response = await fetchImplementation(requestContext.url, requestContext.init)
    response = await runResponseMiddleware({ ...requestContext, response }, options)

    const parsedBody = await parseResponseBody(response, endpoint.method)
    if (!response.ok) {
      throw new HttpError({ response, endpoint, body: parsedBody })
    }
    // SAFETY: generated endpoint response types are derived from the same status/content metadata decoded here.
    return parsedBody as ResponseOf<E>
  }

  return request
}

function isFetchImplementation<TValue>(value: TValue): value is TValue & typeof globalThis.fetch {
  return typeof value === "function"
}

function isHeaderResolver<TValue>(value: TValue): value is TValue & HeaderResolver {
  return typeof value === "function"
}

function parameterInput(
  input: RequestObject,
  inputName: string,
  required: boolean,
  location: "query" | "header" | "cookie",
): ParameterValue | undefined {
  const value = input[inputName]
  if (value === undefined) {
    if (required) throw new TypeError(`Missing required ${location} parameter: ${inputName}`)
    return undefined
  }
  if (!isParameterValue(value)) {
    throw new TypeError(`${location} parameter ${inputName} contains an unsupported value`)
  }
  return value
}

async function resolveHeaders(
  options: ClientOptions,
  endpoint: EndpointDescriptor,
  input: RequestObject,
): Promise<Headers> {
  const configured = isHeaderResolver(options.headers)
    ? await options.headers({ endpoint, input })
    : options.headers
  return new Headers(configured)
}

function resolveUrl(path: string, configuredBaseUrl?: string): URL {
  const baseUrl = configuredBaseUrl ?? globalThis.location?.href ?? "http://localhost/"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  return new URL(normalizedPath, normalizedBase)
}

function bodyValue(
  endpoint: EndpointDescriptor,
  input: RequestObject,
  descriptor: RequestBodyDescriptor,
): RequestValue {
  if (endpoint.bodyMode === "separate") return input["body"]

  const body: MutableRequestObject = Object.create(null)
  let hasValue = false
  for (const field of descriptor.fields) {
    const value = input[field]
    if (value !== undefined) {
      body[field] = value
      hasValue = true
    }
  }
  return descriptor.required || hasValue ? body : undefined
}

function buildRequestBody(
  endpoint: EndpointDescriptor,
  input: RequestObject,
  headers: Headers,
): BodyInit | null | undefined {
  const descriptor = endpoint.requestBody
  if (!descriptor) return undefined

  const value = bodyValue(endpoint, input, descriptor)
  if (value === undefined) {
    if (descriptor.required) throw new TypeError("Missing required request body")
    return undefined
  }

  const mediaType = descriptor.contentType.toLowerCase()
  if (mediaType === "application/json" || mediaType.endsWith("+json")) {
    if (!headers.has("content-type")) headers.set("content-type", descriptor.contentType)
    return JSON.stringify(value)
  }

  if (mediaType === "application/x-www-form-urlencoded") {
    if (!headers.has("content-type")) headers.set("content-type", descriptor.contentType)
    return serializeFormBody(value, descriptor)
  }

  if (mediaType === "multipart/form-data") return serializeMultipartBody(value, descriptor)

  if (mediaType.startsWith("text/")) {
    if (!headers.has("content-type")) headers.set("content-type", descriptor.contentType)
    return String(value)
  }

  if (!headers.has("content-type")) headers.set("content-type", descriptor.contentType)
  if (isDirectBodyInit(value)) return value
  return JSON.stringify(value)
}

function isDirectBodyInit(value: RequestValue): value is RequestValue & BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof ReadableStream
  )
}

function serializeFormBody(value: RequestValue, descriptor: RequestBodyDescriptor): string {
  if (!isRequestObject(value)) return encodeURIComponent(String(value ?? ""))
  const parts: string[] = []

  for (const [name, fieldValue] of Object.entries(value)) {
    if (fieldValue === undefined) continue
    const encoding = descriptor.encoding?.[name]
    const explode = encoding?.explode ?? true
    const append = (entryName: string, entryValue: RequestValue) => {
      parts.push(`${encodeURIComponent(entryName)}=${encodeURIComponent(String(entryValue ?? ""))}`)
    }

    if (Array.isArray(fieldValue)) {
      if (explode) for (const item of fieldValue) append(name, item)
      else append(name, fieldValue.join(","))
    } else if (isRequestObject(fieldValue)) {
      if (encoding?.style === "deepObject") {
        for (const [key, item] of Object.entries(fieldValue)) append(`${name}[${key}]`, item)
      } else if (explode) {
        for (const [key, item] of Object.entries(fieldValue)) append(key, item)
      } else {
        append(name, Object.entries(fieldValue).flat().join(","))
      }
    } else {
      append(name, fieldValue)
    }
  }

  return parts.join("&")
}

function serializeMultipartBody(value: RequestValue, descriptor: RequestBodyDescriptor): FormData {
  const form = new FormData()
  if (!isRequestObject(value)) {
    form.append("body", multipartValue(value))
    return form
  }

  for (const [name, fieldValue] of Object.entries(value)) {
    if (fieldValue === undefined) continue
    const encoding = descriptor.encoding?.[name]
    const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
    for (const item of values) {
      if (encoding?.contentType && isRequestObject(item)) {
        form.append(name, new Blob([JSON.stringify(item)], { type: encoding.contentType }))
      } else {
        form.append(name, multipartValue(item))
      }
    }
  }
  return form
}

function multipartValue(value: RequestValue): string | Blob {
  if (value instanceof Blob) return value
  if (isRequestObject(value) || Array.isArray(value)) return JSON.stringify(value)
  return String(value ?? "")
}

async function runRequestMiddleware(
  initial: RequestMiddlewareContext,
  options: ClientOptions,
): Promise<RequestMiddlewareContext> {
  let context = initial
  for (const middleware of options.requestMiddleware ?? []) {
    context = (await middleware(context)) ?? context
  }
  return context
}

async function runResponseMiddleware(
  initial: ResponseMiddlewareContext,
  options: ClientOptions,
): Promise<Response> {
  let context = initial
  for (const middleware of options.responseMiddleware ?? []) {
    const response = await middleware(context)
    if (response) context = { ...context, response }
  }
  return context.response
}

function isJsonPrimitive<TValue>(value: TValue): value is TValue & JsonPrimitive {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
}

function parseJsonValue<TValue>(
  value: TValue,
  path: string,
  ancestors: WeakSet<object>,
): JsonValue {
  if (isJsonPrimitive(value)) return value

  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError(`Circular JSON value at ${path}`)
    ancestors.add(value)
    try {
      return value.map((item, index) => parseJsonValue(item, `${path}[${index}]`, ancestors))
    } finally {
      ancestors.delete(value)
    }
  }

  if (!isPlainObject(value)) throw new TypeError(`Invalid JSON value at ${path}`)
  if (ancestors.has(value)) throw new TypeError(`Circular JSON value at ${path}`)

  ancestors.add(value)
  try {
    const parsed: MutableJsonObject = Object.create(null)
    for (const [key, item] of Object.entries(value)) {
      parsed[key] = parseJsonValue(item, `${path}.${key}`, ancestors)
    }
    return parsed
  } finally {
    ancestors.delete(value)
  }
}

async function parseResponseBody(response: Response, method: string): Promise<ResponsePayload> {
  if (
    method.toUpperCase() === "HEAD" ||
    response.status === 204 ||
    response.status === 205 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase()
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    const text = await response.text()
    if (text.length === 0) return undefined
    return parseJsonValue(JSON.parse(text), "$", new WeakSet())
  }
  if (contentType.startsWith("text/") || contentType.includes("xml") || contentType === "") {
    const text = await response.text()
    return text.length === 0 ? undefined : text
  }
  return response.arrayBuffer()
}
