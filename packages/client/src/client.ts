import { HttpError } from "./errors.js"
import {
  interpolatePath,
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
  RequestBodyDescriptor,
  RequestMiddlewareContext,
  RequestOptions,
  ResponseMiddlewareContext,
} from "./types.js"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isEndpointDescriptor(value: unknown): value is EndpointDescriptor {
  if (!isRecord(value)) return false
  return (
    typeof value["method"] === "string" &&
    typeof value["path"] === "string" &&
    (value["operationKind"] === "query" || value["operationKind"] === "mutation") &&
    (value["bodyMode"] === "merge" || value["bodyMode"] === "separate") &&
    Array.isArray(value["parameters"]) &&
    Array.isArray(value["responses"])
  )
}

function mapApi(value: unknown, options: ClientOptions): unknown {
  if (isEndpointDescriptor(value)) return createEndpointClient(value, options)
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, mapApi(child, options)]),
  )
}

export function createClient<const TApi extends object>(
  api: TApi,
  options: ClientOptions = {},
): ClientFor<TApi> {
  return mapApi(api, options) as ClientFor<TApi>
}

export function createEndpointClient<E extends EndpointDescriptor>(
  endpoint: E,
  options: ClientOptions = {},
): EndpointFunction<E> {
  const request = async (
    inputValue: unknown = {},
    requestOptions: RequestOptions = {},
  ): Promise<unknown> => {
    if (!isRecord(inputValue)) {
      throw new TypeError(`Input for ${endpoint.method} ${endpoint.path} must be an object`)
    }

    const input = inputValue
    const fetchImplementation = options.fetch ?? globalThis.fetch
    if (typeof fetchImplementation !== "function") {
      throw new TypeError("No fetch implementation is available")
    }

    const path = interpolatePath(endpoint.path, endpoint.parameters, input)
    const queryPairs = endpoint.parameters
      .filter((parameter) => parameter.in === "query")
      .flatMap((parameter) => {
        const inputName = parameter.inputName ?? parameter.name
        const value = input[inputName]
        if (value === undefined) {
          if (parameter.required) {
            throw new TypeError(`Missing required query parameter: ${inputName}`)
          }
          return []
        }
        return serializeQueryParameter(parameter, value)
      })

    const url = resolveUrl(path, options.baseUrl)
    const query = renderQueryString(queryPairs)
    if (query.length > 0) {
      url.search = url.search.length > 1 ? `${url.search.slice(1)}&${query}` : query
    }

    const headers = await resolveHeaders(options, endpoint, input)

    for (const parameter of endpoint.parameters.filter((item) => item.in === "header")) {
      const inputName = parameter.inputName ?? parameter.name
      const value = input[inputName]
      if (value === undefined) {
        if (parameter.required) {
          throw new TypeError(`Missing required header parameter: ${inputName}`)
        }
        continue
      }
      headers.set(parameter.name, serializeHeaderParameter(parameter, value))
    }

    const cookies = endpoint.parameters
      .filter((parameter) => parameter.in === "cookie")
      .flatMap((parameter) => {
        const inputName = parameter.inputName ?? parameter.name
        const value = input[inputName]
        if (value === undefined) {
          if (parameter.required) {
            throw new TypeError(`Missing required cookie parameter: ${inputName}`)
          }
          return []
        }
        return serializeCookieParameter(parameter, value)
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
    return parsedBody
  }

  return request as EndpointFunction<E>
}

async function resolveHeaders(
  options: ClientOptions,
  endpoint: EndpointDescriptor,
  input: Readonly<Record<string, unknown>>,
): Promise<Headers> {
  const configured =
    typeof options.headers === "function"
      ? await options.headers({ endpoint, input })
      : options.headers
  return new Headers(configured)
}

function resolveUrl(path: string, configuredBaseUrl?: string): URL {
  const baseUrl =
    configuredBaseUrl ??
    (typeof globalThis.location === "object" ? globalThis.location.href : "http://localhost/")
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path
  return new URL(normalizedPath, normalizedBase)
}

function bodyValue(
  endpoint: EndpointDescriptor,
  input: Readonly<Record<string, unknown>>,
  descriptor: RequestBodyDescriptor,
): unknown {
  if (endpoint.bodyMode === "separate") return input["body"]

  const body: Record<string, unknown> = Object.create(null) as Record<string, unknown>
  let hasValue = false
  for (const field of descriptor.fields) {
    if (Object.hasOwn(input, field) && input[field] !== undefined) {
      body[field] = input[field]
      hasValue = true
    }
  }
  return descriptor.required || hasValue ? body : undefined
}

function buildRequestBody(
  endpoint: EndpointDescriptor,
  input: Readonly<Record<string, unknown>>,
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
  if (typeof value === "string" || value instanceof Blob || value instanceof FormData) return value
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value as BodyInit
  return JSON.stringify(value)
}

function serializeFormBody(value: unknown, descriptor: RequestBodyDescriptor): string {
  if (!isRecord(value)) return encodeURIComponent(String(value))
  const parts: string[] = []

  for (const [name, fieldValue] of Object.entries(value)) {
    if (fieldValue === undefined) continue
    const encoding = descriptor.encoding?.[name]
    const explode = encoding?.explode ?? true
    const append = (entryName: string, entryValue: unknown) => {
      parts.push(`${encodeURIComponent(entryName)}=${encodeURIComponent(String(entryValue ?? ""))}`)
    }

    if (Array.isArray(fieldValue)) {
      if (explode) for (const item of fieldValue) append(name, item)
      else append(name, fieldValue.join(","))
    } else if (isRecord(fieldValue)) {
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

function serializeMultipartBody(value: unknown, descriptor: RequestBodyDescriptor): FormData {
  const form = new FormData()
  if (!isRecord(value)) {
    form.append("body", multipartValue(value))
    return form
  }

  for (const [name, fieldValue] of Object.entries(value)) {
    if (fieldValue === undefined) continue
    const encoding = descriptor.encoding?.[name]
    const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
    for (const item of values) {
      if (encoding?.contentType && isRecord(item)) {
        form.append(name, new Blob([JSON.stringify(item)], { type: encoding.contentType }))
      } else {
        form.append(name, multipartValue(item))
      }
    }
  }
  return form
}

function multipartValue(value: unknown): string | Blob {
  if (value instanceof Blob) return value
  if (isRecord(value)) return JSON.stringify(value)
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

async function parseResponseBody(response: Response, method: string): Promise<unknown> {
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
    return text.length === 0 ? undefined : JSON.parse(text)
  }
  if (contentType.startsWith("text/") || contentType.includes("xml") || contentType === "") {
    const text = await response.text()
    return text.length === 0 ? undefined : text
  }
  return response.arrayBuffer()
}
