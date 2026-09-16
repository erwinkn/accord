/* eslint-disable anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- Zod refinements inspect untrusted response values at the validation boundary. */
import { z } from "zod"

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
export function equal(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (Array.isArray(left) && Array.isArray(right))
    return left.length === right.length && left.every((value, index) => equal(value, right[index]))
  if (object(left) && object(right)) {
    const keys = Object.keys(left)
    return (
      keys.length === Object.keys(right).length &&
      keys.every((key) => Object.hasOwn(right, key) && equal(left[key], right[key]))
    )
  }
  return false
}
export function uniqueItems(value: readonly unknown[]): boolean {
  return value.every(
    (item, index) => !value.slice(0, index).some((previous) => equal(previous, item)),
  )
}
export function validRegex(value: string): boolean {
  try {
    new RegExp(value)
    return true
  } catch {
    return false
  }
}
function check(
  schema: z.ZodType,
  value: unknown,
  context: z.RefinementCtx,
  path: PropertyKey[] = [],
): void {
  const result = schema.safeParse(value)
  if (!result.success)
    for (const issue of result.error.issues)
      context.addIssue({ code: "custom", message: issue.message, path: [...path, ...issue.path] })
}
export function whenType(type: "object" | "array" | "number" | "string", schema: z.ZodType) {
  return z.unknown().superRefine((value, context) => {
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- Apply JSON Schema constraints only to their own instance type.
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- Dispatch constrained JSON Schema instance types at the validation boundary.
    const matches =
      type === "object"
        ? object(value)
        : type === "array"
          ? Array.isArray(value)
          : // eslint-disable-next-line anti-slop/no-runtime-typeof -- JSON Schema intentionally applies constraints only to their instance type.
            typeof value === type
    if (matches) check(schema, value, context)
  })
}
export function requiredKeys(names: readonly string[]) {
  return (value: Record<string, unknown>, context: z.RefinementCtx) => {
    for (const name of names)
      if (!Object.hasOwn(value, name) || value[name] === undefined)
        context.addIssue({ code: "custom", message: "Required property is missing", path: [name] })
  }
}
export function objectKeys(
  names: readonly string[],
  patterns: readonly (readonly [RegExp, z.ZodType])[],
  additional?: z.ZodType,
) {
  const known = new Set(names)
  return (value: Record<string, unknown>, context: z.RefinementCtx) => {
    for (const [key, item] of Object.entries(value)) {
      const matched = patterns.filter(([pattern]) => pattern.test(key))
      for (const [, schema] of matched) check(schema, item, context, [key])
      if (!known.has(key) && !matched.length && additional) check(additional, item, context, [key])
    }
  }
}
export function propertyNames(schema: z.ZodType) {
  return (value: Record<string, unknown>, context: z.RefinementCtx) => {
    for (const key of Object.keys(value)) check(schema, key, context, [key])
  }
}
export function dependentKeys(key: string, required: readonly string[]) {
  return (value: Record<string, unknown>, context: z.RefinementCtx) => {
    if (Object.hasOwn(value, key)) requiredKeys(required)(value, context)
  }
}
export function dependentSchema(key: string, schema: z.ZodType) {
  return (value: Record<string, unknown>, context: z.RefinementCtx) => {
    if (Object.hasOwn(value, key)) check(schema, value, context)
  }
}
export function conditional(condition: z.ZodType, then: z.ZodType, otherwise: z.ZodType) {
  return z
    .unknown()
    .superRefine((value, context) =>
      check(condition.safeParse(value).success ? then : otherwise, value, context),
    )
}
