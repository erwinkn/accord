import type { StandardSchemaV1 } from "@accord/client/validation"
import { type } from "arktype"
import type { z } from "zod"
import { Get200Schema } from "../tasks/sdk.js"

const ark = type.scope({}, { clone: false }).type

function isPathSegment(
  segment: PropertyKey | StandardSchemaV1.PathSegment,
): segment is StandardSchemaV1.PathSegment {
  return typeof segment === "object"
}

function issuePath(issue: StandardSchemaV1.Issue): PropertyKey[] {
  return (issue.path ?? []).map((segment) => (isPathSegment(segment) ? segment.key : segment))
}

/** Accord's generated checks are synchronous. Async schemas need an async consumer. */
export function asArkType<Input, Output>(schema: StandardSchemaV1<Input, Output>) {
  return ark("unknown").pipe((value, context) => {
    const result = schema["~standard"].validate(value)
    if (result instanceof Promise) throw new TypeError("asArkType requires a synchronous schema")
    if (result.issues) {
      const first = result.issues[0]
      return context.error({
        message: first?.message ?? "Invalid value",
        relativePath: first ? issuePath(first) : [],
      })
    }
    return result.value
  })
}

export const zodTask = Get200Schema
export const arkTask = asArkType(Get200Schema)

export type ZodTask = z.output<typeof zodTask>
export type ArkTask = typeof arkTask.infer
