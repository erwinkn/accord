import type { ValidationAdapter } from "./validation-adapter.js"
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
  /** API cache identity, emitted once in defineApi. Defaults to a fingerprint of the API contract. */
  readonly apiId?: string
  /** Opt in to response schema generation with a library-specific adapter. */
  readonly validators?: ValidationAdapter
  readonly defaultMediaTypes?: Readonly<Record<string, string>>
  readonly sourceUrl?: string
  readonly namespace?: NamespaceStrategy
  /** Removed from inferred namespaces, but retained in runtime endpoint paths. */
  readonly basePath?: string
  readonly body?: BodyCodegenConfig
  /** Overrides keyed by operationId first, or by `METHOD /path`. */
  readonly operationKinds?: Readonly<Record<string, OperationKind>>
}

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject

export interface JsonObject {
  readonly [key: string]: JsonValue
}
