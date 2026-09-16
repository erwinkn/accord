# NestJS → OpenAPI → Accord

A runnable investment-platform API with **18 endpoints and 22 schemas**. Nest controllers and DTOs produce the OpenAPI document; Accord consumes that document to generate the SDK and response validators. The tests execute the SDK against a real Nest HTTP server.

This example models a financial marketplace using Nest 10 and Swagger 7, with representative investment, entity, and document workflows. It runs entirely in memory, with a public demo credential, no database, and no external services.

## Read it in this order

1. [Typed SDK workflow](usage.ts): create an offering and investor, subscribe, submit, upload/download a document, export CSV.
2. [Offering controller](src/offerings/offerings.controller.ts) and [DTOs](src/offerings/offering.dto.ts): the Nest source of the contract.
3. [Generated OpenAPI](openapi.json): Swagger output with explicit closed DTOs, also served by Swagger UI.
4. [Generated SDK](sdk/sdk.ts): public types, endpoint plans, and Standard Schema validators.

```text
Nest controllers + DTO decorators
       ↓ SwaggerModule.createDocument + DTO closure
   openapi.json                    ← committed, reproducible
       ↓ Accord, with validators
   sdk/sdk.ts                     ← types, plans and validators in one file
       ↓ createClient / React Query
   real Nest server
```

## Run it

From the repository root, using Node 22+:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm example:nest:generate   # export the spec, then generate the SDK
pnpm example:nest:demo       # start a temporary server, run the workflow, close it
pnpm test:nest               # regeneration checks and live HTTP tests
```

To run the server yourself: `pnpm example:nest:start`. It listens on `127.0.0.1:3100`, with Swagger UI at `/docs`, the document at `/docs-json`, and routes under `/api/v1`. Set `PORT` to change the listener. The generated document keeps its fixed example server; pass the actual server origin to the client when using another port.

Use bearer token `accord-demo-token`. This is an intentionally public demo credential, not a production authentication implementation. The demo command starts its own server on a free port and requires no setup or environment variables.

## What it exercises

| Area | Server contract | Generated SDK behavior |
| --- | --- | --- |
| Offerings | Nested terms, currency/status enums, repeated query filters, concrete page DTOs | Typed nested inputs and page items; exact decimal strings; dates remain strings |
| Updates | Swagger `PartialType`, optional fields, explicitly nullable description | Partial updates preserve omitted values; `null` remains distinct from absence |
| Investors | Individuals and companies, `OmitType` response DTOs, `oneOf` with a `kind` discriminator | Narrow the response by `kind`; onboarding-only data is omitted |
| Subscriptions | Nested routes, dynamic string metadata, synchronous 200 or accepted 202 | Path/body binding, dictionary preservation, automatic status/data union |
| Jobs | A job resource returned by the 202 branch | Typed follow-up call using `jobId`; full response exposes `Location` |
| Documents | Real Multer multipart upload, metadata, streamed binary download, 204 deletion | `File`/`Blob`/`Uint8Array`/`ArrayBuffer` upload; byte-exact `ArrayBuffer` download |
| Exports | JSON or CSV selected by `Accept` | `.withResponse()` exposes a media-type-discriminated data union |
| Boundaries | Bearer guard, Nest validation, structured errors and request IDs | Credentials, second-argument headers, typed errors, optional generated response validation |
| React Query | Ordinary generated query endpoint | `apiQuery` options execute against the same backend |

The job path completes work inline for deterministic demonstrations. It models the 202/job HTTP contract without adding a queue. Data resets when the app closes; this is an SDK integration example, not a financial business engine.

## What using the SDK looks like

```ts
import { createMarketClient } from "./usage.js"

const client = createMarketClient("http://127.0.0.1:3100", "accord-demo-token")
const page = await client.offerings.listOfferings({
  status: ["open", "draft"], page: 1, limit: 20,
})

// Path and body fields share one input object; Accord handles their wire locations.
const subscription = await client.subscriptions.createSubscription({
  offeringId, investorId, amount: "2500.00",
  metadata: { advisor: "demo" },
})

const outcome = await client.subscriptions.submitSubscription(
  { subscriptionId: subscription.id, background: true },
  { headers: { "x-request-id": "submit-42" } },
)
if (outcome.status === 202) {
  const job = await client.jobs.getSubmissionJob({ jobId: outcome.data.jobId })
} else {
  console.log(outcome.data.submittedAt)
}

const report = await client.offerings.exportOffering.withResponse(
  { offeringId }, { headers: { accept: "text/csv" } },
)
if (report.mediaType === "text/csv") console.log(report.data.trim())
else console.log(report.data.subscriptionCount)
```

Creates and uploads use **flat inputs**, including nested terms, metadata dictionaries, and files. Nest Swagger 7 leaves DTOs open to arbitrary properties by default. The [document factory](src/app.ts) explicitly sets `additionalProperties: false` on this example's fixed request and response DTOs. Concrete page DTOs include both pagination fields and items, so closure applies to the whole record. Nested dictionaries such as subscription metadata retain their arbitrary string keys. Both Swagger UI and Accord use this same exported contract; the SDK needs no body-mode overrides.

The one explicit `body` example is the optional PATCH payload: `client.offerings.updateOffering({ offeringId, body: { description: null } })`. Its whole body can be omitted, so Accord preserves the distinction between no payload and `body: {}`. Both are no-ops on this server; supplied fields update the offering.

The backend's `ValidationPipe` validates DTO fields and rejects unknown properties. Accord performs no request schema validation; generated TypeScript checks callers, and generated Standard Schema checks decoded responses. Money remains a decimal string end to end.

Response media entries reference their generated Standard Schema directly. There is no `responseSchemas` registry or separate validator-key map. JSON, ordinary text and binary codecs are inferred from the declared media type and direction; multipart retains its field encoding metadata. The private `createAccordValidators()` factory initializes shared precompiled checks once when the SDK module loads. Numbered checks are internal implementation names, while exported schemas provide typed validation for HTTP calls or other consumers.

## Adapting to a real backend

The example uses ordinary Nest modules and decorators to model investment, entity, and document workflows. It has no dependencies on a specific company's backend, database, or authorization conventions.

The integration boundary is **the exported document's completeness**. Nest cannot recover erased TypeScript unions/generics or every custom validation pipe automatically. This example explicitly supplies response models, pagination item schemas, union members, and file metadata. A production backend's schema decorators and response serializers need to provide equivalent metadata before Accord can generate an accurate SDK.

References: [Nest OpenAPI generation](https://docs.nestjs.com/openapi/introduction), [types, generics and unions](https://docs.nestjs.com/openapi/types-and-parameters), [mapped DTO types](https://docs.nestjs.com/openapi/mapped-types).

## Verification and a bug found

[HTTP tests](test/market.test.ts) cover all 18 operations, flat JSON/multipart inputs, absent and empty PATCH bodies, rejection of unknown DTO fields, both submission branches, error responses, actual Multer parsing, byte preservation, response validation, and a real `QueryClient`. They also regenerate the document and SDK and compare every committed artifact. [Compile-time checks](test/contracts.ts) include rejected inputs and union narrowing. Both are included in the root checks.

The real server exposed a multipart bug: unnamed byte buffers had no filename, so Multer did not accept them as uploaded files. Accord now gives binary parts a default filename, preserving explicit `File` names. A regression checks all supported binary input types, including empty files.

The backend is compiled with TypeScript before it runs, preserving Nest's decorator metadata. The local Biome override enables parameter decorators, keeps metadata-bearing imports, and avoids treating Nest's `useGlobalPipes` as a React hook.
