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
export type CanonicalQueryPrimitive = string | number | boolean | null | undefined
export type CanonicalQueryValue =
  | CanonicalQueryPrimitive
  | readonly CanonicalQueryValue[]
  | CanonicalQueryObject

export interface CanonicalQueryObject {
  readonly [key: string]: CanonicalQueryValue
}

interface MutableCanonicalQueryObject {
  [key: string]: CanonicalQueryValue
}

export type ApiQueryKey = readonly [...ApiEndpointKey, input: CanonicalQueryValue]
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
  return ["accord", endpoint.method.toUpperCase(), endpoint.path, endpoint.operationId ?? null]
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

function isCanonicalPrimitive<TValue>(value: TValue): value is TValue & CanonicalQueryPrimitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
}

function isBigInt<TValue>(value: TValue): value is TValue & bigint {
  return typeof value === "bigint"
}

function isPlainQueryObject<TValue>(value: TValue): value is TValue & object {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function canonicalQueryValue<TValue>(
  value: TValue,
  ancestors: WeakSet<object> = new WeakSet(),
): CanonicalQueryValue {
  if (isCanonicalPrimitive(value)) return value
  if (isBigInt(value)) return value.toString()
  if (value instanceof Date) return value.toISOString()

  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError("Accord query inputs must not contain cycles")
    ancestors.add(value)
    try {
      return value.map((item) => canonicalQueryValue(item, ancestors))
    } finally {
      ancestors.delete(value)
    }
  }

  if (!isPlainQueryObject(value)) {
    throw new TypeError(
      "Accord query inputs must contain only plain objects and serializable values",
    )
  }
  if (ancestors.has(value)) throw new TypeError("Accord query inputs must not contain cycles")

  ancestors.add(value)
  try {
    const result: MutableCanonicalQueryObject = Object.create(null)
    for (const [key, item] of Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      if (item !== undefined) result[key] = canonicalQueryValue(item, ancestors)
    }
    return result
  } finally {
    ancestors.delete(value)
  }
}

export type { QueryKey }
