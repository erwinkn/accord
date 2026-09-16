# Accord alpha rewrite

Accord now owns the complete path from OpenAPI meaning to caller types, endpoint metadata, and optional response validation. The three packages are versioned `0.1.0-alpha.0`, built, and available as local installable archives. No packages have been published.

## What shipped

The generator loads OpenAPI 3.0/3.1 and referenced documents into one semantic schema graph. It preserves composition and reference scope, then derives request/response projections, calling conventions, and transport codecs. TypeScript types are emitted directly through TypeScript's AST/printer; the old openapi-typescript pipeline has been removed.

Generated SDKs contain ordinary exported types and declarative endpoint plans. The Fetch client interprets those plans. Optional validators are compiled at generation time into standalone checks exposed through Standard Schema. Zod and ArkType wrapper examples demonstrate consumption without introducing either library as a runtime dependency of Accord.

The agreed calling conventions are implemented:

```ts
// Required, closed, collision-free request bodies can flatten.
await tasks.tasks.create({ title: "Review", status: "open" })

// Optional bodies and conflicting names use the body escape hatch.
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
| Tasks: four endpoints, read/write projections, patch, validation, React Query | [OpenAPI](../examples/tasks/openapi.yaml) | [SDK](../examples/tasks/sdk.ts) | [Calls](../examples/tasks/usage.ts) |
| Imports: three endpoints, JSON/CSV, 200/202 unions, binary downloads | [OpenAPI](../examples/imports/openapi.yaml) | [SDK](../examples/imports/sdk.ts) | [Calls](../examples/imports/usage.ts) |
| Assets: three endpoints, external schemas, multipart, collisions, API keys | [OpenAPI](../examples/assets/openapi.yaml) | [SDK](../examples/assets/sdk.ts) | [Calls](../examples/assets/usage.ts) |

[Zod/ArkType wrappers](../examples/adapters/README.md) and [local installation instructions](trying-the-alpha.md) complete the examples. Run `pnpm pack:alpha` to recreate the archives in `artifacts/alpha/`.

## Verification completed

`pnpm check` passed end to end:

- 55 unit/property/golden/integration tests and 10 harness tests.
- 115 strict conformance cases; all 13 original gap cases now pass, with no remaining known-gap entries.
- Strict package, generated SDK, consumer, and harness type checks, including negative caller examples.
- A 20-case fuzz run with seed `11321517`, followed by a separate 100-case run with seed `20260916`. Both exercise generation, semantic compilation, and loopback HTTP, with shrinking/replay preserved.
- A 300-endpoint SDK and calls to every endpoint: generation about 316 ms; TypeScript checking 2.87 s on this host. Generated source was about 920 KB; compiler memory about 586 MB including dependency declarations. This is a scale smoke test, not a cross-architecture benchmark.
- All three packed packages installed outside the workspace. The consumer generated and executed standalone validators, compiled with dependency declaration checking, and bundled for browsers.

Harness corrections include real generated goldens, the agreed body/status/options conventions, source-provenance-aware equivalence tests, and an independent fuzz oracle that preserves `data: undefined`. Added regressions cover external resources, binary/form/XML decoding, schema-library wrappers, malformed error bodies, and bodyless status ranges. See [testing](testing.md) for commands and oracle details.

## Alpha boundaries

This is ready for evaluation in a real project within the documented scope. It is not a claim of exhaustive OpenAPI/JSON Schema compatibility. TypeScript structural types cannot enforce every validation constraint. Advanced dynamic references, arbitrary conditional/negation precision, overlapping patterns, and unusual XML/form combinations need broader compatibility work. Browser bundling is tested; a browser/CORS interoperability matrix is not.

Custom dialects, OpenAPI 3.2, native schema-library emitters, and automatic login/retry/pagination/streaming policies are outside this alpha. The [architecture](architecture.md) and [precise support boundaries](testing.md#precision-and-support-boundaries) explain the implementation and limits.
