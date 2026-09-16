# Accord alpha rewrite

Accord now owns the complete path from OpenAPI meaning to caller types, endpoint metadata, and optional response validation. The four packages are versioned `0.1.0-alpha.0`, built, and available as local installable archives. No packages have been published.

## What shipped

The generator loads OpenAPI 3.0/3.1 and referenced documents into one semantic schema graph. It preserves composition and reference scope, then derives request/response projections, calling conventions, and transport codecs. TypeScript types are emitted directly through TypeScript's AST/printer; the old openapi-typescript pipeline has been removed.

Generated SDKs contain ordinary exported types and declarative endpoint plans. Request bodies are flat encoding definitions; form field maps replace nested codecs and duplicate field lists. Responses are status-keyed records with direct media/schema metadata; only a status with multiple media types uses an array. Configured client auth applies to every call, with per-call opt-out and no generated security metadata. The Fetch client interprets those plans. Optional validation uses the separate `@accord/zod` codegen adapter, which emits native Zod schemas implementing Standard Schema. Core client/codegen do not depend on a validation library. The ArkType example wraps the generated Standard Schema. See the adapter documentation for its explicit limits.

The agreed calling conventions are implemented:

```ts
// Required, closed, collision-free request bodies can flatten.
await tasks.tasks.create({ title: "Review", status: "open" })

// Optional bodies preserve the distinction between absence and an empty payload.
await tasks.tasks.update({ id: "t1", body: { status: "done" } })

// Representation selection stays correlated with the first argument's type.
const result = await imports.imports.create(
  { body: "email\na@example.test" },
  { headers: { "content-type": "text/csv" } },
)
if (result.status === 202) console.log(result.data.jobId)
else console.log(result.data.imported)
```

Inputs are trusted: no request schema validation, reparsing, defaults, coercion, or dictionary stripping. Responses are decoded and optionally validated. Full responses retain HTTP metadata; failures distinguish HTTP, network, decoding, and validation errors. React Query supports bound/unbound endpoints, cancellation, full-response queries, and cache separation by API/server/account/input/options.

## Read the generated output

| Example | Spec | Generated SDK | Usage |
| --- | --- | --- | --- |
| Nest investment API: 18 endpoints, generated from controllers/DTOs | [OpenAPI](../examples/nest-market/openapi.json) | [SDK](../examples/nest-market/sdk/index.ts) | [Calls](../examples/nest-market/usage.ts) |
| Tasks: four endpoints, read/write projections, patch, validation, React Query | [OpenAPI](../examples/tasks/openapi.yaml) | [SDK](../examples/tasks/sdk.ts) | [Calls](../examples/tasks/usage.ts) |
| Imports: three endpoints, JSON/CSV, 200/202 unions, binary downloads | [OpenAPI](../examples/imports/openapi.yaml) | [SDK](../examples/imports/sdk.ts) | [Calls](../examples/imports/usage.ts) |
| Assets: three endpoints, external schemas, multipart, collisions, API keys | [OpenAPI](../examples/assets/openapi.yaml) | [SDK](../examples/assets/sdk.ts) | [Calls](../examples/assets/usage.ts) |

[Native Zod and ArkType consumption](../examples/adapters/README.md) and [local installation instructions](trying-the-alpha.md) complete the examples. Run `pnpm pack:alpha` to recreate the archives in `artifacts/alpha/`.

## Verification completed

`pnpm check` passed end to end:

- 82 unit/property/golden/integration tests, 12 live Nest API tests, and 10 harness tests.
- 125 strict conformance cases; all 13 original gap cases now pass, with no remaining known-gap entries.
- Strict package, generated SDK, consumer, and harness type checks, including negative caller examples.
- A 20-case fuzz run with seed `11321517`, exercising JSON/multipart/URL-form generation, semantic compilation, and loopback HTTP, with shrinking/replay preserved.
- A 300-endpoint SDK and typed calls to every endpoint. This is a scale smoke test, not a cross-architecture benchmark; timings and compiler costs are recorded in `artifacts/scale/report.json`.
- All four packed packages installed outside the workspace. The consumer generated and executed native Zod schemas, compiled with dependency declaration checking, and bundled for browsers.

Harness corrections include real generated goldens, the agreed body/status/options conventions, source-provenance-aware equivalence tests, and an independent fuzz oracle that preserves `data: undefined`. Added regressions cover external resources, binary/form/XML decoding, schema-library wrappers, malformed error bodies, and bodyless status ranges. See [testing](testing.md) for commands and oracle details.

## Alpha boundaries

This is ready for evaluation in a real project within the documented scope. It is not a claim of exhaustive OpenAPI/JSON Schema compatibility. TypeScript structural types cannot enforce every validation constraint. Advanced dynamic references, arbitrary conditional/negation precision, overlapping patterns, and unusual XML/form combinations need broader compatibility work. Browser bundling is tested; a browser/CORS interoperability matrix is not.

Custom dialects, OpenAPI 3.2, native adapters beyond Zod, and automatic interactive login/retry/pagination/streaming policies are outside this alpha. The [architecture](architecture.md) and [precise support boundaries](testing.md#precision-and-support-boundaries) explain the implementation and limits.
