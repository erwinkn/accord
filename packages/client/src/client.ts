import { BearerAuth, getAuthProviders } from "./auth.js"
import {
  decodeBody,
  defaultCodec,
  encodeBody,
  fallbackCodec,
  mediaMatches,
  mediaType,
} from "./codecs.js"
import { DecodeError, HttpError, NetworkError, ValidationError } from "./errors.js"
import {
  defaultRequestMediaType,
  requestBodyFields,
  requestBodyVariants,
  requestCodec,
  requestMediaType,
} from "./request-body.js"
import {
  renderQueryString,
  serializeCookieParameter,
  serializeHeaderParameter,
  serializePathParameter,
  serializeQueryParameter,
} from "./serialize.js"
import type {
  ArgumentsOf,
  ClientFor,
  ClientOptions,
  EndpointContract,
  EndpointDefinition,
  EndpointFunction,
  EndpointPlan,
  FullResponseOf,
  HeaderResolver,
  HttpResult,
  OperationKind,
  ParameterBinding,
  ParameterValue,
  RequestMiddlewareContext,
  RequestObject,
  RequestOptions,
  RequestValue,
  ResponseMap,
  ResponseMetadata,
  ResponseOf,
  StatusSelector,
} from "./types.js"

import { endpointMarker, endpointScope } from "./types.js"

function isRecord<T>(value: T): value is T & object {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
function isHeaderResolver<T>(value: T): value is T & HeaderResolver {
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  return typeof value === "function"
}

export function isEndpointDescriptor<T>(value: T): value is T & EndpointDefinition {
  return isRecord(value) && endpointMarker in value && value[endpointMarker] === true
}

export function defineEndpoint<C extends EndpointContract, K extends OperationKind = OperationKind>(
  definition: EndpointPlan<K>,
): EndpointDefinition<C, K> {
  return { ...definition, [endpointMarker]: true }
}

/** Bind the assembled API to one cache identity without changing the supplied endpoint tree. */
export function defineApi<const TApi extends object>(scope: string, api: TApi): TApi {
  const bind = <T>(value: T): T => {
    if (isEndpointDescriptor(value)) return { ...value, [endpointScope]: scope }
    if (!isRecord(value)) throw new TypeError("Accord namespaces must contain endpoint definitions")
    // SAFETY: copy the same namespace keys and preserve each endpoint's contract; only add its scope symbol.
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, bind(child)])) as T
  }
  return bind(api)
}

/** @deprecated Use defineApi(scope, endpoints) around the assembled API. */
export function createEndpointFactory(scope: string) {
  return function scopedEndpoint<
    C extends EndpointContract,
    K extends OperationKind = OperationKind,
  >(definition: EndpointPlan<K>): EndpointDefinition<C, K> {
    return { ...defineEndpoint<C, K>(definition), [endpointScope]: scope }
  }
}

export function getEndpointScope(endpoint: EndpointDefinition): string | undefined {
  return endpoint[endpointScope]
}

export function createClient<const TApi extends object>(
  api: TApi,
  options: ClientOptions = {},
): ClientFor<TApi> {
  const map = <T>(value: T): ClientFor<T> => {
    if (isEndpointDescriptor(value)) {
      // SAFETY: the marker establishes the endpoint branch of ClientFor.
      return createEndpointClient(value, options) as ClientFor<T>
    }
    if (!isRecord(value)) throw new TypeError("Accord namespaces must contain endpoint definitions")
    const mapped = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, map(child)]),
    )
    // SAFETY: preserve every namespace key and recursively apply the ClientFor mapping.
    return mapped as ClientFor<T>
  }
  return map(api)
}

export function createEndpointClient<E extends EndpointDefinition>(
  endpoint: E,
  options: ClientOptions = {},
): EndpointFunction<E> {
  const request = async (...args: ArgumentsOf<E>): Promise<ResponseOf<E>> => {
    const result = await execute(endpoint, options, args)
    const data =
      endpoint.resultMode === "status" ? { status: result.status, data: result.data } : result.data
    // SAFETY: the generated contract and execution plan share one representation projection; validation is optional by design.
    return data as ResponseOf<E>
  }
  return Object.assign(request, {
    endpoint,
    context: options,
    async withResponse(...args: ArgumentsOf<E>): Promise<FullResponseOf<E>> {
      // SAFETY: full-response contracts describe the selected status and representation plus these HTTP fields.
      return (await execute(endpoint, options, args)) as FullResponseOf<E>
    },
  })
}

export function statusMatches(selector: StatusSelector, status: number): boolean {
  if (selector === "default") return status >= 100 && status <= 599
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  if (typeof selector === "number") return selector === status
  return Math.floor(status / 100) === Number(selector[0])
}

export function selectResponseStatus(
  responses: ResponseMap,
  status: number,
): StatusSelector | undefined {
  if (Object.hasOwn(responses, status)) return status
  for (const range of ["1XX", "2XX", "3XX", "4XX", "5XX"] as const)
    if (statusMatches(range, status) && Object.hasOwn(responses, range)) return range
  return statusMatches("default", status) && Object.hasOwn(responses, "default")
    ? "default"
    : undefined
}
export function selectResponse(
  responses: ResponseMap,
  status: number,
): ResponseMetadata | readonly ResponseMetadata[] | undefined {
  const selected = selectResponseStatus(responses, status)
  return selected === undefined ? undefined : responses[selected]
}
function isResponseList(
  value: ResponseMetadata | readonly ResponseMetadata[],
): value is readonly ResponseMetadata[] {
  return Array.isArray(value)
}
export function responseVariants(
  value: ResponseMetadata | readonly ResponseMetadata[] | undefined,
): readonly ResponseMetadata[] {
  return value === undefined ? [] : isResponseList(value) ? value : [value]
}

function selectMedia<T extends { readonly mediaType: string }>(
  content: readonly T[],
  actual: string | null,
): T | undefined {
  if (!actual) return content.length === 1 ? content[0] : undefined
  return (
    content.find((item) => mediaType(item.mediaType) === mediaType(actual)) ??
    content.find((item) => item.mediaType !== "*/*" && mediaMatches(item.mediaType, actual)) ??
    content.find((item) => item.mediaType === "*/*")
  )
}

/** Routing is a client concern, independent of the OpenAPI document's server list. */
export function resolveBaseUrl(options: ClientOptions): string {
  const origin = globalThis.location?.href ?? "http://localhost/"
  return new URL(options.baseUrl ?? "/", origin).href
}

function resolveUrl(options: ClientOptions, path: string): URL {
  const base = new URL(resolveBaseUrl(options))
  const existingQuery = base.search
  base.search = ""
  base.hash = ""
  if (!base.pathname.endsWith("/")) base.pathname += "/"
  const url = new URL(path.replace(/^\//, ""), base)
  url.search = existingQuery
  return url
}

async function parameterValue(
  parameter: ParameterBinding,
  input: RequestObject,
): Promise<ParameterValue | undefined> {
  const value = input[parameter.inputName ?? parameter.name]
  if (value === undefined) return undefined
  if (parameter.codec && parameter.codec.kind !== "parameter") {
    const encoded = await encodeBody(parameter.codec, value, new Headers())
    if (encoded instanceof Blob) return encoded.text()
    if (encoded instanceof ArrayBuffer) return new TextDecoder().decode(encoded)
    return String(encoded ?? "")
  }
  // SAFETY: generated caller types constrain parameter values. Dispatch is serialization, not validation.
  return value as ParameterValue
}

async function execute<E extends EndpointDefinition>(
  endpoint: E,
  options: ClientOptions,
  args: ArgumentsOf<E>,
): Promise<HttpResult> {
  // SAFETY: the TypeScript caller owns argument correctness; do not clone or re-parse the input.
  const input = (args[0] ?? {}) as RequestObject
  const requestOptions: RequestOptions = args[1] ?? {}
  const plan = endpoint
  let path = plan.path
  const query: ReturnType<typeof serializeQueryParameter>[number][] = []
  const configuredHeaders = isHeaderResolver(options.headers)
    ? await options.headers({ endpoint, input })
    : options.headers
  const headers = new Headers(configuredHeaders)
  const cookies: string[] = []
  for (const parameter of plan.pathParams ?? []) {
    const value = await parameterValue(parameter, input)
    if (value !== undefined)
      path = path.split(`{${parameter.name}}`).join(serializePathParameter(parameter, value))
  }
  for (const parameter of plan.queryParams ?? []) {
    const value = await parameterValue(parameter, input)
    if (value !== undefined) query.push(...serializeQueryParameter(parameter, value))
  }
  for (const parameter of plan.headerParams ?? []) {
    const value = await parameterValue(parameter, input)
    if (value !== undefined) headers.set(parameter.name, serializeHeaderParameter(parameter, value))
  }
  for (const parameter of plan.cookieParams ?? []) {
    const value = await parameterValue(parameter, input)
    if (value !== undefined)
      for (const [name, item] of serializeCookieParameter(parameter, value))
        cookies.push(`${encodeURIComponent(name)}=${encodeURIComponent(item)}`)
  }
  if (cookies.length)
    headers.set("cookie", [headers.get("cookie"), ...cookies].filter(Boolean).join("; "))
  const url = resolveUrl(options, path)
  for (const [name, value] of new Headers(requestOptions.headers)) headers.set(name, value)
  const queryString = renderQueryString(query)
  if (queryString) url.search = [url.search.slice(1), queryString].filter(Boolean).join("&")
  const init: RequestInit = { method: plan.method, headers }
  if (requestOptions.signal) init.signal = requestOptions.signal
  if (plan.requestBody) {
    const bodyPlan = plan.requestBody
    for (const name of Object.keys(requestOptions.headers ?? {})) {
      if (name.toLowerCase() === "content-type" && name !== "content-type")
        throw new TypeError(
          'Select a request representation with the lowercase "content-type" header',
        )
    }
    const contentType =
      requestOptions.headers?.["content-type"] ?? defaultRequestMediaType(bodyPlan)
    const selected = selectMedia(
      requestBodyVariants(bodyPlan).map((body) => ({ mediaType: requestMediaType(body), body })),
      contentType,
    )?.body
    if (!selected)
      throw new TypeError(`Unsupported request content-type ${contentType} for ${plan.id}`)
    let value: RequestValue
    if (selected.mode === "separate") value = input["body"]
    else {
      const body: { [key: string]: RequestValue } = Object.create(null)
      for (const field of requestBodyFields(selected))
        if (Object.hasOwn(input, field) && input[field] !== undefined) body[field] = input[field]
      value = selected.required || Object.keys(body).length ? body : undefined
    }
    if (value !== undefined) {
      headers.set("content-type", contentType)
      const body = await encodeBody(requestCodec(selected), value, headers)
      if (body !== undefined) init.body = body
    }
  }
  if (requestOptions.auth !== false)
    await applyAuthentication(endpoint, options, headers, url, init)
  // Explicit per-call headers have the final say, including Authorization.
  for (const [name, value] of new Headers(requestOptions.headers))
    if (name !== "content-type") headers.set(name, value)
  let context: RequestMiddlewareContext = { endpoint, input, url, init }
  for (const middleware of options.requestMiddleware ?? [])
    context = (await middleware(context)) ?? context
  let response: Response
  try {
    response = await (options.fetch ?? globalThis.fetch)(context.url, context.init)
  } catch (cause) {
    throw new NetworkError(endpoint, cause)
  }
  for (const middleware of options.responseMiddleware ?? [])
    response = (await middleware({ ...context, response })) ?? response
  const matchedStatus = selectResponse(plan.responses, response.status)
  const actualMedia = mediaType(response.headers.get("content-type")) || null
  const variants = responseVariants(matchedStatus)
  const candidates = variants.filter(hasMediaType)
  const selectedResponse = candidates.length ? selectMedia(candidates, actualMedia) : variants[0]
  const noBody = plan.method === "HEAD" || [204, 205, 304].includes(response.status)
  const codec = selectedResponse
    ? (selectedResponse.codec ??
      (selectedResponse.mediaType === undefined
        ? { kind: "empty" as const }
        : defaultCodec(selectedResponse.mediaType, "response")))
    : fallbackCodec(actualMedia)
  let data: RequestValue | Response
  try {
    if (response.ok && (!matchedStatus || (!noBody && !selectedResponse))) {
      throw new TypeError(
        `Undeclared response ${response.status} ${actualMedia ?? "(missing content-type)"} for ${plan.id}`,
      )
    }
    data = await decodeBody(codec, response, plan.method)
  } catch (cause) {
    const error = new DecodeError(response, endpoint, cause)
    if (!response.ok) throw new HttpError({ response, endpoint, body: undefined, cause: error })
    throw error
  }
  const validator = !noBody && selectedResponse?.schema
  if (validator) {
    try {
      const validation = await validator["~standard"].validate(data)
      if (validation.issues) throw new ValidationError(validation.issues, response, endpoint)
      // Generated validators preserve values; no coercion, defaults or stripping.
    } catch (cause) {
      if (!response.ok) throw new HttpError({ response, endpoint, body: undefined, cause })
      throw cause
    }
  }
  if (!response.ok) throw new HttpError({ response, endpoint, body: data })
  return {
    status: response.status,
    data,
    headers: response.headers,
    mediaType: actualMedia,
    response,
  }
}

function hasMediaType<T extends { readonly mediaType?: string }>(
  value: T,
): value is T & { readonly mediaType: string } {
  return value.mediaType !== undefined
}
async function applyAuthentication(
  endpoint: EndpointDefinition,
  options: ClientOptions,
  headers: Headers,
  url: URL,
  init: RequestInit,
): Promise<void> {
  const providers =
    options.auth !== undefined
      ? getAuthProviders(options.auth)
      : options.token !== undefined
        ? [BearerAuth(options.token)]
        : []
  for (const provider of providers)
    await provider.apply({ endpoint, url, headers, init, baseUrl: resolveBaseUrl(options) })
}
