# Authentication

Auth belongs to the client and applies to every call. Generated endpoints contain no `security` or `securitySchemes`; OpenAPI security declarations do not control credential injection.

## A token or a callback

```ts
import { createClient } from "@accord/client"
import { api } from "./api.js"

const client = createClient(api, {
  baseUrl: "https://api.example.com",
  token: "access-token",
})

const sessionClient = createClient(api, {
  baseUrl: "https://api.example.com",
  token: () => auth0.getAccessTokenSilently(),
  cacheScope: currentAccountId,
})

// Skip the configured auth for this request:
await client.users.listUsers({}, { auth: false })
```

The token callback may be synchronous or asynchronous and runs for every request unless `auth: false`. It can return `undefined` to omit the bearer header. Opting out skips token/provider execution; explicitly supplied headers still apply.

## Providers

Use a provider for another mechanism, or an array to combine mechanisms. Array entries run in order:

```ts
import { ApiKeyAuth, BasicAuth, BearerAuth, CustomAuth, createClient } from "@accord/client"

const client = createClient(api, {
  baseUrl: "https://api.example.com",
  auth: [
    BearerAuth(() => session.getAccessToken()),
    ApiKeyAuth(partnerKey, { in: "header", name: "x-api-key" }),
  ],
})

const basicClient = createClient(api, {
  auth: BasicAuth(username, password),
})

const customClient = createClient(api, {
  auth: CustomAuth(async request => {
    request.headers.set("authorization", `Bearer ${await session.getAccessToken()}`)
  }),
})
```

`StaticBearerAuth(token)` aliases `BearerAuth(token)`. `ApiKeyAuth` requires an explicit header/query/cookie location and name. These settings come from client configuration; there is no generated scheme-name map or `credentials` option.

The interface is small:

```ts
interface AuthField {
  readonly in: "header" | "query" | "cookie"
  readonly name: string
}
interface AuthProvider {
  readonly sensitiveFields?: readonly AuthField[]
  apply(request: AuthRequest): void | Promise<void>
}
```

`AuthRequest` supplies mutable `headers` and `url`, the Fetch `init`, endpoint metadata, and the client's resolved `baseUrl`. A provider exception aborts the call before the API fetch.

An explicit `auth` option takes precedence over `token`; `auth: []` disables both. Later providers can overwrite earlier headers. Per-call headers override provider headers. For operation-specific behavior, a custom provider can inspect `request.endpoint`.

## Managed client credentials

```ts
import { OAuthClientCredentialsAuth, createClient } from "@accord/client"

const client = createClient(api, {
  baseUrl: "https://api.example.com/v1/",
  auth: OAuthClientCredentialsAuth({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    tokenUrl: "https://identity.example.com/oauth/token",
    scopes: ["documents:read"],
  }),
})
```

The token URL is required; scopes default to an empty set. Use this provider on a trusted server that can hold a client secret. It performs the client-credentials grant, caches the bearer token until shortly before expiry, and shares concurrent acquisitions for the same URL and scope set. Expiry defaults to no persistent caching when `expires_in` is absent. Acquisition failures clear the pending request so later calls can retry. API calls are never replayed automatically after a 401.

The provider uses `client_secret_basic` by default, with form-encoded credential components. `authentication: "client_secret_post"` supports providers requiring body credentials. It has its own optional `fetch`, a 30-second acquisition timeout, and a 30-second refresh skew capped at 10% of token lifetime. HTTPS is required except for loopback development URLs; token redirects are rejected. Relative token URLs resolve against `baseUrl`, so include a trailing slash when it denotes a directory.

Authorization-code, PKCE, device flows, and refresh-token rotation belong to the application's OAuth library for now. Supply its access-token callback through the same interface.

## Query caching

React Query keys isolate clients with tokens or providers by opaque context identity; configured credential values are never inserted into keys. Authenticated and `auth: false` calls use separate keys. Reuse the client/options object. When a callback changes accounts, update the public `cacheScope` or recreate the client and clear the old account's cache.

Authorization and cookie headers/parameters are always treated as sensitive. `ApiKeyAuth` also declares its placement through `sensitiveFields`, so bound-client keys hide API keys supplied through matching input fields or per-call headers. Custom providers can declare their fields with `CustomAuth(callback, [{ in: "header", name: "x-session-key" }])`. Custom secrets in other ordinary input fields cannot be inferred automatically. Use bound endpoints, or hooks with the configured client context, so these provider declarations are available when constructing keys.
