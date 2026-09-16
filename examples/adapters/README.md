# Native schemas and Standard Schema consumers

[schemas.ts](schemas.ts) uses a generated native Zod schema directly and wraps that same Standard Schema for ArkType. Zod needs no wrapper and exposes `.parse`, `.safeParse` and `.shape`.

Both results infer the validated Task values. Native Zod parsing produces copies. The ArkType wrapper delegates to Zod and forwards the first validation issue with its path; its synchronous pipeline explicitly rejects asynchronous schemas. It does not reconstruct a native ArkType object definition.

See [@accord/zod](../../packages/zod/README.md) for generation configuration and [the Tasks SDK](../tasks/sdk.ts) for the actual output.
