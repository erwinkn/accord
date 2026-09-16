import type { JsonObject, JsonValue } from "./types.js"

export function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isString(value: JsonValue | undefined): value is string {
  return typeof value === "string"
}

export function isBoolean(value: JsonValue | undefined): value is boolean {
  return typeof value === "boolean"
}

export function isNonEmptyString(value: JsonValue | undefined): value is string {
  return isString(value) && value.trim().length > 0
}

export function canonicalize(value: JsonValue, depth = 0): JsonValue {
  if (depth > 256) throw new Error("Maximum canonicalization depth exceeded")
  if (Array.isArray(value)) return value.map((item) => canonicalize(item, depth + 1))
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, canonicalize(value[key] ?? null, depth + 1)] as const),
  )
}

export function isJsonArray(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value)
}
