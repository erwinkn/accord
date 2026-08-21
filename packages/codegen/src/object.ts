import type { CodegenDiagnostic } from "./diagnostics.js"
import type { JsonObject } from "./types.js"

export function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function canonicalize(value: unknown, depth = 0): unknown {
  if (depth > 256) {
    throw new Error("Maximum canonicalization depth exceeded")
  }
  if (Array.isArray(value)) return value.map((item) => canonicalize(item, depth + 1))
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, canonicalize(value[key], depth + 1)]),
  )
}

export function resolveObjectReference(
  document: JsonObject,
  value: unknown,
  diagnostics: CodegenDiagnostic[],
  location: string,
  maximumDepth = 128,
): JsonObject | undefined {
  let current = value
  const visited = new Set<string>()

  for (let depth = 0; depth <= maximumDepth; depth += 1) {
    if (!isObject(current)) return undefined
    const reference = current["$ref"]
    if (typeof reference !== "string") return current

    if (!reference.startsWith("#/")) {
      diagnostics.push({
        code: "EXTERNAL_REF_UNSUPPORTED",
        message: `External reference ${reference} is not yet supported by Accord metadata normalization`,
        location,
      })
      return undefined
    }
    if (visited.has(reference)) {
      diagnostics.push({
        code: "UNRESOLVED_REF",
        message: `Reference cycle encountered while resolving ${reference}`,
        location,
      })
      return undefined
    }
    visited.add(reference)

    const target = resolveJsonPointer(document, reference)
    if (target === undefined) {
      diagnostics.push({
        code: "UNRESOLVED_REF",
        message: `Could not resolve ${reference}`,
        location,
      })
      return undefined
    }
    current = target
  }

  diagnostics.push({
    code: "MAXIMUM_DEPTH_EXCEEDED",
    message: `Reference chain exceeded ${maximumDepth} levels`,
    location,
  })
  return undefined
}

export function resolveJsonPointer(document: JsonObject, reference: string): unknown {
  if (reference === "#") return document
  if (!reference.startsWith("#/")) return undefined

  let current: unknown = document
  for (const rawSegment of reference.slice(2).split("/")) {
    const segment = decodeURIComponent(rawSegment).replace(/~1/g, "/").replace(/~0/g, "~")
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined
      current = current[index]
    } else if (isObject(current) && Object.hasOwn(current, segment)) {
      current = current[segment]
    } else {
      return undefined
    }
  }
  return current
}
