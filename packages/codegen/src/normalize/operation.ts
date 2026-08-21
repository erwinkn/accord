import type { CodegenDiagnostic } from "../diagnostics.js"
import type { AccordCodegenConfig, BodyMode, JsonObject, OperationKind } from "../types.js"

export function resolveBodyMode(
  config: AccordCodegenConfig,
  operation: JsonObject,
  operationId: string | undefined,
  method: string,
  path: string,
  diagnostics: CodegenDiagnostic[],
): BodyMode {
  const lookup = lookupOverride(config.body?.overrides, operationId, method, path)
  if (lookup === "merge" || lookup === "separate") return lookup

  const extension = operation["x-sdk-body-mode"]
  if (extension !== undefined && extension !== "merge" && extension !== "separate") {
    diagnostics.push({
      code: "INVALID_EXTENSION",
      message: "x-sdk-body-mode must be merge or separate",
      location: `${method} ${path}`,
    })
  }
  if (extension === "merge" || extension === "separate") return extension
  return config.body?.mode ?? "merge"
}

export function resolveOperationKind(
  config: AccordCodegenConfig,
  operation: JsonObject,
  operationId: string | undefined,
  method: string,
  path: string,
  diagnostics: CodegenDiagnostic[],
  location: string,
): OperationKind {
  const configured = lookupOverride(config.operationKinds, operationId, method, path)
  if (configured === "query" || configured === "mutation") return configured

  const extension = operation["x-sdk-kind"]
  if (extension !== undefined && extension !== "query" && extension !== "mutation") {
    diagnostics.push({
      code: "INVALID_EXTENSION",
      message: "x-sdk-kind must be query or mutation",
      location: `${location}/x-sdk-kind`,
    })
  }
  if (extension === "query" || extension === "mutation") return extension
  return method === "GET" || method === "HEAD" ? "query" : "mutation"
}

function lookupOverride<T>(
  overrides: Readonly<Record<string, T>> | undefined,
  operationId: string | undefined,
  method: string,
  path: string,
): T | undefined {
  if (!overrides) return undefined
  if (operationId !== undefined && Object.hasOwn(overrides, operationId))
    return overrides[operationId]
  return overrides[`${method} ${path}`]
}
