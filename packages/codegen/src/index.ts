export type BodyMode = "merge" | "separate"
export type NamespaceStrategy = "path" | "tag"

export interface AccordCodegenConfig {
  readonly body?: {
    readonly mode?: BodyMode
  }
  readonly namespace?: NamespaceStrategy
  readonly basePath?: string
}

export interface NormalizedOperation {
  readonly method: string
  readonly path: string
  readonly operationName: string
  readonly namespace: readonly string[]
  readonly pathParams: readonly NormalizedParameter[]
  readonly queryParams: readonly NormalizedParameter[]
  readonly bodyMode: BodyMode
}

export interface NormalizedParameter {
  readonly name: string
  readonly required: boolean
  readonly style?: string
  readonly explode?: boolean
  readonly allowReserved?: boolean
}

/**
 * Convert an OpenAPI path into Accord's default namespace.
 * Dynamic path parameters are request inputs and are therefore omitted.
 */
export function pathNamespace(path: string, basePath = ""): string[] {
  const relativePath = basePath && path.startsWith(basePath)
    ? path.slice(basePath.length)
    : path

  return relativePath
    .split("/")
    .filter(Boolean)
    .filter(segment => !/^\{[^}]+\}$/.test(segment))
    .map(toIdentifier)
}

/** Operation naming precedence: x-sdk-name -> operationId -> HTTP method. */
export function operationName(operation: {
  readonly method: string
  readonly operationId?: string
  readonly extensions?: Readonly<Record<string, unknown>>
}): string {
  const explicitName = operation.extensions?.["x-sdk-name"]
  if (typeof explicitName === "string" && explicitName.length > 0) {
    return toIdentifier(explicitName)
  }

  if (operation.operationId) return toIdentifier(operation.operationId)
  return toIdentifier(operation.method.toLowerCase())
}

export function toIdentifier(value: string): string {
  const words = value
    .replace(/[^a-zA-Z0-9_$]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return "_"

  const [first = "_", ...rest] = words
  const identifier = first.charAt(0).toLowerCase() + first.slice(1) + rest
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")

  return /^[a-zA-Z_$]/.test(identifier) ? identifier : `_${identifier}`
}
