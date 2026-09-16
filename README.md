# Accord

Accord generates a typed TypeScript SDK from OpenAPI 3.0 or 3.1. One semantic model produces the caller types, declarative endpoint plans, and optional response validators. A shared Fetch runtime executes those plans; TanStack React Query integration uses the same endpoints.

This is the `0.1.0-alpha.0` rewrite. Start with the [alpha review and verification results](docs/alpha-review.md) or [example APIs and generated SDKs](examples/README.md), then see [architecture](docs/architecture.md) and [verification](docs/testing.md).

For a complete backend-to-SDK workflow, try the [NestJS investment-platform example](examples/nest-market/README.md): a real backend generates OpenAPI, Accord generates its SDK, and the demo calls the running API.

## Generate and use an SDK

```sh
pnpm add @accord/client
pnpm add -D @accord/codegen typescript
pnpm exec accord generate openapi.yaml --output src/api.ts
# Optional native Zod response schemas:
pnpm add @accord/zod zod
pnpm exec accord generate openapi.yaml --output src/api.ts --validators @accord/zod
```

The packages are prepared for an alpha release; these commands require access to the package versions, or [local packed tarballs](docs/trying-the-alpha.md). Nothing is published automatically by this repository.

```ts
import { createClient } from "@accord/client"
import { api } from "./api.js"

const http = createClient(api, {
  baseUrl: "https://api.example.test/v1",
  token: () => session.getAccessToken(), // or a static token
  cacheScope: teamId,
})

const task = await http.tasks.create({ title: "Review", status: "open" })
const full = await http.tasks.get.withResponse({ id: task.id })
console.log(full.data, full.status, full.headers.get("x-request-id"))
```

Endpoint and namespace names come from the spec. The example above uses the [Tasks API](examples/tasks/openapi.yaml).

`baseUrl` controls routing; the SDK does not select from OpenAPI `servers`. Without it, requests use the browser origin (or `http://localhost` outside a browser). `token` accepts a value or async callback. `auth` accepts a provider or an ordered array of providers, including managed OAuth client credentials. Configured auth applies to every call; pass `{ auth: false }` in the second argument to skip it. See [authentication](docs/authentication.md) for examples and token caching.

## Request and response conventions

- Path, query, header and cookie inputs occupy the first object; request options (`headers`, `signal`) occupy the second.
- A required, closed object body is flattened when doing so preserves every field. Optional bodies, dictionaries, collisions, and non-object bodies automatically use `{ body: ... }`. Optional body absence stays distinct from `{ body: {} }`.
- Multiple request media types produce correlated argument tuples. Select an alternative using `options.headers["content-type"]`. Use this lowercase spelling and an inspectable header object; opaque header dictionaries cannot establish a safe media/input relationship.
- One successful status returns its payload. Multiple successful statuses return a `{ status, data }` union; status ranges account for bodyless 204/205 responses. `.withResponse()` also provides `headers`, `mediaType`, and the underlying Fetch `Response` (whose body may already be consumed).
- Dates stay strings. Binary downloads are `ArrayBuffer`; uploads accept `Blob`, `ArrayBuffer`, or `Uint8Array`.
- Caller inputs are trusted. Accord does not run request schema validation, inject defaults, coerce caller data, or strip dictionary fields.
- Without `--validators`, responses are decoded without schema validation. With validators, generated Standard Schema checks run on responses. Invalid JSON/transport data still causes a decode error regardless of schema validation.
- `HttpError` retains status, headers, endpoint, and decoded error body. If decoding or validation fails, `body` is `undefined` and `cause` records the failure. Network, decode, and response-validation failures have separate error classes.

```ts
const result = await http.imports.create(
  { body: "email\na@example.test" },
  { headers: { "content-type": "text/csv" }, signal },
)
if (result.status === 202) console.log(result.data.jobId)
else console.log(result.data.imported)
```

## React Query

```ts
import { useQuery } from "@tanstack/react-query"
import { apiQuery, apiMutation } from "@accord/react-query"

const query = useQuery({
  ...apiQuery(http.tasks.list, { status: "open" }),
  staleTime: 30_000,
  select: page => page.items,
})
// useMutation(apiMutation(http.tasks.create))
```

Use `apiQueryResponse` for full HTTP results. Ordinary mutations accept the default-media input; `apiMutationCall` uses the generated argument tuple as mutation variables. `AccordProvider` supplies client options to `useApiQuery` / `useApiMutation` when using unbound endpoint definitions.

Keys include API identity, server, account scope, inputs, headers, and result mode. Credentials use opaque identities rather than their values. Reuse the client/options object, and update `cacheScope` when a dynamic credential resolver switches accounts. Never place secrets in `cacheScope`.

## Generation options

```js
// accord.config.mjs
import { zodAdapter } from "@accord/zod"

export default {
  namespace: "path", // or "tag"
  basePath: "/v1",   // affects naming, not the HTTP path
  validators: zodAdapter(), // omit for no validation
  body: { overrides: { replaceAsset: "separate" } },
  defaultMediaTypes: { createImport: "application/json" },
  operationKinds: { search: "query" },
}
```

```sh
pnpm exec accord generate openapi.yaml -c accord.config.mjs -o src/api.ts
```

Generation produces one TypeScript file, including when `--validators` is enabled. Types are exported directly by name; no namespace or duplicate type aliases are needed. The optional `@accord/zod` adapter emits native `z.object`/`z.strictObject`, arrays, unions, and refinements, sharing referenced models. The schemas expose native Zod APIs and implement Standard Schema directly. Core codegen and client have no Ajv/Zod dependency. See the [adapter contract and supported schema features](packages/zod/README.md). File and HTTP references resolve relative to their source document, including embedded `$id` resources and anchors.

Response media entries reference their generated schemas directly, so the selected status and content type also select validation. Ordinary JSON, text and binary formats need no explicit codec metadata. Schema-dependent encodings such as XML, multipart and numeric text retain their codec details.

The programmatic API exposes `generate`, `generateFromFile`, and `writeGeneratedSdk`; generation returns `{ source, model }`. Use `writeGeneratedSdk` to write the file, or consume `source` directly. The CLI can also print the complete SDK to stdout, with or without validators.

## Develop

Node 22+, pnpm 11, TypeScript 5.9. Runtime packages use ESM and Fetch/Web platform APIs.

```sh
pnpm install
pnpm build
pnpm generate:test-fixtures
pnpm generate:examples
pnpm check
```

Fuzz failures save a minimized executable reproduction and a seed/replay path. See [testing](docs/testing.md) for the individual checks and the alpha's precision boundaries.
