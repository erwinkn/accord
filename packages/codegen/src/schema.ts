import type {
  CodecPlan,
  FormFieldPlan,
  FormStyleValue,
  Representation,
  StyleEncoding,
  XmlNode,
} from "@accord/client"
import { type DocumentStore, fail, list, object, string } from "./loader.js"
import type { Direction, LocatedValue, SchemaId, SchemaNode } from "./model.js"
import { isObject, isString } from "./object.js"
import type { JsonObject, JsonValue } from "./types.js"

const SCHEMA_MAPS = [
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
  "dependentSchemas",
] as const
const SCHEMA_ARRAYS = ["allOf", "anyOf", "oneOf", "prefixItems"] as const
const SCHEMA_SINGLE = [
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
] as const

interface XmlAttributes {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

export interface ObjectProjection {
  readonly fields: ReadonlyMap<string, readonly SchemaId[]>
  readonly required: ReadonlySet<string>
  readonly closed: boolean
  readonly object: boolean
  readonly alternatives: boolean
  readonly additional: SchemaId
  readonly patterns: ReadonlyMap<string, SchemaId>
}

export class SchemaGraph {
  readonly nodes = new Map<SchemaId, SchemaNode>()
  readonly named = new Map<string, SchemaId>()
  readonly any: SchemaId
  constructor(readonly store: DocumentStore) {
    this.any = "accord:unconstrained"
    this.nodes.set(this.any, {
      id: this.any,
      source: store.root.source,
      rules: true,
      edges: new Map(),
    })
  }

  add(at: LocatedValue): SchemaId {
    const id = `${at.source.document}#${at.source.pointer}`
    if (this.nodes.has(id)) return id
    if (!isObject(at.value) && at.value !== true && at.value !== false)
      fail("INVALID_SCHEMA", "A schema must be an object or boolean", at.source)
    let rules = at.value
    if (this.store.version === "3.0" && isObject(rules) && isString(rules["$ref"]))
      rules = { $ref: rules["$ref"] }
    const edges = new Map<string, SchemaId>()
    const node: SchemaNode = { id, source: at.source, rules, edges }
    this.nodes.set(id, node)
    if (!isObject(rules)) return id
    const dialect = rules["$schema"]
    if (
      isString(dialect) &&
      ![
        "https://json-schema.org/draft/2020-12/schema",
        "https://spec.openapis.org/oas/3.1/dialect/base",
      ].includes(dialect)
    )
      fail("INVALID_SCHEMA", `Unsupported schema dialect ${dialect}`, at.source)
    for (const key of SCHEMA_MAPS) {
      for (const name of Object.keys(object(rules[key])).sort())
        edges.set(`${key}/${name}`, this.add(this.store.child(at, key, name)))
    }
    for (const key of SCHEMA_ARRAYS) {
      for (const [index] of list(rules[key]).entries())
        edges.set(`${key}/${index}`, this.add(this.store.child(at, key, String(index))))
    }
    for (const key of SCHEMA_SINGLE) {
      if (rules[key] !== undefined) {
        if (key === "items" && Array.isArray(rules[key])) {
          for (const [index] of rules[key].entries())
            edges.set(`prefixItems/${index}`, this.add(this.store.child(at, key, String(index))))
        } else edges.set(key, this.add(this.store.child(at, key)))
      }
    }
    for (const [name, dependency] of Object.entries(object(rules["dependencies"]))) {
      if (!Array.isArray(dependency))
        edges.set(`dependentSchemas/${name}`, this.add(this.store.child(at, "dependencies", name)))
    }
    const reference = rules["$ref"] ?? rules["$dynamicRef"]
    if (isString(reference)) {
      const target = this.add(this.store.resolve(at, reference))
      const updated: SchemaNode = { ...node, reference: target }
      const anchor = isString(rules["$dynamicRef"]) ? reference.split("#")[1] : undefined
      this.nodes.set(
        id,
        anchor && !anchor.startsWith("/") ? { ...updated, dynamicAnchor: anchor } : updated,
      )
    }
    return id
  }

  assertProductiveReferences(): void {
    const complete = new Set<SchemaId>()
    const active = new Set<SchemaId>()
    const visit = (id: SchemaId): void => {
      if (complete.has(id)) return
      const node = this.get(id)
      if (active.has(id))
        fail(
          "INVALID_SCHEMA",
          "Schema recursion must progress through an object property or array item",
          node.source,
        )
      active.add(id)
      if (node.reference) visit(node.reference)
      for (const [key, child] of node.edges)
        if (
          ["allOf", "anyOf", "oneOf", "not", "if", "then", "else", "dependentSchemas"].includes(
            key.split("/")[0]!,
          )
        )
          visit(child)
      active.delete(id)
      complete.add(id)
    }
    for (const id of this.nodes.keys()) visit(id)
  }

  impossible(id: SchemaId, seen = new Set<SchemaId>()): boolean {
    if (seen.has(id)) return false
    seen.add(id)
    const node = this.get(id)
    if (node.rules === false) return true
    if (node.reference && this.impossible(node.reference, new Set(seen))) return true
    for (const [key, child] of node.edges)
      if (key.startsWith("allOf/") && this.impossible(child, new Set(seen))) return true
    for (const keyword of ["anyOf", "oneOf"]) {
      const children = [...node.edges].filter(([key]) => key.startsWith(`${keyword}/`))
      if (children.length && children.every(([, child]) => this.impossible(child, new Set(seen))))
        return true
    }
    return false
  }

  get(id: SchemaId): SchemaNode {
    return this.nodes.get(id)!
  }
  rules(id: SchemaId): JsonObject {
    return object(this.get(id).rules)
  }
  edge(id: SchemaId, key: string, seen = new Set<SchemaId>()): SchemaId {
    if (seen.has(id)) return this.any
    seen.add(id)
    const node = this.get(id)
    return node.edges.get(key) ?? (node.reference ? this.edge(node.reference, key, seen) : this.any)
  }

  annotation(id: SchemaId, key: string, seen = new Set<SchemaId>()): JsonValue | undefined {
    if (seen.has(id)) return undefined
    seen.add(id)
    const node = this.get(id)
    const local = object(node.rules)[key]
    return local ?? (node.reference ? this.annotation(node.reference, key, seen) : undefined)
  }

  excluded(id: SchemaId, direction: Direction): boolean {
    return this.annotation(id, direction === "request" ? "readOnly" : "writeOnly") === true
  }

  objectView(id: SchemaId, direction: Direction, seen = new Set<SchemaId>()): ObjectProjection {
    const fields = new Map<string, readonly SchemaId[]>()
    const required = new Set<string>()
    const patterns = new Map<string, SchemaId>()
    const unknown: ObjectProjection = {
      fields,
      required,
      patterns,
      closed: false,
      object: false,
      alternatives: false,
      additional: this.any,
    }
    if (seen.has(id)) return unknown
    seen = new Set(seen).add(id)
    const node = this.get(id)
    const rules = object(node.rules)
    let closed = rules["additionalProperties"] === false || rules["unevaluatedProperties"] === false
    let objectKind = rules["type"] === "object"
    let alternatives = false
    let additional = this.edge(id, "additionalProperties")
    const absorb = (view: ObjectProjection): void => {
      for (const [name, ids] of view.fields) fields.set(name, [...(fields.get(name) ?? []), ...ids])
      for (const name of view.required) required.add(name)
      for (const [pattern, schema] of view.patterns) patterns.set(pattern, schema)
      objectKind ||= view.object
      closed ||= view.closed
      alternatives ||= view.alternatives
      if (additional === this.any) additional = view.additional
    }
    if (node.reference) absorb(this.objectView(node.reference, direction, seen))
    for (const [key, child] of node.edges) {
      if (key.startsWith("properties/")) {
        const name = key.slice("properties/".length)
        if (!this.excluded(child, direction)) fields.set(name, [...(fields.get(name) ?? []), child])
      }
      if (key.startsWith("patternProperties/"))
        patterns.set(key.slice("patternProperties/".length), child)
      if (key.startsWith("allOf/")) absorb(this.objectView(child, direction, seen))
    }
    for (const name of list(rules["required"])) {
      if (isString(name) && !this.excluded(this.edge(id, `properties/${name}`), direction))
        required.add(name)
    }
    for (const keyword of ["oneOf", "anyOf"] as const) {
      const branches = [...node.edges]
        .filter(([key]) => key.startsWith(`${keyword}/`))
        .map(([, child]) => this.objectView(child, direction, seen))
      if (!branches.length) continue
      alternatives = true
      for (const branch of branches) {
        for (const [name, ids] of branch.fields)
          fields.set(name, [...(fields.get(name) ?? []), ...ids])
        for (const [pattern, schema] of branch.patterns) patterns.set(pattern, schema)
      }
      for (const name of branches[0]!.required)
        if (branches.every((branch) => branch.required.has(name))) required.add(name)
      objectKind ||= branches.every((branch) => branch.object)
      closed ||= branches.every((branch) => branch.closed)
    }
    return { fields, required, patterns, closed, object: objectKind, alternatives, additional }
  }

  kind(id: SchemaId, seen = new Set<SchemaId>()): string {
    if (seen.has(id)) return "unknown"
    seen.add(id)
    const node = this.get(id)
    const type = object(node.rules)["type"]
    if (isString(type)) return type
    if (Array.isArray(type) && type.length === 1 && isString(type[0])) return type[0]
    if (node.reference) {
      const referenced = this.kind(node.reference, new Set(seen))
      if (referenced !== "unknown") return referenced
    }
    const rules = object(node.rules)
    const values = Object.hasOwn(rules, "const") ? [rules["const"]!] : list(rules["enum"])
    const kinds = values
      .map((value) => {
        if (Array.isArray(value)) return "array"
        if (isObject(value)) return "object"
        if (value === null) return "null"
        // eslint-disable-next-line anti-slop/no-runtime-typeof -- Literal schema values determine their transport domain.
        return typeof value
      })
      .filter((kind) => kind !== "null")
    if (kinds.length && kinds.every((kind) => kind === kinds[0])) return kinds[0]!
    const all = [...node.edges]
      .filter(([key]) => key.startsWith("allOf/"))
      .map(([, child]) => this.kind(child, new Set(seen)))
      .filter((kind) => kind !== "unknown")
    if (all.length && all.every((kind) => kind === all[0])) return all[0]!
    for (const keyword of ["oneOf", "anyOf"]) {
      const branches = [...node.edges]
        .filter(([key]) => key.startsWith(`${keyword}/`))
        .map(([, child]) => this.kind(child, new Set(seen)))
      if (branches.length && branches.every((kind) => kind === branches[0])) return branches[0]!
    }
    return "unknown"
  }

  representation(
    id: SchemaId,
    direction: Direction,
    media: string,
    key: string,
    encoding: JsonObject = {},
  ): Representation {
    const actual = media.toLowerCase().split(";", 1)[0]!
    let codec: CodecPlan
    if (actual === "application/json" || actual.endsWith("+json")) codec = { kind: "json" }
    else if (actual === "application/xml" || actual === "text/xml" || actual.endsWith("+xml"))
      codec = this.xml(id, direction)
    else if (actual === "application/x-www-form-urlencoded" || actual === "multipart/form-data") {
      const view = this.objectView(id, direction)
      const fields: { [key: string]: FormFieldPlan } = Object.create(null)
      const patterns: { [key: string]: FormFieldPlan } = Object.create(null)
      for (const [name, schemas] of view.fields)
        fields[name] = this.formField(schemas[0]!, actual, object(encoding[name]), direction)
      for (const [pattern, schema] of view.patterns)
        patterns[pattern] = this.formField(schema, actual, {}, direction)
      codec = {
        kind: "form",
        mediaType: actual,
        fields,
        patterns,
        additional: this.formField(view.additional, actual, {}, direction),
      }
    } else if (actual.startsWith("text/")) {
      const kind = this.kind(id)
      codec =
        kind === "integer" || kind === "number"
          ? { kind: "text", value: "number" }
          : kind === "boolean"
            ? { kind: "text", value: "boolean" }
            : { kind: "text" }
    } else codec = { kind: "bytes", value: direction === "request" ? "upload" : "ArrayBuffer" }
    return { key, codec }
  }

  formField(
    id: SchemaId,
    media: string,
    encoding: JsonObject,
    direction: Direction,
  ): FormFieldPlan {
    const kind = this.kind(id)
    const item = kind === "array" ? this.edge(id, "items") : id
    const itemKind = this.kind(item)
    const contentEncoding = this.annotation(item, "contentEncoding")
    const binary = this.annotation(item, "format") === "binary" || contentEncoding !== undefined
    const defaultType =
      itemKind === "unknown" || binary
        ? "application/octet-stream"
        : itemKind === "object" || itemKind === "array"
          ? "application/json"
          : "text/plain"
    const contentType = string(encoding["contentType"], defaultType).split(",")[0]!.trim()
    let fieldCodec = this.representation(item, direction, contentType, "field").codec
    if (contentEncoding !== undefined || (itemKind === "unknown" && item === this.any))
      fieldCodec = { kind: "text" }
    const headers: { [key: string]: string } = Object.create(null)
    for (const [name, value] of Object.entries(object(encoding["headers"]))) {
      const header = object(value)
      const supplied =
        header["example"] ??
        object(header["schema"])["const"] ??
        object(header["schema"])["default"]
      if (supplied !== undefined) headers[name] = String(supplied)
    }
    const result: FormFieldPlan = {
      mediaType: contentType,
      codec: fieldCodec,
      multiple: kind === "array",
      headers,
    }
    const hasStyle =
      encoding["style"] !== undefined ||
      encoding["explode"] !== undefined ||
      encoding["allowReserved"] !== undefined
    if (
      hasStyle ||
      (this.store.version === "3.0" &&
        media === "application/x-www-form-urlencoded" &&
        encoding["contentType"] === undefined)
    ) {
      const styled: FormFieldPlan = {
        ...result,
        mediaType: "text/plain",
        codec: { kind: "parameter", encoding: styleEncoding(encoding, "query") },
        multiple: false,
      }
      if (direction === "request") return styled
      let styleValue: FormStyleValue
      if (kind === "array") styleValue = { kind: "array", items: fieldCodec }
      else if (kind === "object") {
        const view = this.objectView(id, direction)
        styleValue = {
          kind: "object",
          properties: Object.fromEntries(
            [...view.fields].map(([name, ids]) => [
              name,
              this.representation(ids[0]!, direction, "text/plain", "field").codec,
            ]),
          ),
          additional: this.representation(view.additional, direction, "text/plain", "field").codec,
        }
      } else styleValue = { kind: "primitive", codec: fieldCodec }
      return { ...styled, styleValue }
    }
    return result
  }

  xml(id: SchemaId, direction: Direction): Extract<CodecPlan, { kind: "xml" }> {
    const nodes: { [key: string]: XmlNode } = Object.create(null)
    const ids = new Map<SchemaId, string>()
    const build = (schema: SchemaId): string => {
      const previous = ids.get(schema)
      if (previous) return previous
      const key = `x${ids.size}`
      ids.set(schema, key)
      const kind = this.kind(schema)
      const source = object(this.annotation(schema, "xml"))
      const attributes: XmlAttributes = {}
      for (const name of ["name", "namespace", "prefix"] as const)
        if (isString(source[name])) attributes[name] = source[name]
      for (const name of ["attribute", "wrapped"] as const)
        if (source[name] === true || source[name] === false) attributes[name] = source[name]
      const resolvedKind = kind === "integer" ? "number" : kind
      let node: XmlNode = {
        kind:
          resolvedKind === "object" ||
          resolvedKind === "array" ||
          resolvedKind === "string" ||
          resolvedKind === "number" ||
          resolvedKind === "boolean"
            ? resolvedKind
            : "unknown",
        ...attributes,
      }
      nodes[key] = node
      if (kind === "object") {
        const view = this.objectView(schema, direction)
        const properties = Object.fromEntries(
          [...view.fields].map(([name, children]) => [name, build(children[0]!)]),
        )
        node = { ...node, properties, additional: build(view.additional) }
      }
      if (kind === "array") node = { ...node, items: build(this.edge(schema, "items")) }
      nodes[key] = node
      return key
    }
    return { kind: "xml", root: build(id), nodes }
  }
}

export function styleEncoding(
  value: JsonObject,
  location: "path" | "query" | "header" | "cookie",
): StyleEncoding {
  const defaultStyle = location === "path" || location === "header" ? "simple" : "form"
  const style = string(value["style"], defaultStyle)
  const allowed =
    location === "path"
      ? ["simple", "label", "matrix"]
      : location === "query"
        ? ["form", "spaceDelimited", "pipeDelimited", "deepObject"]
        : location === "header"
          ? ["simple"]
          : ["form"]
  if (!allowed.includes(style))
    fail("UNSUPPORTED_PARAMETER_STYLE", `Invalid ${location} style ${style}`)
  return {
    // SAFETY: validated against the location-specific subset above.
    style: style as StyleEncoding["style"],
    explode: value["explode"] === undefined ? style === "form" : value["explode"] === true,
    allowReserved: value["allowReserved"] === true,
  }
}
