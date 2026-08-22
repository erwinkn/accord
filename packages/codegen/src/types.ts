export type BodyMode = "merge" | "separate"
export type NamespaceStrategy = "path" | "tag"
export type OperationKind = "query" | "mutation"
export type ParameterLocation = "path" | "query" | "header" | "cookie"
export type ParameterStyle =
  | "simple"
  | "label"
  | "matrix"
  | "form"
  | "spaceDelimited"
  | "pipeDelimited"
  | "deepObject"

export interface BodyCodegenConfig {
  readonly mode?: BodyMode
  /** Overrides keyed by operationId first, or by `METHOD /path`. */
  readonly overrides?: Readonly<Record<string, BodyMode>>
}

export interface AccordCodegenConfig {
  readonly namespace?: NamespaceStrategy
  /** Removed from inferred namespaces, but retained in runtime endpoint paths. */
  readonly basePath?: string
  readonly body?: BodyCodegenConfig
  /** Overrides keyed by operationId first, or by `METHOD /path`. */
  readonly operationKinds?: Readonly<Record<string, OperationKind>>
}

export interface NormalizedParameter {
  readonly name: string
  readonly inputName: string
  readonly in: ParameterLocation
  readonly required: boolean
  readonly style: ParameterStyle
  readonly explode: boolean
  readonly allowReserved: boolean
}

export interface NormalizedBodyEncoding {
  readonly contentType?: string
  readonly style?: "form" | "spaceDelimited" | "pipeDelimited" | "deepObject"
  readonly explode?: boolean
  readonly allowReserved?: boolean
}

export interface NormalizedRequestBody {
  readonly required: boolean
  readonly contentType: string
  readonly contentTypes: readonly string[]
  readonly fields: readonly string[]
  readonly encoding?: Readonly<Record<string, NormalizedBodyEncoding>>
}

export interface NormalizedResponse {
  readonly status: number | string
  readonly contentTypes: readonly string[]
}

export interface NormalizedOperation {
  readonly key: string
  readonly method: string
  readonly methodKey: string
  readonly path: string
  readonly operationId?: string
  readonly operationName: string
  readonly namespace: readonly string[]
  readonly bodyMode: BodyMode
  readonly operationKind: OperationKind
  readonly parameters: readonly NormalizedParameter[]
  readonly requestBody?: NormalizedRequestBody
  readonly responses: readonly NormalizedResponse[]
  readonly typeName: string
}

export interface NormalizedApi {
  readonly openapi: string
  readonly operations: readonly NormalizedOperation[]
}

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject

export interface JsonObject {
  readonly [key: string]: JsonValue
}
