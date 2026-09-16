# Read the output

Each directory contains an OpenAPI specification, the actual generated SDK, and a short typed usage file.

| API | What it demonstrates | Files |
| --- | --- | --- |
| Team Tasks | Flat create inputs, readOnly projections, optional patch body, dates, response validation, React Query | [spec](tasks/openapi.yaml), [SDK](tasks/sdk.ts), [usage](tasks/usage.ts) |
| Data Imports | JSON/CSV argument correlation, 200/202 status union, schema unions, binary downloads | [spec](imports/openapi.yaml), [SDK](imports/sdk.ts), [usage](imports/usage.ts) |
| Asset Library | OpenAPI 3.0, external schemas, multipart files/JSON/repeated parts, body collisions, API keys | [spec](assets/openapi.yaml), [external models](assets/models.yaml), [SDK](assets/sdk.ts), [usage](assets/usage.ts) |
| NestJS investment platform | Real Nest 10 / Swagger 7 backend, 18 endpoints, generated OpenAPI, polymorphic DTOs, pagination, jobs, multipart, reports, live HTTP tests | [guide](nest-market/README.md), [backend](nest-market/src/app.ts), [spec](nest-market/openapi.json), [SDK](nest-market/sdk/index.ts), [usage](nest-market/usage.ts) |

Regenerate with `pnpm generate:examples`; compile with `pnpm typecheck:examples`. The example hosts and credentials are placeholders. The integration suite executes these SDKs using controlled responses and inspects their encoded requests.

The Tasks and Imports examples include validators. Assets demonstrates generation without validators.

The NestJS example also includes validators. Run its complete workflow with `pnpm example:nest:demo`, or its live-server tests with `pnpm test:nest`.

[Schema adapters](adapters/README.md) demonstrate wrapping the generated Standard Schema for Zod and ArkType, with inferred output types.
