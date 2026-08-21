import { type ClientFor, createClient, type HttpError } from "@accord/client"
import { apiMutation, apiQuery, useApiMutation, useApiQuery } from "@accord/react-query"
import { api as featureApi } from "../generated/features.js"
import { type AccordTypes, api, type components } from "../generated/users.js"

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2 ? true : false
type Expect<TValue extends true> = TValue

type User = components["schemas"]["User"]
type ApiError = components["schemas"]["ApiError"]

declare const http: ClientFor<typeof api>

const listPromise = http.users.listUsers({ limit: 20 })
const getPromise = http.users.getUser({ userId: "123" })
const createPromise = http.users.createUser({ name: "Alice" })

type _ListResponse = Expect<Equal<Awaited<typeof listPromise>, readonly User[]>>
type _GetResponse = Expect<Equal<Awaited<typeof getPromise>, User>>
type _CreateResponse = Expect<Equal<Awaited<typeof createPromise>, User>>
type _GeneratedInput = Expect<Equal<AccordTypes.UsersGetUserInput, { readonly userId: string }>>
type _TypedError = Expect<Equal<AccordTypes.UsersGetUserError, ApiError>>

// @ts-expect-error userId is required
http.users.getUser({})
// @ts-expect-error userId is a string
http.users.getUser({ userId: 1 })
// @ts-expect-error unknown query property
http.users.listUsers({ limit: 20, page: 2 })
// @ts-expect-error name is required in the merged body
http.users.createUser({})
// @ts-expect-error email is a string
http.users.createUser({ name: "Alice", email: 123 })

const concrete = createClient(api, { baseUrl: "https://example.test" })
const concreteResult: Promise<User> = concrete.users.getUser({ userId: "1" })
void concreteResult

const queryOptions = apiQuery(api.users.getUser, { userId: "1" })
const mutationOptions = apiMutation(api.users.createUser)
void queryOptions
void mutationOptions

const queryResult = useApiQuery(api.users.getUser, { userId: "1" })
const mutationResult = useApiMutation(api.users.createUser)
const queryData: User | undefined = queryResult.data
mutationResult.mutate({ name: "Alice", email: "alice@example.test" })
void queryData

// @ts-expect-error mutations cannot be passed to apiQuery
apiQuery(api.users.createUser, { name: "Alice" })
// @ts-expect-error queries cannot be passed to apiMutation
apiMutation(api.users.getUser)
// @ts-expect-error mutation input is inferred
mutationResult.mutate({ email: "missing-name@example.test" })

featureApi.organizations.users.searchUsers satisfies {
  readonly parameters: readonly unknown[]
}
const featureHttp = createClient(featureApi, { baseUrl: "https://example.test" })
featureHttp.organizations.users.searchUsers({
  organizationId: "org-1",
  session: "session-cookie",
  roles: ["admin"],
  filter: { active: true },
  xRequestId: "request-1",
})
featureHttp.uploads.uploadFile({ body: { file: "contents" } })
featureHttp.health.get()

featureHttp.organizations.users.searchUsers({
  // @ts-expect-error raw hyphenated path name is not the public input key
  "organization-id": "org-1",
  session: "session-cookie",
})

declare const typedHttpError: HttpError<ApiError>
const errorCode: string = typedHttpError.body.code
void errorCode
