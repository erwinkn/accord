import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { parse as parseYaml } from "yaml"
import { AccordCodegenError, type DiagnosticCode } from "./diagnostics.js"
import type { LocatedValue, SchemaResource, SourceLocation } from "./model.js"
import { canonicalize, isObject, isString } from "./object.js"
import type { JsonObject, JsonValue } from "./types.js"

type Role = "openapi" | "schema" | "schema-map" | "openapi-map" | "data"
const SCHEMA_MAPS = new Set([
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
  "dependentSchemas",
  "dependencies",
])
const SCHEMA_ARRAYS = new Set(["allOf", "anyOf", "oneOf", "prefixItems"])
const SCHEMA_SINGLE = new Set([
  "additionalProperties",
  "unevaluatedProperties",
  "propertyNames",
  "items",
  "additionalItems",
  "contains",
  "unevaluatedItems",
  "not",
  "if",
  "then",
  "else",
  "contentSchema",
])
const OPENAPI_MAPS = new Set([
  "paths",
  "responses",
  "content",
  "headers",
  "parameters",
  "requestBodies",
  "securitySchemes",
  "callbacks",
  "links",
  "examples",
])
function childRole(role: Role, key: string): Role {
  if (role === "data") return "data"
  if (role === "schema-map") return "schema"
  if (role === "openapi-map") return "openapi"
  if (role === "schema") {
    if (SCHEMA_MAPS.has(key) || SCHEMA_ARRAYS.has(key)) return "schema-map"
    return SCHEMA_SINGLE.has(key) ? "schema" : "data"
  }
  if (key === "schema") return "schema"
  if (key === "schemas") return "schema-map"
  if (OPENAPI_MAPS.has(key)) return "openapi-map"
  if (["example", "default", "enum", "value"].includes(key) || key.startsWith("x-")) return "data"
  return "openapi"
}

export function fail(code: DiagnosticCode, message: string, source?: SourceLocation): never {
  const diagnostic = {
    code,
    message,
    location: source ? `${source.document}#${source.pointer}` : "#",
  }
  throw new AccordCodegenError([diagnostic])
}

export function pointerSegment(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1")
}

export function object(value: JsonValue | undefined): JsonObject {
  return isObject(value) ? value : {}
}

export function string(value: JsonValue | undefined, fallback = ""): string {
  return isString(value) ? value : fallback
}

export function list(value: JsonValue | undefined): readonly JsonValue[] {
  return Array.isArray(value) ? value : []
}

export function sourceUri(path: string): string {
  return /^(https?|file):/.test(path) ? new URL(path).href : pathToFileURL(resolve(path)).href
}

/** Resolves URI resources once, before semantic compilation. */
export class DocumentStore {
  readonly documents = new Map<string, JsonValue>()
  readonly locations = new Map<string, LocatedValue>()
  readonly resources = new Map<string, SchemaResource>()
  readonly references: {
    readonly at: LocatedValue
    readonly reference: string
    readonly role: Role
  }[] = []
  private readonly indexed = new Set<string>()
  readonly root: LocatedValue
  readonly version: "3.0" | "3.1"

  constructor(document: JsonValue, uri: string) {
    if (!isObject(document)) fail("INVALID_DOCUMENT", "The OpenAPI document must be an object")
    const version = string(document["openapi"])
    if (!version) fail("INVALID_DOCUMENT", "The document must contain an OpenAPI version string")
    if (!/^3\.[01]\.\d+$/.test(version)) {
      fail(
        "UNSUPPORTED_OPENAPI_VERSION",
        `Expected OpenAPI 3.0 or 3.1; received ${version || "no version"}`,
      )
    }
    const dialect = document["jsonSchemaDialect"]
    if (
      isString(dialect) &&
      ![
        "https://spec.openapis.org/oas/3.1/dialect/base",
        "https://json-schema.org/draft/2020-12/schema",
      ].includes(dialect)
    )
      fail("INVALID_SCHEMA", `Unsupported schema dialect ${dialect}`)
    this.version = version.startsWith("3.0.") ? "3.0" : "3.1"
    this.index(document, uri)
    this.root = this.at(uri, "")
  }

  private index(document: JsonValue, uri: string, start?: LocatedValue, override?: Role): void {
    if (!start) this.documents.set(uri, document)
    const visit = (
      value: JsonValue,
      pointer: string,
      base: string,
      resource: string,
      ancestors: Set<JsonObject | readonly JsonValue[]>,
      role: Role,
    ): void => {
      const identity = `${uri}#${pointer}:${role}`
      if (this.indexed.has(identity)) return
      this.indexed.add(identity)
      if (role === "schema" && isObject(value) && isString(value["$id"])) {
        try {
          base = new URL(value["$id"], base).href
        } catch {
          fail("INVALID_SCHEMA", "Invalid schema $id")
        }
        resource = base
      }
      const located: LocatedValue = { value, source: { document: uri, pointer, base, resource } }
      this.locations.set(`${uri}#${pointer}`, located)
      if (!this.resources.has(resource)) {
        this.resources.set(resource, {
          uri: resource,
          root: located,
          dialect: this.version,
          anchors: new Map(),
          dynamicAnchors: new Map(),
        })
      }
      if (Array.isArray(value) || isObject(value)) {
        if (ancestors.has(value))
          fail("INVALID_DOCUMENT", "Cyclic YAML aliases are not JSON values", located.source)
        ancestors.add(value)
        if (isObject(value) && role !== "data" && role !== "schema-map" && role !== "openapi-map") {
          const scope = this.resources.get(resource)!
          for (const keyword of ["$anchor", "$dynamicAnchor"] as const) {
            const anchor = value[keyword]
            if (isString(anchor)) {
              const target = keyword === "$anchor" ? scope.anchors : scope.dynamicAnchors
              if (target.has(anchor))
                fail("INVALID_SCHEMA", `Duplicate anchor ${anchor}`, located.source)
              // SAFETY: indexing owns the mutable anchor maps until loading completes.
              const mutable = target as Map<string, LocatedValue>
              mutable.set(anchor, located)
            }
          }
          for (const keyword of ["$ref", "$dynamicRef"] as const) {
            const ref = value[keyword]
            if (isString(ref)) this.references.push({ at: located, reference: ref, role })
          }
        }
        for (const [key, child] of Object.entries(value)) {
          visit(
            child,
            `${pointer}/${pointerSegment(key)}`,
            base,
            resource,
            ancestors,
            Array.isArray(value) && role === "openapi" ? "openapi" : childRole(role, key),
          )
        }
        ancestors.delete(value)
      }
    }
    const root = object(document)
    const role: Role =
      root["openapi"] !== undefined ||
      root["content"] !== undefined ||
      root["in"] !== undefined ||
      root["responses"] !== undefined ||
      root["schema"] !== undefined
        ? "openapi"
        : "schema"
    visit(
      start?.value ?? document,
      start?.source.pointer ?? "",
      start?.source.base ?? uri,
      start?.source.resource ?? uri,
      new Set(),
      override ?? role,
    )
    if (!this.resources.has(uri)) {
      const rootAt = this.locations.get(`${uri}#`)!
      this.resources.set(uri, this.resources.get(rootAt.source.resource)!)
    }
  }

  at(document: string, pointer: string): LocatedValue {
    const value = this.locations.get(`${document}#${pointer}`)
    if (!value) fail("UNRESOLVED_REF", `No value at ${document}#${pointer}`)
    return value
  }

  child(at: LocatedValue, ...keys: readonly string[]): LocatedValue {
    return this.at(at.source.document, `${at.source.pointer}/${keys.map(pointerSegment).join("/")}`)
  }

  async preload(): Promise<void> {
    for (let index = 0; index < this.references.length; index += 1) {
      const ref = this.references[index]!
      let url: URL
      try {
        url = new URL(ref.reference, ref.at.source.base)
      } catch {
        fail("UNRESOLVED_REF", `Invalid reference ${ref.reference}`, ref.at.source)
      }
      url.hash = ""
      if (!this.resources.has(url.href) && !this.documents.has(url.href)) {
        this.index(await readDocument(url.href), url.href)
      }
      const target = this.resolve(ref.at, ref.reference)
      this.index(
        this.documents.get(target.source.document)!,
        target.source.document,
        target,
        ref.role,
      )
    }
  }

  resolve(at: LocatedValue, reference: string): LocatedValue {
    let url: URL
    try {
      url = new URL(reference, at.source.base)
    } catch {
      fail("UNRESOLVED_REF", `Invalid reference ${reference}`, at.source)
    }
    let fragment: string
    try {
      fragment = decodeURIComponent(url.hash.slice(1))
    } catch {
      fail("UNRESOLVED_REF", `Malformed reference fragment ${reference}`, at.source)
    }
    url.hash = ""
    const scope = this.resources.get(url.href)
    if (!scope) fail("UNRESOLVED_REF", `Unloaded schema resource ${url.href}`, at.source)
    if (!fragment) return scope.root
    if (fragment.startsWith("/")) {
      const target = this.locations.get(
        `${scope.root.source.document}#${scope.root.source.pointer}${fragment}`,
      )
      if (target) return target
    } else {
      const target = scope.anchors.get(fragment) ?? scope.dynamicAnchors.get(fragment)
      if (target) return target
    }
    fail("UNRESOLVED_REF", `Could not resolve ${reference}`, at.source)
  }

  dereference(at: LocatedValue): LocatedValue {
    const visited = new Set<string>()
    while (isObject(at.value) && isString(at.value["$ref"])) {
      const key = `${at.source.document}#${at.source.pointer}`
      if (visited.has(key)) fail("UNRESOLVED_REF", "Reference-object cycle", at.source)
      visited.add(key)
      at = this.resolve(at, at.value["$ref"])
    }
    return at
  }
}

export async function readDocument(uri: string): Promise<JsonValue> {
  let source: string
  try {
    const url = new URL(uri)
    if (url.protocol === "file:") source = await readFile(fileURLToPath(url), "utf8")
    else if (url.protocol === "https:" || url.protocol === "http:") {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      source = await response.text()
    } else throw new Error(`Unsupported reference protocol ${url.protocol}`)
    // YAML's JSON-compatible values enter the owned document graph at this boundary.
    const document: JsonValue = parseYaml(source, { maxAliasCount: 100 })
    return canonicalize(document)
  } catch (error) {
    fail(
      "INVALID_DOCUMENT",
      `Could not load ${uri}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
