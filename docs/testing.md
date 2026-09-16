# Verification and alpha boundaries

The acceptance criterion is agreement between the OpenAPI description, generated caller types, and the actual HTTP exchange. Parsing a generated file or passing a snapshot is insufficient. Tests compile generated SDKs and consumers before executing their HTTP assertions.

## Run the checks

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm generate:test-fixtures
pnpm generate:examples
pnpm check
pnpm typecheck:examples
pnpm test:scale
```

| Check | Evidence |
| --- | --- |
| `pnpm quality` | Biome and the repository's custom Oxlint rules |
| `pnpm typecheck` | All packages, generated fixtures, positive and negative consumer types |
| `pnpm test` | Unit/property tests, real generated goldens, HTTP integration, React hooks, committed example SDKs |
| `pnpm typecheck:tests` | Strict checking of the conformance harness itself |
| `pnpm test:harness` | Diagnostic matching, isolation, registry integrity, source-format equivalence, input immutability |
| `pnpm test:conformance:strict` | Every registered type/wire/response/cache invariant must pass |
| `pnpm test:fuzz` | Seeded generation, semantic compilation, and real loopback HTTP exchanges, with shrinking |
| `pnpm test:distribution` | Pack all three packages, install outside the workspace, generate validators, compile and execute a consumer, bundle for browsers |
| `pnpm test:scale` | Generate and strictly compile a 300-operation SDK and calls to every operation |

Use `ACCORD_CONFORMANCE_CASE=representation.xml-roundtrip pnpm test:conformance` for one case. Increase fuzzing with `ACCORD_FUZZ_RUNS=100 pnpm test:fuzz`. Failures print the seed and `ACCORD_FUZZ_PATH` needed to replay the minimized case.

## How the harness was reviewed

The original corpus remains, with corrections for the agreed rewrite rather than compatibility with the old implementation:

- Collision-free, required closed bodies can flatten. Optional bodies, dictionaries, and collisions use `body`. Explicit unsafe merge tests now explicitly request merge instead of assuming it is the default.
- Endpoint metadata is under `.plan`; consumer tests inspect the new public API.
- Multiple successful statuses return status/data unions. A `2XX` group includes bodyless 204/205 responses, whose data is `undefined`.
- Headers and request options occupy the second argument. React Query's own options are composed with its option factories.
- Goldens contain the actual owned types and plans. The old mocked openapi-typescript output and old generation pipeline have been removed.
- JSON/YAML equivalence compares generated SDKs and runtime plans. Diagnostic source locations intentionally retain their different file names.
- Numeric diagnostic codes may differ for correlated argument tuples; negative markers must still produce exactly the expected error at the offending line. Missing or unrelated errors fail the harness.
- The expanded fuzz oracle preserves `data: undefined` explicitly; JSON-stringifying an expected envelope had incorrectly dropped that property.

The 13 original gap entries were removed only after their cases passed. `known-gaps.json` is currently empty. The strict gate is the release gate; a known-gap mechanism remains available for investigative work without silently skipping a fixture.

## Independent oracles

Conformance fixtures carry normative references and literal expected behavior. Consumers compile against public package declarations using `ts.createProgram`; they are not merely transpiled. Negative consumers are checked but never executed.

Executable consumers run in isolated Node subprocesses with timeouts and ephemeral loopback HTTP servers. The server captures raw URLs, headers, and bytes. Multipart assertions use Fetch's independent parser. Query assertions use a real `QueryClient`. These oracles do not call Accord's serializer to compute the expected answer.

Most conformance cases skip rechecking dependency declarations to isolate type/wire defects; the separate declaration audit, example compilation, scale test, and clean-install test use `skipLibCheck: false`. A successful generation followed by failed TypeScript checking remains a generation defect, not successful SDK execution.

Fuzzing varies OpenAPI 3.0/3.1, references/composition, body modes, Unicode/reserved characters, numeric/boolean values, success statuses/envelopes, and validator presence. Every sample runs the complete pipeline. Object-key reordering must preserve generated source and semantic metadata. Failures retain a minimized executable reproduction.

Generated snapshots and validator bundles are excluded from handwritten-code lint rules; they are compiled, executed, and compared against regeneration. Narrow inline lint exceptions explain genuine runtime dispatch and external validation boundaries. Request inputs are not reparsed to satisfy a lint rule.

## Precision and support boundaries

This alpha targets ordinary outgoing HTTP SDKs using OpenAPI 3.0/3.1 and Fetch. It includes JSON, text, binary, URL forms, multipart, XML metadata, external references/resources, request/response read-write projections, status/media selection, optional body validation, servers/security configuration, and React Query integration. Executable fixtures establish the combinations actually tested; this is not certification of every possible OpenAPI or JSON Schema document.

TypeScript types express structural contracts. Numeric bounds, general regular expressions, oneOf exclusivity, and general JSON Schema logical constraints still require response validators for enforcement. TypeScript cannot directly represent “every unknown key has this type except these heterogeneous named properties”; such index signatures include named property types. Omitted additionalProperties remains open. Caller-side runtime validation is intentionally absent.

Advanced `$dynamicRef` specialization, arbitrary conditional/negation type precision, overlapping pattern constraints, and unusual XML/form encoding combinations need broader compatibility work. Preserve valid source constraints in the semantic model and validator backend; do not infer complete support from a successful type snapshot. Custom JSON Schema dialects, OpenAPI 3.2, callback/webhook server generation, native Zod/ArkType emitters, and automatic login/retry/pagination/streaming policies are outside this alpha.

XML decoding uses declared names/prefixes and rejects document type/entity declarations. Browser bundling is verified; a browser/CORS/credential interoperability matrix is separate work. Fetch controls redirects and transport restrictions. Full response wrappers expose the original `Response`, whose body may have been consumed by decoding.

Response validators check decoded bodies. They preserve values rather than transforming/coercing them. They cannot validate an undeclared success status/media pairing, which instead raises a decode error. HTTP error status/headers survive malformed error bodies. Keep the generated validator companions beside their SDK.

## Reports

- `artifacts/conformance/report.json`, `report.md`, `junit.xml`: per-case status, phase, signatures and timing.
- `artifacts/conformance/failures/`: failing synthetic documents, generated SDKs and compiled consumers.
- `artifacts/fuzz/report.json` and `reproduction/`: seed, shrink path and minimized counterexample.
- `artifacts/distribution/`: packed-consumer results and command logs.
- `artifacts/scale/report.json`: generated size, generation time and TypeScript diagnostics.

Primary references: [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html), [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html), [Standard Schema](https://standardschema.dev/), [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API), [fast-check replay](https://fast-check.dev/docs/core-blocks/runners/).
