export { defineConfig } from "./config.js"
export {
  AccordCodegenError,
  throwIfDiagnostics,
  type CodegenDiagnostic,
  type DiagnosticCode,
} from "./diagnostics.js"
export {
  generate,
  generateFromFile,
  loadOpenApiFile,
  writeGeneratedFile,
  type GenerateResult,
} from "./generate.js"
export {
  isDangerousInputName,
  operationName,
  operationNamespace,
  pathNamespace,
  sanitizeIdentifier,
  sanitizeTypeIdentifier,
  stripBasePath,
} from "./naming.js"
export { normalizeOpenApi } from "./normalize.js"
export { canonicalize, isObject, resolveJsonPointer, resolveObjectReference } from "./object.js"
export { renderGeneratedModule, renderNormalizedApi } from "./render.js"
export type {
  AccordCodegenConfig,
  BodyCodegenConfig,
  BodyMode,
  JsonObject,
  NamespaceStrategy,
  NormalizedApi,
  NormalizedBodyEncoding,
  NormalizedOperation,
  NormalizedParameter,
  NormalizedRequestBody,
  NormalizedResponse,
  OperationKind,
  ParameterLocation,
  ParameterStyle,
} from "./types.js"
