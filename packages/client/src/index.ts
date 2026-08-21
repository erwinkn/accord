export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | (string & {})

export interface EndpointTypes {
  path?: unknown
  query?: unknown
  headers?: unknown
  body?: unknown
  response?: unknown
  error?: unknown
}

export interface EndpointDescriptor<T extends EndpointTypes = EndpointTypes> {
  readonly kind: "endpoint"
  readonly method: HttpMethod
  readonly path: string
  readonly operationId?: string
  readonly pathParams?: readonly string[]
  readonly queryParams?: Readonly<Record<string, QueryParameterMetadata>>
  readonly bodyMode?: "merge" | "separate"
  readonly __types?: T
}

export interface QueryParameterMetadata {
  readonly style?: string
  readonly explode?: boolean
  readonly allowReserved?: boolean
}

type Compact<T> = { [K in keyof T]: T[K] } & {}
type NonNever<T, Fallback = {}> = [T] extends [never] ? Fallback : T

type TypesOf<E> = E extends EndpointDescriptor<infer T> ? T : never

type PathOf<E> = TypesOf<E> extends { path?: infer T } ? NonNever<T> : {}
type QueryOf<E> = TypesOf<E> extends { query?: infer T } ? NonNever<T> : {}
type HeadersOf<E> = TypesOf<E> extends { headers?: infer T } ? NonNever<T> : {}
type BodyOf<E> = TypesOf<E> extends { body?: infer T } ? NonNever<T> : {}
type ResponseOf<E> = TypesOf<E> extends { response?: infer T } ? T : unknown

export type InputOf<E extends EndpointDescriptor> = E["bodyMode"] extends "separate"
  ? Compact<PathOf<E> & QueryOf<E> & HeadersOf<E> & { body: BodyOf<E> }>
  : Compact<PathOf<E> & QueryOf<E> & HeadersOf<E> & BodyOf<E>>

export type ClientFor<T> = T extends EndpointDescriptor
  ? (input: InputOf<T>) => Promise<ResponseOf<T>>
  : T extends object
    ? { [K in keyof T]: ClientFor<T[K]> }
    : never

export interface ClientOptions {
  baseUrl?: string
  fetch?: typeof globalThis.fetch
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>)
}

export function createClient<const TApi extends object>(
  api: TApi,
  options: ClientOptions = {},
): ClientFor<TApi> {
  return mapApi(api, endpoint => createRequest(endpoint, options)) as ClientFor<TApi>
}

function mapApi(value: unknown, mapEndpoint: (endpoint: EndpointDescriptor) => unknown): unknown {
  if (isEndpoint(value)) return mapEndpoint(value)

  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, mapApi(child, mapEndpoint)]),
  )
}

function isEndpoint(value: unknown): value is EndpointDescriptor {
  return Boolean(value && typeof value === "object" && (value as EndpointDescriptor).kind === "endpoint")
}

function createRequest(endpoint: EndpointDescriptor, options: ClientOptions) {
  return async (input: Record<string, unknown> = {}) => {
    const fetchImpl = options.fetch ?? globalThis.fetch
    let path = endpoint.path

    for (const name of endpoint.pathParams ?? []) {
      const value = input[name]
      if (value === undefined || value === null) {
        throw new Error(`Missing path parameter: ${name}`)
      }
      path = path.replace(`{${name}}`, encodeURIComponent(String(value)))
    }

    const url = new URL(path, options.baseUrl ?? "http://localhost")

    for (const name of Object.keys(endpoint.queryParams ?? {})) {
      const value = input[name]
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(name, String(item))
      } else {
        url.searchParams.set(name, String(value))
      }
    }

    const configuredHeaders = typeof options.headers === "function"
      ? await options.headers()
      : options.headers

    const init: RequestInit = {
      method: endpoint.method,
      headers: configuredHeaders,
    }

    const response = await fetchImpl(url, init)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${endpoint.method} ${endpoint.path}`)
    }

    if (response.status === 204) return undefined
    const contentType = response.headers.get("content-type") ?? ""
    return contentType.includes("application/json") ? response.json() : response.text()
  }
}
