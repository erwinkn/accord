import type { ArkTask, ZodTask } from "../../examples/adapters/schemas.js"
import type { Task } from "../../examples/tasks/sdk.js"

type Equal<L, R> =
  (<T>() => T extends L ? 1 : 2) extends <T>() => T extends R ? 1 : 2 ? true : false
type Expect<T extends true> = T

type _ZodOutput = Expect<Equal<ZodTask, Task>>
type _ArkTypeOutput = Expect<Equal<ArkTask, Task>>
