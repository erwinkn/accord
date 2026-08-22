import type { CodegenDiagnostic } from "../diagnostics.js"
import { isObject, resolveObjectReference } from "../object.js"
import type { JsonObject, JsonValue, NormalizedResponse } from "../types.js"

export function normalizeResponses(
  document: JsonObject,
  rawValue: JsonValue | undefined,
  diagnostics: CodegenDiagnostic[],
  location: string,
): readonly NormalizedResponse[] {
  if (!isObject(rawValue)) {
    diagnostics.push({
      code: "INVALID_RESPONSE",
      message: "responses must be an object",
      location,
    })
    return []
  }

  const responses: NormalizedResponse[] = []
  for (const rawStatus of Object.keys(rawValue).sort(compareStatus)) {
    const responseLocation = `${location}/${pointerSegment(rawStatus)}`
    const response = resolveObjectReference(
      document,
      rawValue[rawStatus],
      diagnostics,
      responseLocation,
    )
    if (!response) {
      if (!isObject(rawValue[rawStatus])) {
        diagnostics.push({
          code: "INVALID_RESPONSE",
          message: "Response must be an object or an internal reference",
          location: responseLocation,
        })
      }
      continue
    }
    const content = response["content"]
    const contentTypes = isObject(content) ? Object.keys(content).sort() : []
    const numericStatus = /^\d{3}$/.test(rawStatus) ? Number(rawStatus) : rawStatus
    responses.push({ status: numericStatus, contentTypes })
  }
  return responses
}

function compareStatus(left: string, right: string): number {
  const leftNumeric = /^\d{3}$/.test(left) ? Number(left) : Number.POSITIVE_INFINITY
  const rightNumeric = /^\d{3}$/.test(right) ? Number(right) : Number.POSITIVE_INFINITY
  return leftNumeric - rightNumeric || left.localeCompare(right)
}

function pointerSegment(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1")
}
