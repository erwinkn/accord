# @accord/zod

Optional native Zod code generation for Accord. Core codegen and the Fetch client do not depend on Zod or Ajv; validation is disabled unless an adapter is supplied.

```sh
pnpm add @accord/client @accord/zod zod
pnpm add -D @accord/codegen
pnpm exec accord generate openapi.yaml -o api.ts --validators @accord/zod
```

```ts
import { generateFromFile } from "@accord/codegen"
import { zodAdapter } from "@accord/zod"

const { source } = await generateFromFile("openapi.yaml", {
  validators: zodAdapter(),
})
```

The generated `schemas.ts` module contains actual schemas, also re-exported from the SDK entry:

```ts
import { z } from "zod"

export const GetDocument200Schema = z.strictObject({
  id: z.uuid(),
  filename: z.string(),
})
```

Consumers can use `.parse()`, `.safeParse()`, `.shape`, and other native Zod APIs. Zod implements Standard Schema, so Accord uses the same objects for response validation. Open objects use `z.looseObject`, typed dictionaries use `.catchall`, references share definitions, and recursive schemas use `z.lazy`. Read/write projections and binary decoding come from Accord's semantic model. Defaults, coercion, stripping, and freezing are not generated. Native Zod parsing creates copies; the HTTP client validates and returns its original decoded value. Native `z.infer` also follows Zod’s convention that optional properties may explicitly contain `undefined`; the SDK’s generated JSON response types retain stricter optional-property semantics.

Some JSON Schema constraints need refinements rather than a single Zod constructor: Unicode code-point lengths, property-name/pattern rules, conditional constraints, and statically evaluated properties across `allOf`. The generated expressions remain visible. A small `@accord/zod/runtime` module supplies shared refinement functions when needed; it contains no schema interpreter and imports only Zod. Ordinary object schemas need no helper import.

## Explicit limits

This is not a complete JSON Schema validator. `$dynamicRef`, `$dynamicAnchor`, `unevaluatedItems`, legacy `dependencies`, and `unevaluatedProperties` requiring branch-dependent evaluation fail generation. `unevaluatedProperties` over static properties, patterns, references and `allOf` is supported. Unsupported keywords and formats fail instead of being silently dropped. Format validation follows Zod's rules for email, UUID, ISO dates/times, duration, IP addresses, URLs, and regex. Transport annotations such as `binary`, `int64`, or `password` do not add validation. Annotation-only keywords do not transform data.

These limits apply only when selecting this adapter. Type/endpoint generation without validation remains independent. Other adapters can implement the public `ValidationAdapter` interface from `@accord/codegen`.

## Adapter contract

`ValidationAdapter.generate(context)` receives projected schema documents, named response exports, printable reference types, and a batch identifier allocator. It returns import statements and schema declarations as TypeScript source. `reservedNames` protects adapter imports from schema-name collisions. The generated exports must implement Standard Schema v1 and validate decoded values without changing their contract. `name` identifies the adapter. The CLI loads a package's default adapter factory; programmatic configuration accepts the adapter object directly.
