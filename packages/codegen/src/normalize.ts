import type { CodegenDiagnostic } from "./diagnostics.js"
import { AccordCodegenError, throwIfDiagnostics } from "./diagnostics.js"
import { operationName, operationNamespace, sanitizeTypeIdentifier } from "./naming.js"
import { resolveBodyMode, resolveOperationKind } from "./normalize/operation.js"
import {
  mergeParameters,
  normalizeParameterList,
  validateFlattenedParameters,
  validatePathParameters,
} from "./normalize/parameters.js"
import { normalizeRequestBody, validateMergedBody } from "./normalize/request-body.js"
import { normalizeResponses } from "./normalize/responses.js"
import { validateEndpointTree } from "./normalize/tree.js"
import { isObject, resolveObjectReference } from "./object.js"
import type { AccordCodegenConfig, NormalizedApi, NormalizedOperation } from "./types.js"

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const

export function normalizeOpenApi(input: unknown, config: AccordCodegenConfig = {}): NormalizedApi {
  const diagnostics: CodegenDiagnostic[] = []
  if (!isObject(input)) {
    throw new AccordCodegenError([
      { code: "INVALID_DOCUMENT", message: "The OpenAPI document must be an object" },
    ])
  }

  const document = input
  const openapi = document["openapi"]
  if (typeof openapi !== "string") {
    diagnostics.push({
      code: "INVALID_DOCUMENT",
      message: "The document must contain an OpenAPI version string",
      location: "#/openapi",
    })
  } else if (!/^3\.(?:0|1)(?:\.|$)/.test(openapi)) {
    diagnostics.push({
      code: "UNSUPPORTED_OPENAPI_VERSION",
      message: `Accord supports OpenAPI 3.0 and 3.1, received ${openapi}`,
      location: "#/openapi",
    })
  }

  const paths = document["paths"]
  if (!isObject(paths)) {
    diagnostics.push({
      code: "INVALID_DOCUMENT",
      message: "The document must contain a paths object",
      location: "#/paths",
    })
    throwIfDiagnostics(diagnostics)
    throw new Error("unreachable")
  }

  const namespaceStrategy = config.namespace ?? "path"
  if (namespaceStrategy !== "path" && namespaceStrategy !== "tag") {
    diagnostics.push({
      code: "INVALID_EXTENSION",
      message: `Unknown namespace strategy ${String(namespaceStrategy)}`,
      location: "config.namespace",
    })
  }

  const operations: NormalizedOperation[] = []
  const operationIds = new Map<string, string>()
  const typeNames = new Map<string, string>()

  for (const path of Object.keys(paths).sort()) {
    const pathItemLocation = `#/paths/${pointerSegment(path)}`
    const pathItem = resolveObjectReference(document, paths[path], diagnostics, pathItemLocation)
    if (!pathItem) {
      if (!isObject(paths[path])) {
        diagnostics.push({
          code: "INVALID_PATH_ITEM",
          message: "Path item must be an object or an internal reference",
          location: pathItemLocation,
        })
      }
      continue
    }

    const pathParameters = normalizeParameterList(
      document,
      pathItem["parameters"],
      diagnostics,
      `${pathItemLocation}/parameters`,
    )

    for (const methodKey of HTTP_METHODS) {
      const rawOperation = pathItem[methodKey]
      if (rawOperation === undefined) continue
      const operationLocation = `${pathItemLocation}/${methodKey}`
      if (!isObject(rawOperation)) {
        diagnostics.push({
          code: "INVALID_OPERATION",
          message: "Operation must be an object",
          location: operationLocation,
        })
        continue
      }

      const method = methodKey.toUpperCase()
      const rawOperationId = rawOperation["operationId"]
      const operationId =
        typeof rawOperationId === "string" && rawOperationId.trim().length > 0
          ? rawOperationId
          : undefined
      if (rawOperationId !== undefined && operationId === undefined) {
        diagnostics.push({
          code: "INVALID_OPERATION",
          message: "operationId must be a non-empty string when present",
          location: `${operationLocation}/operationId`,
        })
      }
      if (operationId) {
        const previous = operationIds.get(operationId)
        if (previous) {
          diagnostics.push({
            code: "DUPLICATE_OPERATION_ID",
            message: `operationId ${JSON.stringify(operationId)} is already used by ${previous}`,
            location: `${operationLocation}/operationId`,
          })
        } else {
          operationIds.set(operationId, `${method} ${path}`)
        }
      }

      const operationParameters = normalizeParameterList(
        document,
        rawOperation["parameters"],
        diagnostics,
        `${operationLocation}/parameters`,
      )
      const parameters = mergeParameters(pathParameters, operationParameters)
      validateFlattenedParameters(parameters, diagnostics, operationLocation)
      validatePathParameters(path, parameters, diagnostics, operationLocation)

      const requestBody = normalizeRequestBody(
        document,
        rawOperation["requestBody"],
        diagnostics,
        `${operationLocation}/requestBody`,
      )
      const bodyMode = resolveBodyMode(config, rawOperation, operationId, method, path, diagnostics)
      validateMergedBody(parameters, requestBody, bodyMode, diagnostics, operationLocation)

      const name = operationName(rawOperation, methodKey, path)
      const namespace = operationNamespace({
        strategy: namespaceStrategy === "tag" ? "tag" : "path",
        path,
        ...(config.basePath !== undefined ? { basePath: config.basePath } : {}),
        ...(Array.isArray(rawOperation["tags"]) ? { tags: rawOperation["tags"] } : {}),
      })
      const typeName = sanitizeTypeIdentifier([...namespace, name].join(" "))
      const operationKey = operationId ?? `${method} ${path}`
      const previousType = typeNames.get(typeName)
      if (previousType) {
        diagnostics.push({
          code: "TYPE_NAME_COLLISION",
          message: `Operations ${previousType} and ${operationKey} both generate type name ${typeName}`,
          location: operationLocation,
        })
      } else {
        typeNames.set(typeName, operationKey)
      }

      operations.push({
        key: operationKey,
        method,
        methodKey,
        path,
        ...(operationId !== undefined ? { operationId } : {}),
        operationName: name,
        namespace,
        bodyMode,
        operationKind: resolveOperationKind(
          config,
          rawOperation,
          operationId,
          method,
          path,
          diagnostics,
          operationLocation,
        ),
        parameters,
        ...(requestBody !== undefined ? { requestBody } : {}),
        responses: normalizeResponses(
          document,
          rawOperation["responses"],
          diagnostics,
          `${operationLocation}/responses`,
        ),
        typeName,
      })
    }
  }

  operations.sort((left, right) => {
    const pathOrder = left.path.localeCompare(right.path)
    return pathOrder || left.method.localeCompare(right.method)
  })
  validateEndpointTree(operations, diagnostics)
  throwIfDiagnostics(diagnostics)

  return {
    openapi: typeof openapi === "string" ? openapi : "3.1.0",
    operations,
  }
}

function pointerSegment(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1")
}
