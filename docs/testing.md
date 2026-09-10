# Accord testing and conformance

Accord's acceptance criterion is **agreement between the accepted OpenAPI document, the generated consumer types, and the actual HTTP exchange**. A generated file that parses, a serializer snapshot, or a green linter is not enough.

This infrastructure deliberately makes no production implementation fixes. It gives those fixes executable acceptance criteria.

## Commands

From a clean checkout, use the repository's pinned pnpm and run `pnpm install --frozen-lockfile`, then `pnpm build`.

| Command | What it establishes |
| --- | --- |
| `pnpm check` | Existing checks plus harness checks, conformance regression gate, bounded full-pipeline fuzzing, and packaged-consumer tests |
| `pnpm typecheck:tests` | The test infrastructure itself satisfies the repository's strict TypeScript settings |
| `pnpm test:harness` | Fail-closed diagnostic matching, timeout isolation, registry integrity, and generator metamorphic tests |
| `pnpm test:conformance:list` | The actual executable inventory, including stable IDs and categories |
| `pnpm test:conformance` | No new violations and no silently obsolete known-gap entries |
| `pnpm test:conformance:strict` | Every registered invariant passes; known gaps also make this command fail |
| `pnpm test:fuzz` | Seeded, shrinkable generation, semantic compilation, and real HTTP exchanges |
| `pnpm test:distribution` | Pack all three packages, install outside the monorepo, run the CLI, compile and execute an ESM consumer |

Run one invariant with `ACCORD_CONFORMANCE_CASE=wire.body-allof-siblings pnpm test:conformance`.

Replay a minimized property failure using the printed command, for example:

```sh
ACCORD_FUZZ_SEED=11321517 ACCORD_FUZZ_PATH='0:1:2' pnpm test:fuzz
```

`ACCORD_FUZZ_RUNS` controls the bounded run count. CI seeds are reproducible, nightly seeds vary, and every failure records the actual seed, shrink path, counterexample and diagnostic details. An invalid seed, empty selection or unknown argument is a failure, not a silently empty test run.

## Three separate outcomes

**Passing contract:** all of that fixture's stages succeed.

**Known gap:** the fixture executes against the desired behavior but fails at a specifically recorded phase and signature. It is not skipped and its expected output is never changed to the incorrect result. The regression gate recognizes only that exact failure; JUnit still reports it as a target failure. A green regression gate is therefore explicitly **not** full conformance.

**Regression or infrastructure failure:** new failure, changed failure signature, missing import, crash, timeout, malformed test, or unclassified compiler error. These always fail the regression gate. A known gap that starts passing also fails until its obsolete baseline entry is removed.

`known-gaps.json` is a reviewed implementation backlog, not a blanket expected-failure switch. There is intentionally no update-all-baselines command. A failure moving from compilation to a later wire assertion requires examining the newly exposed problem, not automatically accepting a changed signature.

## Test architecture

### Executable contracts

The `Fixture` registry in `tests/conformance/` separates documents and expected behavior from the implementation. Every case has a stable ID, title, area and normative reference. Duplicate IDs, orphan baseline entries and unsafe fixture paths are rejected.

The current corpus covers:

- Path and tag namespaces, explicit naming precedence and deterministic fallback names, inherited parameters and file-relative references.
- Required versus optional inputs, merged versus separate bodies, nullability, union correlation, recursive response schemas, response-status unions, and query/mutation type separation.
- Literal OpenAPI parameter-style examples for simple, label, matrix, form, space-delimited, pipe-delimited and deep-object serialization; default reserved-character escaping and actual header/cookie transport.
- JSON, URL-encoded and multipart bodies; absent bodies, arrays, null, composed and referenced schemas, and non-mutation of caller-owned values.
- Typed JSON/text/no-content/binary response contracts, HTTP error context and malformed error bodies.
- Query option execution and deduplication, input-sensitive canonical keys, cancellation, and server-context cache isolation.
- Explicit rejection of malformed documents, missing or invalid path parameters, collisions, invalid styles, unresolved/cyclic references and duplicate parameters.

This is an extensible conformance corpus, not a claim that every OpenAPI feature or feature combination has already been tested. Use the generated inventory/report for current counts; do not maintain a second hand-written count.

### Semantic TypeScript checks

Each successful generation is compiled with `ts.createProgram` and pre-emit diagnostics. The compiler uses public package declarations, not source aliases. Consumer source and generated `.ts` are always semantically checked. The generated module is not merely passed to `transpileModule`.

Negative type consumers use one `// @negative NAME` marker immediately before the invalid line and a list of allowed diagnostic codes. Exactly one matching diagnostic is required at each marker. Missing diagnostics, wrong codes, duplicate markers and unrelated errors fail. These files are never executed.

Ordinary consumers use `skipLibCheck` **only for dependency `.d.ts` revalidation**, not generated source or consumer source. A separate `types.published-declarations` contract runs with it disabled. This is intentional: a bad emitted declaration should be visible once as its own contract violation rather than conceal every other wire invariant. The declaration audit currently catches missing TanStack data-tag symbol imports. Its exact file/code/message signature is recorded; unrelated declaration defects cannot satisfy it. Do not delete this audit or claim ordinary consumer checks validate declaration internals.

A `// @contract ACCORD_NAME` marker identifies a single positive type obligation that is currently unmet. Only the diagnostic at that line can match its known-gap entry. No `as any`, `as unknown as ...`, or untyped reimplementation of Accord is used to bypass the generated client types.

### Real wire behavior

The compiler emits executable consumer JavaScript. A separate Node subprocess loads it, uses real `fetch`, and sends requests to an ephemeral loopback HTTP server. The server captures method, raw URL, headers and bytes. Expected wire values come from literal spec examples or independently decoded requests, never Accord's serializer output.

Multipart tests use Fetch's independent form parser. Query tests use a real `QueryClient`. Custom fetch implementations are limited to specifically testing transport injection/cancellation and isolated package smoke checks; they do not replace the live HTTP cases.

Each consumer gets isolated module/global state, a bounded process lifetime and guaranteed server cleanup. A crash or hang cannot reuse a stale result. Successful workspaces are removed; failure artifacts retain synthetic specs, generated TypeScript, emitted consumers, diagnostics and the observed failure. No credentials, environment dumps or node_modules are included.

### Property and metamorphic testing

The property grammar deliberately varies supported combinations of OpenAPI 3.0.3/3.1.0, inline/ref/allOf/oneOf object bodies, merge/separate mode, integers, booleans, empty strings, Unicode and reserved characters in paths/query/body values. Every accepted sample is generated, semantically compiled and executed against a server. Object-key reordering must preserve both source and normalized metadata.

Additional metamorphic tests require JSON/YAML equivalence, input non-mutation and semantic independence from descriptive metadata.

The initial randomized grammar is intentionally bounded. It is not coverage-guided fuzzing and does not sample all JSON Schema constructs. Known unsupported behavior belongs in explicit conformance fixtures; adding a grammar production should include its independent type and wire oracle. A minimized counterexample should become a named deterministic regression fixture before the implementation is fixed.

### Distribution isolation

Package tests run `pnpm pack`, install the tarballs into an OS temporary directory outside the monorepo, invoke the installed CLI with and without a config module, then compile and execute a consumer. Registry access is used only to install declared dependencies. Fixture execution does not call external APIs. No workspace aliases or root node_modules can rescue a missing published file.

The package smoke compile also skips dependency declaration revalidation; the dedicated declaration audit remains the strict validity gate. The initial supported consumer mode tested here is ESM on Node, matching the packages' exports. Browser bundler and additional runtime matrices are not implied by this smoke test.

## Accord-specific contracts

OpenAPI describes wire semantics, not every TypeScript ergonomic choice. These are deliberate Accord decisions and must be documented as such:

| Contract | Decision captured by tests |
| --- | --- |
| Namespace construction | Static path segments by default; dynamic segments are inputs; tags are opt-in |
| Operation naming | `x-sdk-name`, then `operationId`, then deterministic fallback |
| Body input | Both merge and separate modes; collisions are errors; optional merged bodies are absent as a whole or satisfy required fields |
| Relative base URLs | Browser-relative configuration resolves against the browser origin |
| Binary response representation | `ArrayBuffer`, matching the existing runtime, rather than a schema-generated string |
| Empty successful text | Preserve `""`; an empty representation is not an absent response |
| JSON-content parameters | Accept their schema-shaped value and encode it as one named JSON-valued parameter |
| Error decoding | Malformed error JSON must not erase HTTP status, headers or endpoint context |
| Cache identity | Different server data contexts cannot share results in one `QueryClient` |

The last contract does not prescribe how scope is represented in the future API. Tokens must never be used as cache keys. Tenant/account scope at the same origin needs an explicit SDK/API design and dedicated tests before that feature is claimed; the existing executable case establishes cross-server isolation.

## Adding or fixing a contract

1. Add the smallest valid OpenAPI fixture and a public consumer; cite the relevant spec section or an Accord-specific decision.
2. Write the expected type/wire/result independently. Add invalid consumer examples where type precision matters. Compile before execution; do not cast through a missing feature.
3. Run the case, inspect its retained artifacts, and classify the failure. Record a known gap only after proving its specific cause. Harness and process failures are never legitimate known gaps.
4. Fix production code separately. The case should become an unexpected pass; remove the resolved baseline entry, then run the complete regression gate and shrinking property tests.

Prefer one invariant per fixture. A compile failure means a later wire assertion has **not yet executed**; reports retain that phase rather than claiming runtime coverage.

## Boundaries still needing additional contracts

These are explicitly not covered by the initial executable corpus: server-variable selection and overrides; spec-derived security-scheme configuration and same-origin account isolation; caller selection among alternative request/response media types; pagination and retry policy; streaming/SSE; response-header result envelopes; a browser/CORS/credential matrix; a broad real-world-spec compatibility corpus; generalized mutation testing; and OpenAPI 3.2. Several need a public API decision before meaningful consumers can be written. They must not be marked implemented merely because generation does not throw.

OpenAPI-defined behavior and implementation-defined behavior must be distinguished. In particular, avoid inventing a universal nested `deepObject` convention or inferring pagination semantics that the spec does not define.

## CI and reports

The existing CI remains intact, including the original unit, golden, integration and type tests. The SDK-contract workflow adds Node 22/24 regression gates, harness checks, conformance reports and fresh package installs. The nightly job runs a larger seeded property campaign and strict conformance; it is expected to be red until the registered gaps are fixed. `main` is not modified by test workflows.

Artifacts:

- `artifacts/conformance/report.json`: machine-readable per-invariant status, phase, signature, duration and run metadata.
- `artifacts/conformance/report.md`: human-readable implementation backlog and passing contracts.
- `artifacts/conformance/junit.xml`: target failures, including known gaps, rather than skipped tests.
- `artifacts/conformance/failures/`: standalone synthetic reproduction inputs and generated consumers.
- `artifacts/fuzz/report.json`: seed, shrink path and minimized failure.
- `artifacts/distribution/`: package smoke results and command logs.

No full-coverage percentage or full-conformance claim is inferred from the existence of these test categories. The measured outcome is the executable contract report.

## Primary references

- OpenAPI 3.1.1: <https://spec.openapis.org/oas/v3.1.1.html>
- OpenAPI 3.0.3: <https://spec.openapis.org/oas/v3.0.3.html>
- TypeScript compiler API: <https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API>
- fast-check runners and replay: <https://fast-check.dev/docs/core-blocks/runners/>
- TanStack Query keys: <https://tanstack.com/query/latest/docs/framework/react/guides/query-keys>
