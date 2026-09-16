# Wrap generated schemas

[schemas.ts](schemas.ts) wraps the generated Tasks response schema with Zod 4 and ArkType 2. These libraries are example/test dependencies; Accord does not depend on them.

```ts
import { arkTask, zodTask } from "./schemas.js"

const task = await zodTask.parseAsync(untrustedValue)
const sameTask = arkTask.assert(untrustedValue)
```

Both results infer the generated Task type. Both wrappers delegate to Accord's validator and preserve valid value identity; the ArkType wrapper uses a local scope with cloning disabled. Zod forwards all issues; the small ArkType wrapper reports the first issue with its property path. Its synchronous pipeline rejects asynchronous validators explicitly.

Use the generated schema directly when a consumer accepts Standard Schema. Wrapping adds the consumer's parsing/composition API; it does not reconstruct a native object schema with field-level introspection or `.pick()`/`.omit()`. Native schema emitters remain a future backend option.
