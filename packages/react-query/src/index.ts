import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"
import {
  createClient,
  type ClientOptions,
  type EndpointDescriptor,
  type InputOf,
} from "@accord/client"

type ResponseOf<E> = E extends EndpointDescriptor<infer T>
  ? T extends { response?: infer R } ? R : unknown
  : never

export interface ApiQueryContext {
  readonly clientOptions?: ClientOptions
}

export function useApiQuery<E extends EndpointDescriptor>(
  endpoint: E,
  input: InputOf<E>,
  options: Omit<UseQueryOptions<ResponseOf<E>>, "queryKey" | "queryFn"> = {},
  context: ApiQueryContext = {},
) {
  const request = createClient({ endpoint }, context.clientOptions).endpoint

  return useQuery({
    ...options,
    queryKey: [endpoint.operationId ?? endpoint.method, endpoint.path, input],
    queryFn: () => request(input),
  })
}

export function useApiMutation<E extends EndpointDescriptor>(
  endpoint: E,
  options: Omit<UseMutationOptions<ResponseOf<E>, unknown, InputOf<E>>, "mutationFn"> = {},
  context: ApiQueryContext = {},
) {
  const request = createClient({ endpoint }, context.clientOptions).endpoint

  return useMutation({
    ...options,
    mutationFn: input => request(input),
  })
}
