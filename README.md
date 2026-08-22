# Accord

Type-safe TypeScript SDK generation from OpenAPI.

Accord generates a single endpoint metadata object and complete request/response types from an OpenAPI document. HTTP and TanStack Query clients are then derived from that object through TypeScript inference.

## Intended API

Given operations such as:

```text
GET   /users/{userId}        operationId: getUser
PATCH /users/{userId}        operationId: updateUser
GET   /users/{userId}/posts  operationId: listPosts
```

Accord should generate an API object shaped like:

```ts
api.users.getUser
api.users.updateUser
api.users.posts.listPosts
```

Dynamic path segments are function inputs, not namespace segments:

```ts
const http = createClient(api, { baseUrl: "/api" })

const user = await http.users.getUser({ userId })

const posts = await http.users.posts.listPosts({
  userId,
  limit: 20,
})
```

React Query uses the same inferred inputs:

```ts
useApiQuery(api.users.getUser, { userId })

const updateUser = useApiMutation(api.users.updateUser)
updateUser.mutate({ userId, name: "Erwin" })
```

## Design decisions

- OpenAPI is the compile-time source of truth.
- The generated `api` object is transport-independent.
- Runtime endpoint descriptors preserve canonical OpenAPI distinctions between path, query, headers, body, and response types.
- Path parameters are passed to functions/hooks rather than represented in the object hierarchy.
- Namespace defaults to static path segments plus an operation leaf. OpenAPI tags are an optional namespace strategy.
- Operation naming precedence is `x-sdk-name`, then `operationId`, then a deterministic fallback.
- Request bodies can be generated in `merge` or `separate` mode. Merge-mode collisions are generation errors by default.
- The default distribution is small runtime packages plus codegen; a future standalone mode can vendor the generic runtime into generated output.

## Packages

- `@accord/codegen` — OpenAPI parsing, normalization, type generation, and endpoint-object generation.
- `@accord/client` — generic typed HTTP client derived from the generated endpoint object.
- `@accord/react-query` — TanStack Query integration derived from the same endpoint descriptors.

## Status

Initial architecture scaffold. The next implementation milestone is the normalized endpoint descriptor and OpenAPI-to-descriptor generator.
