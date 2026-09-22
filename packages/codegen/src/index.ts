export { defineConfig } from "./config.js"
export {
  AccordCodegenError,
  type CodegenDiagnostic,
  type DiagnosticCode,
  throwIfDiagnostics,
} from "./diagnostics.js"
export {
  type GenerateResult,
  generate,
  generateFromFile,
  loadOpenApiFile,
  type SdkWriteSummary,
  writeGeneratedFile,
  writeGeneratedSdk,
} from "./generate.js"
export type { ApiModel, OperationModel, SchemaNode, SchemaResource } from "./model.js"
export {
  allocateIdentifiers,
  fallbackOperationName,
  type IdentifierRequest,
  isDangerousInputName,
  operationName,
  operationNamespace,
  pathNamespace,
  sanitizeIdentifier,
  sanitizeTypeIdentifier,
  stripBasePath,
} from "./naming.js"
export { canonicalize, isObject } from "./object.js"
export type {
  AccordCodegenConfig,
  BodyCodegenConfig,
  BodyMode,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  NamespaceStrategy,
  OperationKind,
  ParameterLocation,
  ParameterStyle,
} from "./types.js"

export type * from "./validation-adapter.js"
export { type WatchNotice, type WatchOptions, watchGenerate } from "./watch.js"
