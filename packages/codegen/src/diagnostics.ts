export type DiagnosticCode =
  | "INVALID_DOCUMENT"
  | "UNSUPPORTED_OPENAPI_VERSION"
  | "INVALID_PATH_ITEM"
  | "INVALID_OPERATION"
  | "INVALID_PARAMETER"
  | "INVALID_REQUEST_BODY"
  | "INVALID_RESPONSE"
  | "UNRESOLVED_REF"
  | "EXTERNAL_REF_UNSUPPORTED"
  | "DUPLICATE_OPERATION_ID"
  | "NAME_COLLISION"
  | "TYPE_NAME_COLLISION"
  | "INPUT_COLLISION"
  | "DANGEROUS_INPUT_NAME"
  | "BODY_MERGE_REQUIRES_OBJECT"
  | "BODY_MERGE_DYNAMIC_PROPERTIES"
  | "UNSUPPORTED_PARAMETER_STYLE"
  | "INVALID_EXTENSION"
  | "MAXIMUM_DEPTH_EXCEEDED"

export interface CodegenDiagnostic {
  readonly code: DiagnosticCode
  readonly message: string
  readonly location?: string
}

export class AccordCodegenError extends Error {
  readonly diagnostics: readonly CodegenDiagnostic[]

  constructor(diagnostics: readonly CodegenDiagnostic[]) {
    super(
      diagnostics
        .map(diagnostic =>
          diagnostic.location
            ? `[${diagnostic.code}] ${diagnostic.location}: ${diagnostic.message}`
            : `[${diagnostic.code}] ${diagnostic.message}`,
        )
        .join("\n"),
    )
    this.name = "AccordCodegenError"
    this.diagnostics = diagnostics
  }
}

export function throwIfDiagnostics(diagnostics: readonly CodegenDiagnostic[]): void {
  if (diagnostics.length > 0) throw new AccordCodegenError(diagnostics)
}
