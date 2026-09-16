import type { IdentifierRequest } from "./naming.js"
import type { JsonObject } from "./types.js"

/** A normalized schema for a decoded response value, projected from Accord's semantic model. */
export type ValidationSchema = boolean | JsonObject
export interface ValidationSchemaExport {
  readonly name: string
  readonly type: string
  readonly schema: ValidationSchema
}
export interface ValidationContext {
  readonly documents: readonly JsonObject[]
  readonly schemas: readonly ValidationSchemaExport[]
  /** Printable response types indexed by resolved schema URI. */
  readonly referenceTypes: ReadonlyMap<string, string>
  /** Allocate all helper names together, reserving the SDK's public identifiers. */
  allocateIdentifiers(requests: readonly IdentifierRequest[]): ReadonlyMap<string, string>
}
export interface ValidationSource {
  readonly imports: readonly string[]
  readonly declarations: readonly string[]
}
/** Runs only during code generation. Emitted schemas must implement Standard Schema v1. */
export interface ValidationAdapter {
  readonly name: string
  readonly reservedNames?: readonly string[]
  generate(context: ValidationContext): ValidationSource
}
export interface ValidationAdapterModule {
  default(): ValidationAdapter
}
