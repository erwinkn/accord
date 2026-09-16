import type { ArkTask, ZodTask } from "../../examples/adapters/schemas.js"
import type { Task } from "../../examples/tasks/sdk.js"

type Assignable<L, R> = L extends R ? true : false
type Expect<T extends true> = T

// Zod optional() includes explicit undefined; JSON responses cannot contain that value.
type PresentValues<T> = { [K in keyof T]: Exclude<T[K], undefined> }
type _ZodOutput = Expect<Assignable<PresentValues<ZodTask>, Task>>
type _ArkTypeOutput = Expect<Assignable<PresentValues<ArkTask>, Task>>

// Native parsers produce mutable objects; Accord response types retain readonly projections.
type _ZodInput = Expect<Assignable<Task, ZodTask>>
type _ArkInput = Expect<Assignable<Task, ArkTask>>
