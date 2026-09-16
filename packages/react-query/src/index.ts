import type { DecodeError, NetworkError, ValidationError } from "@accord/client"
import {
  type ArgumentsOf,
  type CheckedCall,
  type ClientOptions,
  createEndpointClient,
  type DefaultInputOf,
  type EndpointDefinition,
  type EndpointFunction,
  type ErrorOf,
  type FullResponseOf,
  getAuthProviders,
  getEndpointScope,
  type HttpError,
  type MutationEndpoint,
  type QueryEndpoint,
  type ReadonlyInput,
  type ResponseOf,
  resolveBaseUrl,
} from "@accord/client"
import type {
  DataTag,
  MutationKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
} from "@tanstack/react-query"
import {
  mutationOptions,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { createContext, createElement, type ReactNode, useContext } from "react"

export type ClientError<E extends EndpointDefinition> =
  | HttpError<ErrorOf<E>>
  | DecodeError
  | NetworkError
  | ValidationError

export interface BoundEndpoint<E extends EndpointDefinition> {
  readonly endpoint: E
  readonly context: ClientOptions
}
export type QueryTarget = QueryEndpoint | BoundEndpoint<QueryEndpoint>
export type MutationTarget = MutationEndpoint | BoundEndpoint<MutationEndpoint>
export type EndpointOf<T> =
  T extends BoundEndpoint<infer E> ? E : T extends EndpointDefinition ? T : never
export type ApiEndpointKey = readonly [prefix: string, ...path: string[]]
export type CanonicalQueryValue =
  | string
  | number
  | boolean
  | null
  | readonly CanonicalQueryValue[]
  | CanonicalQueryObject
export interface CanonicalQueryObject {
  readonly [key: string]: CanonicalQueryValue
}
export type ApiQueryKey = readonly [
  ...ApiEndpointKey,
  request: {
    readonly method: EndpointDefinition["method"]
    readonly context: CanonicalQueryValue
    readonly mode: "payload" | "response"
    readonly arguments: CanonicalQueryValue
  },
]
export type ApiMutationKey = readonly [
  ...ApiEndpointKey,
  request: {
    readonly method: EndpointDefinition["method"]
    readonly context: CanonicalQueryValue
  },
]

const EMPTY_OPTIONS: ClientOptions = Object.freeze({})
const Context = createContext<ClientOptions>(EMPTY_OPTIONS)
const identities = new WeakMap<object, string>()
function identity<T extends object>(value: T): string {
  let id = identities.get(value)
  if (!id) {
    id = crypto.randomUUID()
    identities.set(value, id)
  }
  return id
}

export function AccordProvider(props: {
  readonly options: ClientOptions
  readonly children?: ReactNode
}): ReactNode {
  return createElement(Context.Provider, { value: props.options }, props.children)
}

function unpack<T extends QueryTarget | MutationTarget>(
  target: T,
  fallback: ClientOptions = EMPTY_OPTIONS,
): BoundEndpoint<EndpointOf<T>> {
  const resolved = "endpoint" in target ? target : { endpoint: target, context: fallback }
  // SAFETY: EndpointOf uses precisely the same discriminant as this runtime branch.
  return resolved as BoundEndpoint<EndpointOf<T>>
}

export function endpointKeyPrefix(endpoint: EndpointDefinition): ApiEndpointKey {
  // Remove only the leading slash: interior/trailing empty segments distinguish real routes.
  return [getEndpointScope(endpoint) ?? "api", ...endpoint.path.replace(/^\//, "").split("/")]
}

function contextKey(bound: BoundEndpoint<EndpointDefinition>): CanonicalQueryValue {
  const context = bound.context
  const credentialIdentity =
    context.auth ||
    context.token ||
    context.headers ||
    context.fetch ||
    context.requestMiddleware?.length ||
    context.responseMiddleware?.length
      ? identity(context)
      : null
  return [resolveBaseUrl(context), context.cacheScope ?? null, credentialIdentity]
}

function canonical<T>(value: T, ancestors = new Set<object>()): CanonicalQueryValue {
  if (value === null) return null
  if (value === undefined) return ["undefined"]
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  if (typeof value === "string" || typeof value === "boolean") return value
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  if (typeof value === "number") return Number.isFinite(value) ? value : ["number", String(value)]
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  if (typeof value === "bigint") return ["bigint", value.toString()]
  if (value instanceof Date) return ["date", value.toISOString()]
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch an existing typed value without reparsing caller input.
  if (typeof value !== "object") throw new TypeError("Query inputs must be serializable")
  if (value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value))
    return ["binary", identity(value)]
  if (ancestors.has(value)) throw new TypeError("Query inputs must not contain cycles")
  ancestors.add(value)
  try {
    if (Array.isArray(value)) return ["array", value.map((item) => canonical(item, ancestors))]
    const result: { [key: string]: CanonicalQueryValue } = Object.create(null)
    for (const [key, item] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
      if (item !== undefined) result[key] = canonical(item, ancestors)
    }
    return ["object", Object.entries(result)]
  } finally {
    ancestors.delete(value)
  }
}

function argumentKey<E extends EndpointDefinition>(
  bound: BoundEndpoint<E>,
  args: ArgumentsOf<E>,
): CanonicalQueryValue {
  const endpoint = bound.endpoint
  const fields = getAuthProviders(bound.context.auth).flatMap(
    (provider) => provider.sensitiveFields ?? [],
  )
  const headers = new Headers(args[1]?.headers)
  const secretNames = new Set(["authorization", "proxy-authorization", "cookie", "set-cookie"])
  for (const field of fields) if (field.in === "header") secretNames.add(field.name.toLowerCase())
  const publicHeaders: { [key: string]: string } = Object.create(null)
  let hasSecret = false
  for (const [name, value] of headers) {
    if (secretNames.has(name)) hasSecret = true
    else publicHeaders[name] = value
  }
  const secretIdentity = hasSecret && args[1]?.headers ? identity(args[1].headers) : null
  const input = args[0] ?? {}
  const secretInputs = new Set(
    (endpoint.cookieParams ?? []).map((parameter) => parameter.inputName ?? parameter.name),
  )
  for (const parameter of endpoint.headerParams ?? [])
    if (secretNames.has(parameter.name.toLowerCase()))
      secretInputs.add(parameter.inputName ?? parameter.name)
  for (const field of fields) {
    const parameters =
      field.in === "query"
        ? endpoint.queryParams
        : field.in === "header"
          ? endpoint.headerParams
          : endpoint.cookieParams
    for (const parameter of parameters ?? [])
      if (
        field.in === "header"
          ? parameter.name.toLowerCase() === field.name.toLowerCase()
          : parameter.name === field.name
      )
        secretInputs.add(parameter.inputName ?? parameter.name)
  }
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- Identify an input object solely to redact credential fields in cache keys.
  if (secretInputs.size && input !== null && typeof input === "object") {
    const entries = Object.entries(input)
    if (entries.some(([key, value]) => secretInputs.has(key) && value !== undefined)) {
      const publicInput = Object.fromEntries(entries.filter(([key]) => !secretInputs.has(key)))
      return canonical([
        publicInput,
        publicHeaders,
        secretIdentity,
        identity(input),
        args[1]?.auth !== false,
      ])
    }
  }
  return canonical([input, publicHeaders, secretIdentity, args[1]?.auth !== false])
}

export function apiQueryKey<T extends QueryTarget>(
  target: T,
  ...args: ArgumentsOf<EndpointOf<T>>
): ApiQueryKey {
  const bound = unpack(target)
  return [
    ...endpointKeyPrefix(bound.endpoint),
    {
      method: bound.endpoint.method,
      context: contextKey(bound),
      mode: "payload",
      arguments: argumentKey(bound, args),
    },
  ]
}
export function apiMutationKey<T extends MutationTarget>(target: T): ApiMutationKey {
  const bound = unpack(target)
  return [
    ...endpointKeyPrefix(bound.endpoint),
    { method: bound.endpoint.method, context: contextKey(bound) },
  ]
}

function requestWithSignal<E extends EndpointDefinition>(
  request: EndpointFunction<E>,
  args: ArgumentsOf<E>,
  signal: AbortSignal,
  full: false,
): Promise<ResponseOf<E>>
function requestWithSignal<E extends EndpointDefinition>(
  request: EndpointFunction<E>,
  args: ArgumentsOf<E>,
  signal: AbortSignal,
  full: true,
): Promise<FullResponseOf<E>>
function requestWithSignal<E extends EndpointDefinition>(
  request: EndpointFunction<E>,
  args: ArgumentsOf<E>,
  signal: AbortSignal,
  full: boolean,
): Promise<ResponseOf<E> | FullResponseOf<E>> {
  const callerSignal = args[1]?.signal
  const merged = [
    args[0],
    { ...args[1], signal: callerSignal ? AbortSignal.any([callerSignal, signal]) : signal },
  ] as const
  // SAFETY: preserve the complete caller input/media pair; only compose the cancellation signal.
  const call = merged as ArgumentsOf<E>
  // SAFETY: the public API checked the input/header pair; this adapter only added a signal.
  const invoke = (full ? request.withResponse : request) as (
    ...args: ArgumentsOf<E>
  ) => Promise<ResponseOf<E> | FullResponseOf<E>>
  return invoke(...call)
}

export type ApiQueryOptions<
  E extends EndpointDefinition,
  Data = ResponseOf<E>,
> = UndefinedInitialDataOptions<Data, ClientError<E>, Data, ApiQueryKey> & {
  queryKey: DataTag<ApiQueryKey, Data, ClientError<E>>
}

function queryImplementation<T extends QueryTarget>(
  target: T,
  ...args: ArgumentsOf<EndpointOf<T>>
): ApiQueryOptions<EndpointOf<T>> {
  const bound = unpack(target)
  const request = createEndpointClient(bound.endpoint, bound.context)
  // SAFETY: TanStack's data tag is compile-time evidence associating this exact key with queryFn's result.
  const queryKey = apiQueryKey(target, ...args) as DataTag<
    ApiQueryKey,
    ResponseOf<EndpointOf<T>>,
    ClientError<EndpointOf<T>>
  >
  return { queryKey, queryFn: ({ signal }) => requestWithSignal(request, args, signal, false) }
}

function queryResponseImplementation<T extends QueryTarget>(
  target: T,
  ...args: ArgumentsOf<EndpointOf<T>>
): ApiQueryOptions<EndpointOf<T>, FullResponseOf<EndpointOf<T>>> {
  const bound = unpack(target)
  const request = createEndpointClient(bound.endpoint, bound.context)
  const key: ApiQueryKey = [
    ...endpointKeyPrefix(bound.endpoint),
    {
      method: bound.endpoint.method,
      context: contextKey(bound),
      mode: "response",
      arguments: argumentKey(bound, args),
    },
  ]
  // SAFETY: this cache mode always executes withResponse and therefore has the full-result data tag.
  const queryKey = key as DataTag<
    ApiQueryKey,
    FullResponseOf<EndpointOf<T>>,
    ClientError<EndpointOf<T>>
  >
  return { queryKey, queryFn: ({ signal }) => requestWithSignal(request, args, signal, true) }
}

export const apiQuery: <T extends QueryTarget, const A extends readonly unknown[]>(
  target: T,
  ...args: A & CheckedCall<EndpointOf<T>, A>
) => ReturnType<typeof queryImplementation<T>> = queryImplementation
export const apiQueryResponse: <T extends QueryTarget, const A extends readonly unknown[]>(
  target: T,
  ...args: A & CheckedCall<EndpointOf<T>, A>
) => ReturnType<typeof queryResponseImplementation<T>> = queryResponseImplementation

/** Ordinary mutations accept the default-media input. Use apiMutationCall for correlated argument tuples. */
export function apiMutation<T extends MutationTarget>(target: T) {
  const bound = unpack(target)
  const request = createEndpointClient(bound.endpoint, bound.context)
  return mutationOptions<
    ResponseOf<EndpointOf<T>>,
    ClientError<EndpointOf<T>>,
    ReadonlyInput<DefaultInputOf<EndpointOf<T>>>
  >({
    mutationKey: apiMutationKey(target),
    mutationFn: (input) => {
      // SAFETY: this convenience form selects default request options; the generator supplies the input contract.
      const args = [input] as ArgumentsOf<EndpointOf<T>>
      // SAFETY: default mutation inputs are already derived from the default argument variant.
      const invoke = request as (
        ...args: ArgumentsOf<EndpointOf<T>>
      ) => Promise<ResponseOf<EndpointOf<T>>>
      return invoke(...args)
    },
  })
}

export function apiMutationCall<T extends MutationTarget>(
  target: T,
): UseMutationOptions<
  ResponseOf<EndpointOf<T>>,
  ClientError<EndpointOf<T>>,
  ArgumentsOf<EndpointOf<T>>
> & { mutationKey: MutationKey } {
  const bound = unpack(target)
  const request = createEndpointClient(bound.endpoint, bound.context)
  return mutationOptions<
    ResponseOf<EndpointOf<T>>,
    ClientError<EndpointOf<T>>,
    ArgumentsOf<EndpointOf<T>>
  >({
    mutationKey: apiMutationKey(target),
    mutationFn: (args) => {
      // SAFETY: mutation variables carry the complete generated argument tuple.
      const invoke = request as (
        ...args: ArgumentsOf<EndpointOf<T>>
      ) => Promise<ResponseOf<EndpointOf<T>>>
      return invoke(...args)
    },
  })
}

export function useApiQuery<T extends QueryTarget>(
  target: T,
  ...args: ArgumentsOf<EndpointOf<T>>
): UseQueryResult<ResponseOf<EndpointOf<T>>, ClientError<EndpointOf<T>>> {
  const options = useContext(Context)
  return useQuery(queryImplementation(unpack(target, options), ...args))
}
export function useApiMutation<T extends MutationTarget>(
  target: T,
): UseMutationResult<
  ResponseOf<EndpointOf<T>>,
  ClientError<EndpointOf<T>>,
  ReadonlyInput<DefaultInputOf<EndpointOf<T>>>
> {
  const options = useContext(Context)
  return useMutation(apiMutation(unpack(target, options)))
}
export type { QueryKey }
