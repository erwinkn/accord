/* eslint-disable anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- Standard Schema and Ajv intentionally accept unknown data at this response-validation boundary. */
import type { StandardSchemaV1 } from "@standard-schema/spec"

export type { StandardSchemaV1 } from "@standard-schema/spec"

export interface ValidationIssue {
  readonly instancePath: string
  readonly message?: string
  readonly keyword?: string
  readonly params?: { readonly missingProperty?: string; readonly additionalProperty?: string }
}
export interface ValidationFunction {
  (value: unknown): boolean
  readonly errors?: readonly ValidationIssue[] | null
}

function isRecord<T>(value: T): value is T & Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object"
}

function issuePath<T>(issue: ValidationIssue, value: T): readonly (string | number)[] {
  const keys = issue.instancePath
    ? issue.instancePath
        .slice(1)
        .split("/")
        .map((key) => key.replace(/~1/g, "/").replace(/~0/g, "~"))
    : []
  const result: (string | number)[] = []
  let at: unknown = value
  for (const key of keys) {
    result.push(Array.isArray(at) ? Number(key) : key)
    at = isRecord(at) ? at[key] : undefined
  }
  const property = issue.params?.missingProperty ?? issue.params?.additionalProperty
  if (property !== undefined) result.push(property)
  return result
}

/** Adapts build-time validation code. This module never compiles a schema at runtime. */
export function standardSchema<T>(
  validate: ValidationFunction,
  binary = false,
): StandardSchemaV1<T, T> {
  return {
    "~standard": {
      version: 1,
      vendor: "accord",
      validate(value) {
        if (binary && !(value instanceof ArrayBuffer))
          return { issues: [{ message: "Expected an ArrayBuffer" }] }
        const checked = binary && value instanceof ArrayBuffer ? value.byteLength : value
        if (validate(checked)) {
          // SAFETY: codegen derives T and this validator from the same semantic response view.
          return { value: value as T }
        }
        const issues = (validate.errors ?? []).map((issue) => ({
          message: issue.message ?? "Invalid value",
          path: binary ? [] : issuePath(issue, value),
        }))
        return { issues: issues.length ? issues : [{ message: "Invalid value" }] }
      },
    },
  }
}
