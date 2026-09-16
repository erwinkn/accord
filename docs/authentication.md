# Authentication

Auth belongs to the client. The SDK describes which security schemes each endpoint accepts; reusable providers supply credentials. Generated endpoint methods never implement login or token refresh.

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
```

The callback may be synchronous or asynchronous and runs for each authenticated request. It can return `undefined` to omit the header. This shortcut handles HTTP Bearer, OAuth2, and OpenID Connect schemes. It does not send credentials to operations with no security requirement.

## Named providers

When an API uses multiple schemes, keys match the OpenAPI security scheme names:

```ts
import { ApiKeyAuth, BasicAuth, BearerAuth, CustomAuth, createClient } from "@accord/client"

const client = createClient(api, {
  baseUrl: "https://api.example.com",
  auth: {
    bearer: BearerAuth(() => session.getAccessToken()),
    partnerKey: ApiKeyAuth(partnerKey),
    adminBasic: BasicAuth(username, password),
  },
})

const customClient = createClient(api, {
  auth: CustomAuth(async request => {
    request.headers.set("authorization", `Bearer ${await session.getAccessToken()}`)
  }),
})
```

`StaticBearerAuth(token)` aliases `BearerAuth(token)`. `ApiKeyAuth(key)` uses the scheme's header/query/cookie location. An optional second argument `{ in: "header", name: "x-api-key" }` overrides placement. `BasicAuth` accepts a username and password. The existing `credentials` map remains supported for static credentials.

The interface is small:

```ts
interface AuthProvider {
  apply(request: AuthRequest): void | Promise<void>
}
```

`AuthRequest` supplies mutable `headers` and `url`, the Fetch `init`, endpoint metadata, selected `scheme`, required `scopes`, and the client's resolved `baseUrl`.

Security alternatives retain OpenAPI semantics: entries in `security` are OR; schemes within an entry are AND. Accord chooses the first alternative with all providers configured, then invokes those providers. An empty alternative allows an anonymous request. With no matching alternative, Accord sends the request without automatically acquired credentials; the server remains responsible for access control. A provider exception aborts the request before the API fetch.

A single `auth` provider handles the schemes in the selected alternative; a named map is preferable when an API combines different credential mechanisms. Explicit providers take precedence over `credentials`, which takes precedence over `token`. Per-call headers override auth headers. Public endpoints do not invoke providers; use request middleware for application-specific headers on every request.

## Managed client credentials

```ts
import { OAuthClientCredentialsAuth, createClient } from "@accord/client"

const client = createClient(api, {
  baseUrl: "https://api.example.com/v1/",
  auth: {
    serviceOAuth: OAuthClientCredentialsAuth({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      // Optional when the scheme declares flows.clientCredentials.tokenUrl:
      tokenUrl: "https://identity.example.com/oauth/token",
      // Optional: otherwise use the endpoint's required scopes.
      scopes: ["documents:read"],
    }),
  },
})
```

Use this provider on a trusted server that can hold a client secret. It performs the client-credentials grant, caches the bearer token until shortly before expiry, and shares concurrent acquisitions for the same URL and scope set. Expiry defaults to no persistent caching when `expires_in` is absent. Acquisition failures clear the pending request so later calls can retry. API calls are never replayed automatically after a 401.

The provider uses `client_secret_basic` by default, with form-encoded credential components. `authentication: "client_secret_post"` supports providers requiring body credentials. It has its own optional `fetch`, a 30-second acquisition timeout, and a 30-second refresh skew capped at 10% of token lifetime. HTTPS is required except for loopback development URLs; token redirects are rejected. Relative declared token URLs resolve against `baseUrl`, so include a trailing slash when it denotes a directory.

Authorization-code, PKCE, device flows, and refresh-token rotation belong to the application's OAuth library for now. Supply its access-token callback through the same interface.

## Query caching

React Query keys isolate clients with credentials, token callbacks, or providers by opaque context identity; credential values are never inserted into keys. Reuse the client/options object. When a callback changes accounts, update the public `cacheScope` or recreate the client and clear the old account's cache. Custom secrets supplied as ordinary input fields or unknown header names cannot be inferred automatically; use provider-managed credentials or declared security schemes.
