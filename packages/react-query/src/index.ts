import {
  type ClientOptions,
  createEndpointClient,
  type EndpointDescriptor,
  type ErrorOf,
  type HttpError,
  type InputOf,
  type MutationEndpoint,
  type QueryEndpoint,
  type ResponseOf,
} from "@accord/client"
import {
  mutationOptions,
  type QueryKey,
  queryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

export type ApiEndpointKey = readonly [
  scope: "accord",
  method: string,
  path: string,
  operationId: string | null,
]
export type ApiQueryKey = readonly [...ApiEndpointKey, input: unknown]
export type ApiMutationKey = ApiEndpointKey

export type ApiQueryOptions<E extends QueryEndpoint, TData = ResponseOf<E>> = Omit<
  UseQueryOptions<ResponseOf<E>, HttpError<ErrorOf<E>>, TData, ApiQueryKey>,
  "queryKey" | "queryFn"
> & {
  readonly clientOptions?: ClientOptions
}

export type ApiMutationOptions<E extends MutationEndpoint, TContext = unknown> = Omit<
  UseMutationOptions<ResponseOf<E>, HttpError<ErrorOf<E>>, InputOf<E>, TContext>,
  "mutationKey" | "mutationFn"
> & {
  readonly clientOptions?: ClientOptions
}

export function endpointIdentity(endpoint: EndpointDescriptor): ApiEndpointKey {
  return [
    "accord",
    endpoint.method.toUpperCase(),
    endpoint.path,
    endpoint.operationId ?? null,
  ]
}

export function apiQueryKey<E extends QueryEndpoint>(endpoint: E, input: InputOf<E>): ApiQueryKey {
  return [...endpointIdentity(endpoint), canonicalQueryValue(input)]
}

export function apiMutationKey<E extends MutationEndpoint>(endpoint: E): ApiMutationKey {
  return endpointIdentity(endpoint)
}

export function apiQuery<E extends QueryEndpoint, TData = ResponseOf<E>>(
  endpoint: E,
  input: InputOf<E>,
  options: ApiQueryOptions<E, TData> = {},
) {
  const { clientOptions, ...queryConfiguration } = options
  const request = createEndpointClient(endpoint, clientOptions)
  return queryOptions({
    ...queryConfiguration,
    queryKey: apiQueryKey(endpoint, input),
    queryFn: ({ signal }) => request(input, { signal }),
  })
}

export function useApiQuery<E extends QueryEndpoint, TData = ResponseOf<E>>(
  endpoint: E,
  input: InputOf<E>,
  options: ApiQueryOptions<E, TData> = {},
): UseQueryResult<TData, HttpError<ErrorOf<E>>> {
  return useQuery(apiQuery(endpoint, input, options))
}

export function apiMutation<E extends MutationEndpoint, TContext = unknown>(
  endpoint: E,
  options: ApiMutationOptions<E, TContext> = {},
) {
  const { clientOptions, ...mutationConfiguration } = options
  const request = createEndpointClient(endpoint, clientOptions)
  return mutationOptions({
    ...mutationConfiguration,
    mutationKey: apiMutationKey(endpoint),
    mutationFn: (input: InputOf<E>) => request(input),
  })
}

export function useApiMutation<E extends MutationEndpoint, TContext = unknown>(
  endpoint: E,
  options: ApiMutationOptions<E, TContext> = {},
): UseMutationResult<ResponseOf<E>, HttpError<ErrorOf<E>>, InputOf<E>, TContext> {
  return useMutation(apiMutation(endpoint, options))
}

function canonicalQueryValue(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || typeof value !== "object") return value
  if (value instanceof Date) return value.toISOString()
  if (seen.has(value)) throw new TypeError("Accord query inputs must not contain cycles")
  seen.add(value)

  if (Array.isArray(value)) {
    const result = value.map((item) => canonicalQueryValue(item, seen))
    seen.delete(value)
    return result
  }

  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>
  for (const key of Object.keys(value).sort()) {
    const item = (value as Readonly<Record<string, unknown>>)[key]
    if (item !== undefined) result[key] = canonicalQueryValue(item, seen)
  }
  seen.delete(value)
  return result
}

export type { QueryKey }
