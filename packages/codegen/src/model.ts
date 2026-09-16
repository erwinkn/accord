import type { CodecPlan, EndpointPlan } from "@accord/client"
import type { JsonObject, JsonValue } from "./types.js"

/** Identity is a canonical source URI, including its JSON pointer. */
export type SchemaId = string
export type Direction = "request" | "response"

export interface SourceLocation {
  readonly document: string
  readonly pointer: string
  readonly base: string
  readonly resource: string
}

export interface LocatedValue {
  readonly value: JsonValue
  readonly source: SourceLocation
}

export interface SchemaResource {
  readonly uri: string
  readonly root: LocatedValue
  readonly dialect: "3.0" | "3.1"
  readonly anchors: ReadonlyMap<string, LocatedValue>
  readonly dynamicAnchors: ReadonlyMap<string, LocatedValue>
}

/**
 * Keyword scopes stay intact, including $ref siblings and unevaluated*.
 * `edges` indexes only schema-valued keyword positions; defaults/examples are data.
 * Rules are immutable source meaning. All projections read this graph.
 */
export interface SchemaNode {
  readonly id: SchemaId
  readonly source: SourceLocation
  readonly rules: boolean | JsonObject
  readonly edges: ReadonlyMap<string, SchemaId>
  readonly reference?: SchemaId
  readonly dynamicAnchor?: string
}

export interface ParameterModel {
  readonly name: string
  readonly inputName: string
  readonly location: "path" | "query" | "header" | "cookie"
  readonly required: boolean
  readonly schema: SchemaId
  readonly codec: CodecPlan
  readonly source: SourceLocation
}

export interface MediaModel {
  readonly mediaType: string
  readonly schema: SchemaId
  readonly codec: CodecPlan
}

export interface ResponseModel {
  readonly status: string
  readonly media: readonly MediaModel[]
  readonly headers: readonly ParameterModel[]
}

export interface OperationModel {
  readonly key: string
  readonly typeName: string
  readonly exportPath: readonly string[]
  readonly description?: string
  readonly deprecated: boolean
  readonly parameters: readonly ParameterModel[]
  readonly body?: {
    readonly required: boolean
    readonly mode: "merge" | "separate"
    readonly media: readonly MediaModel[]
    readonly fields: readonly string[]
  }
  readonly responses: readonly ResponseModel[]
  readonly plan: EndpointPlan
  readonly source: SourceLocation
}

export interface ApiModel {
  readonly prefix: string
  readonly version: "3.0" | "3.1"
  readonly schemas: ReadonlyMap<SchemaId, SchemaNode>
  readonly resources: ReadonlyMap<string, SchemaResource>
  readonly namedSchemas: ReadonlyMap<string, SchemaId>
  readonly operations: readonly OperationModel[]
}
