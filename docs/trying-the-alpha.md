# Try the alpha in a project

The four packages are versioned `0.1.0-alpha.0`. They are local release candidates; this run does not publish to a registry.

Build installable archives from this checkout:

```sh
pnpm install --frozen-lockfile
pnpm pack:alpha
```

The packages and SHA-256 checksums are written to `artifacts/alpha/`. Copy the four `.tgz` files into your project's `vendor/` directory. For pnpm, add this override to the project's `pnpm-workspace.yaml` so the unpublished sibling dependency resolves locally:

```yaml
overrides:
  '@accord/client@0.1.0-alpha.0': file:./vendor/accord-client-0.1.0-alpha.0.tgz
  '@accord/codegen@0.1.0-alpha.0': file:./vendor/accord-codegen-0.1.0-alpha.0.tgz
```

Then install:

```sh
pnpm add ./vendor/accord-client-0.1.0-alpha.0.tgz
pnpm add -D ./vendor/accord-codegen-0.1.0-alpha.0.tgz typescript
# Optional React integration:
pnpm add ./vendor/accord-react-query-0.1.0-alpha.0.tgz @tanstack/react-query react

# Optional native response validation:
pnpm add ./vendor/accord-zod-0.1.0-alpha.0.tgz zod
pnpm exec accord generate openapi.yaml --output src/api.ts --validators @accord/zod
```

Use ESM, TypeScript 5.9+, and a Fetch-capable runtime; generation requires Node 22+. The entire generated SDK, including optional response validators, lives in `api.ts`. Omit `--validators` to generate a smaller SDK that trusts decoded response values.

Start with the [Tasks usage example](../examples/tasks/usage.ts) for authentication, ordinary calls, full responses, and React Query options. [Schema wrappers](../examples/adapters/README.md) show native Zod and ArkType consumption through Standard Schema.

Before applying this alpha to a large or unusual spec, review the [tested scope and precision boundaries](testing.md#precision-and-support-boundaries). A generation diagnostic is a failure; do not execute JavaScript emitted from TypeScript errors. Preserve a failing spec as a regression fixture so the semantic model and wire behavior can be corrected together.
