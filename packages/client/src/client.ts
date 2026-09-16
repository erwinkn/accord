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
  Credential,
  EndpointContract,
  EndpointDefinition,
  EndpointFunction,
  FullResponseOf,
  HeaderResolver,
  HttpResult,
  MediaPlan,
  OperationKind,
  ParameterDescriptor,
  ParameterValue,
  RequestMiddlewareContext,
  RequestObject,
  RequestOptions,
  RequestValue,
  ResponseDescriptor,
  ResponseOf,
  StatusSelector,
} from "./types.js"

function isRecord<T>(value: T): value is T & object {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
function isHeaderResolver<T>(value: T): value is T & HeaderResolver {
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  return typeof value === "function"
}

export function isEndpointDescriptor<T>(value: T): value is T & EndpointDefinition {
  return (
    isRecord(value) &&
    "kind" in value &&
    value.kind === "endpoint" &&
    "plan" in value &&
    isRecord(value.plan)
  )
}

export function defineEndpoint<C extends EndpointContract, K extends OperationKind = OperationKind>(
  definition: EndpointDefinition<C, K>,
): EndpointDefinition<C, K> {
  return definition
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
      endpoint.plan.resultMode === "status"
        ? { status: result.status, data: result.data }
        : result.data
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

export function selectResponse(
  responses: readonly ResponseDescriptor[],
  status: number,
): ResponseDescriptor | undefined {
  return (
    responses.find((response) => response.status === status) ??
    responses.find(
      (response) => response.status !== "default" && statusMatches(response.status, status),
    ) ??
    responses.find((response) => response.status === "default")
  )
}

function selectMedia(content: readonly MediaPlan[], actual: string | null): MediaPlan | undefined {
  if (!actual) return content.length === 1 ? content[0] : undefined
  return (
    content.find((item) => mediaType(item.mediaType) === mediaType(actual)) ??
    content.find((item) => item.mediaType !== "*/*" && mediaMatches(item.mediaType, actual)) ??
    content.find((item) => item.mediaType === "*/*")
  )
}

export function resolveBaseUrl(endpoint: EndpointDefinition, options: ClientOptions): string {
  let base = options.baseUrl
  if (base === undefined) {
    const server = endpoint.plan.servers[options.server ?? 0]
    if (server)
      base = server.url.replace(/\{([^}]+)\}/g, (_match, name: string) => {
        const variable = server.variables[name]
        const value = options.serverVariables?.[name] ?? variable?.default
        if (value === undefined) throw new TypeError(`Missing server variable ${name}`)
        if (variable?.enum && !variable.enum.includes(value))
          throw new TypeError(`Invalid server variable ${name}`)
        return value
      })
  }
  const origin = globalThis.location?.href ?? "http://localhost/"
  return new URL(base ?? "/", origin).href
}

function resolveUrl(endpoint: EndpointDefinition, options: ClientOptions, path: string): URL {
  const base = new URL(resolveBaseUrl(endpoint, options))
  const existingQuery = base.search
  base.search = ""
  base.hash = ""
  if (!base.pathname.endsWith("/")) base.pathname += "/"
  const url = new URL(path.replace(/^\//, ""), base)
  url.search = existingQuery
  return url
}

async function parameterValue(
  parameter: ParameterDescriptor,
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
  const plan = endpoint.plan
  let path = plan.path
  const query: ReturnType<typeof serializeQueryParameter>[number][] = []
  const configuredHeaders = isHeaderResolver(options.headers)
    ? await options.headers({ endpoint, input })
    : options.headers
  const headers = new Headers(configuredHeaders)
  const cookies: string[] = []
  for (const parameter of plan.parameters) {
    const value = await parameterValue(parameter, input)
    if (value === undefined) continue
    if (parameter.in === "path")
      path = path.split(`{${parameter.name}}`).join(serializePathParameter(parameter, value))
    if (parameter.in === "query") query.push(...serializeQueryParameter(parameter, value))
    if (parameter.in === "header")
      headers.set(parameter.name, serializeHeaderParameter(parameter, value))
    if (parameter.in === "cookie") {
      for (const [name, item] of serializeCookieParameter(parameter, value))
        cookies.push(`${encodeURIComponent(name)}=${encodeURIComponent(item)}`)
    }
  }
  if (cookies.length)
    headers.set("cookie", [headers.get("cookie"), ...cookies].filter(Boolean).join("; "))
  const url = resolveUrl(endpoint, options, path)
  applyCredentials(endpoint, options, headers, url)
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
    const contentType = requestOptions.headers?.["content-type"] ?? bodyPlan.defaultMediaType
    const selected = selectMedia(bodyPlan.content, contentType)
    if (!selected)
      throw new TypeError(`Unsupported request content-type ${contentType} for ${plan.operationId}`)
    let value: RequestValue
    if (bodyPlan.mode === "separate") value = input["body"]
    else {
      const body: { [key: string]: RequestValue } = Object.create(null)
      for (const field of bodyPlan.fields)
        if (Object.hasOwn(input, field) && input[field] !== undefined) body[field] = input[field]
      value = bodyPlan.required || Object.keys(body).length ? body : undefined
    }
    if (value !== undefined) {
      headers.set("content-type", contentType)
      const body = await encodeBody(
        selected.codec ?? defaultCodec(selected.mediaType, "request"),
        value,
        headers,
      )
      if (body !== undefined) init.body = body
    }
  }
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
  const selectedResponse = selectResponse(plan.responses, response.status)
  const actualMedia = mediaType(response.headers.get("content-type")) || null
  const selectedMedia = selectedResponse
    ? selectMedia(selectedResponse.content, actualMedia)
    : undefined
  const noBody = plan.method === "HEAD" || [204, 205, 304].includes(response.status)
  const codec = selectedMedia
    ? (selectedMedia.codec ?? defaultCodec(selectedMedia.mediaType, "response"))
    : selectedResponse?.content.length === 0
      ? { kind: "empty" as const }
      : fallbackCodec(actualMedia)
  let data: RequestValue | Response
  try {
    if (
      response.ok &&
      (!selectedResponse || (!noBody && selectedResponse.content.length > 0 && !selectedMedia))
    ) {
      throw new TypeError(
        `Undeclared response ${response.status} ${actualMedia ?? "(missing content-type)"} for ${plan.operationId}`,
      )
    }
    data = await decodeBody(codec, response, plan.method)
  } catch (cause) {
    const error = new DecodeError(response, endpoint, cause)
    if (!response.ok) throw new HttpError({ response, endpoint, body: undefined, cause: error })
    throw error
  }
  const validator = !noBody && selectedMedia?.schema
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

function credentialText(value: Credential): string {
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  return typeof value === "string" ? value : `${value.username}:${value.password}`
}
function applyCredentials(
  endpoint: EndpointDefinition,
  options: ClientOptions,
  headers: Headers,
  url: URL,
): void {
  const credentials = options.credentials ?? {}
  const requirement = endpoint.plan.security.find((entry) =>
    Object.keys(entry).every((name) => credentials[name] !== undefined),
  )
  if (!requirement) return
  for (const name of Object.keys(requirement)) {
    const scheme = endpoint.plan.securitySchemes[name]
    const credential = credentials[name]
    if (!scheme || credential === undefined) continue
    const value = credentialText(credential)
    if (scheme.type === "apiKey") {
      if (scheme.in === "header") headers.set(scheme.name, value)
      else if (scheme.in === "query") url.searchParams.append(scheme.name, value)
      else
        headers.set(
          "cookie",
          [headers.get("cookie"), `${encodeURIComponent(scheme.name)}=${encodeURIComponent(value)}`]
            .filter(Boolean)
            .join("; "),
        )
    } else if (scheme.type === "http") {
      if (scheme.scheme.toLowerCase() === "basic")
        headers.set("authorization", `Basic ${btoa(value)}`)
      else
        headers.set(
          "authorization",
          `${scheme.scheme.toLowerCase() === "bearer" ? "Bearer" : scheme.scheme} ${value}`,
        )
    } else if (scheme.type !== "mutualTLS") headers.set("authorization", `Bearer ${value}`)
  }
}
