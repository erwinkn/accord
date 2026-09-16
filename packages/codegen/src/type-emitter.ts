import type { CodecPlan } from "@accord/client"
import ts from "typescript"
import { list, object, string } from "./loader.js"
import type { Direction, SchemaId } from "./model.js"
import { sanitizeTypeIdentifier } from "./naming.js"
import { isJsonArray, isObject, isString } from "./object.js"
import type { SchemaGraph } from "./schema.js"
import { renameTypeReferences, typeReferences } from "./type-projections.js"
import type { JsonValue } from "./types.js"

const f = ts.factory
const readonly = [f.createModifier(ts.SyntaxKind.ReadonlyKeyword)]
export const unknownType = (): ts.TypeNode => f.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
export const neverType = (): ts.TypeNode => f.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
export const undefinedType = (): ts.TypeNode =>
  f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
export const typeReference = (name: string, args?: readonly ts.TypeNode[]): ts.TypeNode =>
  f.createTypeReferenceNode(name, args)
export const property = (name: string, type: ts.TypeNode, optional = false): ts.PropertySignature =>
  f.createPropertySignature(
    readonly,
    f.createStringLiteral(name),
    optional ? f.createToken(ts.SyntaxKind.QuestionToken) : undefined,
    type,
  )
export const typeLiteral = (properties: readonly ts.TypeElement[]): ts.TypeLiteralNode =>
  f.createTypeLiteralNode(properties)
function distinct(members: readonly ts.TypeNode[]): ts.TypeNode[] {
  return [...new Map(members.map((member) => [printNode(member), member])).values()]
}
export function union(members: readonly ts.TypeNode[]): ts.TypeNode {
  const flattened = members.flatMap((member) =>
    ts.isUnionTypeNode(member) ? [...member.types] : [member],
  )
  if (flattened.some((member) => member.kind === ts.SyntaxKind.UnknownKeyword)) return unknownType()
  const types = distinct(flattened.filter((member) => member.kind !== ts.SyntaxKind.NeverKeyword))
  return types.length === 0
    ? neverType()
    : types.length === 1
      ? types[0]!
      : f.createUnionTypeNode(types)
}
export function intersection(members: readonly ts.TypeNode[]): ts.TypeNode {
  const flattened = members.flatMap((member) =>
    ts.isIntersectionTypeNode(member) ? [...member.types] : [member],
  )
  if (flattened.some((member) => member.kind === ts.SyntaxKind.NeverKeyword)) return neverType()
  const types = distinct(flattened.filter((member) => member.kind !== ts.SyntaxKind.UnknownKeyword))
  return types.length === 0
    ? unknownType()
    : types.length === 1
      ? types[0]!
      : f.createIntersectionTypeNode(types)
}
export const alias = (name: string, type: ts.TypeNode): ts.TypeAliasDeclaration =>
  f.createTypeAliasDeclaration(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    name,
    undefined,
    type,
  )
export function literal(value: string | number | boolean | null): ts.TypeNode {
  if (value === null) return f.createLiteralTypeNode(f.createNull())
  if (value === true || value === false)
    return f.createLiteralTypeNode(value ? f.createTrue() : f.createFalse())
  if (isString(value)) return f.createLiteralTypeNode(f.createStringLiteral(value))
  return f.createLiteralTypeNode(
    value < 0
      ? f.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, f.createNumericLiteral(-value))
      : f.createNumericLiteral(value),
  )
}

/** Own semantic derivation; TypeScript's AST is only the output format. */
export class TypeEmitter {
  readonly names = new Map<string, string>()
  readonly declarations = new Map<string, ts.TypeAliasDeclaration>()
  private readonly used = new Set<string>()
  private readonly visiting = new Set<string>()
  private readonly cache = new Map<string, ts.TypeNode>()
  constructor(
    readonly graph: SchemaGraph,
    reserved: readonly string[] = [],
    allocated: ReadonlyMap<string, string> = new Map(),
  ) {
    for (const name of reserved) this.used.add(name)
    for (const [key, name] of allocated) {
      this.names.set(key, name)
      this.used.add(name)
    }
    for (const [name, id] of graph.named) {
      this.name(id, "response", sanitizeTypeIdentifier(name))
      this.name(id, "request", `${sanitizeTypeIdentifier(name)}Request`)
    }
  }

  private name(id: SchemaId, direction: Direction, preferred?: string, context = ""): string {
    const key = `${direction}:${id}${context}`
    const previous = this.names.get(key)
    if (previous) return previous
    const base =
      preferred ?? `Schema${this.names.size + 1}${direction === "request" ? "Request" : ""}`
    let name = base
    let suffix = 2
    while (this.used.has(name)) name = `${base}${suffix++}`
    this.used.add(name)
    this.names.set(key, name)
    return name
  }

  emit(id: SchemaId, direction: Direction, codec?: CodecPlan): ts.TypeNode {
    if (this.graph.impossible(id)) return neverType()
    if (codec?.kind === "bytes")
      return typeReference(codec.value === "upload" ? "BinaryUpload" : "ArrayBuffer")
    if (codec?.kind === "empty") return undefinedType()
    if (codec?.kind === "raw-response") return typeReference("Response")
    if (codec?.kind === "text")
      return codec.value === "number" || codec.value === "boolean"
        ? this.emit(id, direction)
        : intersection([
            this.emit(id, direction),
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          ])
    const form = codec?.kind === "form" ? codec : undefined
    const context = form ? JSON.stringify(form) : ""
    const key = `${direction}:${id}${context}`
    const defaultName = this.names.get(`${direction}:${id}`)
    if (context && defaultName) this.name(id, direction, `${defaultName}Form`, context)
    const named = this.names.get(key)
    if (this.visiting.has(key)) return typeReference(this.name(id, direction, undefined, context))
    if (named && this.declarations.has(named)) return typeReference(named)
    const cached = this.cache.get(key)
    if (cached) return named ? typeReference(named) : cached
    this.visiting.add(key)
    const result = this.node(id, direction, form)
    this.visiting.delete(key)
    this.cache.set(key, result)
    const finalName = this.names.get(key)
    if (finalName) {
      this.declarations.set(finalName, alias(finalName, result))
      return typeReference(finalName)
    }
    return result
  }

  emitNamed(): void {
    for (const id of this.graph.named.values()) {
      this.emit(id, "response")
      this.emit(id, "request")
    }
    this.shareIdenticalProjections()
  }

  private shareIdenticalProjections(): void {
    const shared = new Map<string, string>()
    for (const [key, request] of this.names) {
      if (!key.startsWith("request:")) continue
      const response = this.names.get(`response:${key.slice("request:".length)}`)
      if (
        response &&
        response !== request &&
        this.declarations.has(request) &&
        this.declarations.has(response)
      )
        shared.set(request, response)
    }
    // Initially assume paired projections agree. A field difference invalidates its
    // pair and then every containing pair. Identical recursive cycles stay shared.
    let changed = true
    while (changed) {
      changed = false
      for (const [request, response] of shared) {
        const input = this.declarations.get(request)!.type
        const output = this.declarations.get(response)!.type
        if (printNode(renameTypeReferences(input, shared)) !== printNode(output)) {
          shared.delete(request)
          changed = true
        }
      }
    }
    if (!shared.size) return
    for (const [key, name] of this.names) this.names.set(key, shared.get(name) ?? name)
    for (const [name, declaration] of this.declarations) {
      if (shared.has(name)) this.declarations.delete(name)
      else this.declarations.set(name, alias(name, renameTypeReferences(declaration.type, shared)))
    }
    for (const [key, type] of this.cache) this.cache.set(key, renameTypeReferences(type, shared))
  }

  /** Preserve public component types; keep alternate projections only when referenced. */
  retainUsedDeclarations(consumer: ts.Node): void {
    const used = new Set(typeReferences(consumer))
    for (const id of this.graph.named.values()) {
      const name = this.names.get(`response:${id}`)
      if (name) used.add(name)
    }
    for (const name of used) {
      const declaration = this.declarations.get(name)
      if (declaration) for (const reference of typeReferences(declaration.type)) used.add(reference)
    }
    for (const name of this.declarations.keys()) if (!used.has(name)) this.declarations.delete(name)
  }

  private constant(value: JsonValue): ts.TypeNode {
    if (isJsonArray(value))
      return f.createTypeOperatorNode(
        ts.SyntaxKind.ReadonlyKeyword,
        f.createTupleTypeNode(value.map((item) => this.constant(item))),
      )
    if (isObject(value))
      return typeLiteral(
        Object.entries(value).map(([key, item]) => property(key, this.constant(item))),
      )
    return literal(value)
  }

  private node(
    id: SchemaId,
    direction: Direction,
    form?: Extract<CodecPlan, { kind: "form" }>,
  ): ts.TypeNode {
    const node = this.graph.get(id)
    if (node.rules === true) return unknownType()
    if (node.rules === false) return neverType()
    const rules = node.rules
    const parts: ts.TypeNode[] = []
    if (node.reference) {
      let target = this.emit(node.reference, direction, form)
      if (rules["type"] === undefined) {
        if (
          [
            "properties",
            "required",
            "additionalProperties",
            "patternProperties",
            "unevaluatedProperties",
          ].some((key) => rules[key] !== undefined)
        ) {
          target = typeReference("AccordObjectConstraints", [
            target,
            this.object(id, direction, form),
          ])
        }
        if (
          ["items", "prefixItems", "minItems", "maxItems"].some((key) => rules[key] !== undefined)
        ) {
          target = typeReference("AccordArrayConstraints", [target, this.array(id, direction)])
        }
      }
      parts.push(target)
    }
    if (Object.hasOwn(rules, "const")) parts.push(this.constant(rules["const"]!))
    if (Array.isArray(rules["enum"]))
      parts.push(union(rules["enum"].map((value) => this.constant(value))))
    const rawTypes = rules["type"]
    const types = isString(rawTypes) ? [rawTypes] : list(rawTypes).filter(isString)
    if (types.length) {
      const domains = types.map((type) => this.typed(id, direction, type, form))
      if (this.graph.store.version === "3.0" && rules["nullable"] === true)
        domains.push(literal(null))
      parts.push(union(domains))
    } else if (!node.reference) {
      // JSON Schema keywords constrain their own domains; they do not imply `type`.
      const hasObject = [
        "properties",
        "required",
        "additionalProperties",
        "patternProperties",
        "unevaluatedProperties",
      ].some((key) => rules[key] !== undefined)
      const hasArray = ["items", "prefixItems", "minItems", "maxItems"].some(
        (key) => rules[key] !== undefined,
      )
      if (hasObject || hasArray) {
        parts.push(
          union([
            literal(null),
            f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
            f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            hasArray ? this.array(id, direction) : typeReference("ReadonlyArray", [unknownType()]),
            hasObject
              ? this.object(id, direction, form)
              : typeReference("Record", [
                  f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                  unknownType(),
                ]),
          ]),
        )
      }
    }
    for (const key of ["allOf", "oneOf", "anyOf"] as const) {
      const children = [...node.edges]
        .filter(([name]) => name.startsWith(`${key}/`))
        .map(([, child]) => this.emit(child, direction, form))
      if (children.length) parts.push(key === "allOf" ? intersection(children) : union(children))
    }
    let result = intersection(parts)
    const not = node.edges.get("not")
    if (not && this.graph.get(not).rules === true) result = neverType()
    return result
  }

  private typed(
    id: SchemaId,
    direction: Direction,
    type: string,
    form?: Extract<CodecPlan, { kind: "form" }>,
  ): ts.TypeNode {
    if (type === "null") return literal(null)
    if (type === "object") return this.object(id, direction, form)
    if (type === "array") return this.array(id, direction)
    if (type === "boolean") return f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
    if (type === "number" || type === "integer")
      return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
    if (type === "string") {
      const pattern = string(this.graph.rules(id)["pattern"])
      const prefix = /^\^([A-Za-z0-9 _:-]+)\.\*\$$/.exec(pattern)?.[1]
      if (prefix)
        return f.createTemplateLiteralType(f.createTemplateHead(prefix), [
          f.createTemplateLiteralTypeSpan(
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            f.createTemplateTail(""),
          ),
        ])
      return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
    }
    return unknownType()
  }

  private object(
    id: SchemaId,
    direction: Direction,
    form?: Extract<CodecPlan, { kind: "form" }>,
  ): ts.TypeNode {
    const rules = this.graph.rules(id)
    const properties = object(rules["properties"])
    const required = new Set(list(rules["required"]).filter(isString))
    const elements: ts.TypeElement[] = []
    for (const name of [...new Set([...Object.keys(properties), ...required])].sort()) {
      const child = this.graph.get(id).edges.get(`properties/${name}`)
      if (child && this.graph.excluded(child, direction))
        elements.push(property(name, neverType(), true))
      else {
        const schema = child ?? this.graph.edge(id, "additionalProperties")
        const field = form?.fields[name] ?? form?.additional
        const valueCodec = field?.codec.kind === "bytes" ? field.codec : undefined
        const valueType = field?.multiple
          ? typeReference("ReadonlyArray", [
              this.emit(this.graph.edge(schema, "items"), direction, valueCodec),
            ])
          : this.emit(schema, direction, valueCodec)
        elements.push(property(name, valueType, !required.has(name)))
      }
    }
    const additional = this.graph.edge(id, "additionalProperties")
    const patterns = [...this.graph.get(id).edges].filter(([key]) =>
      key.startsWith("patternProperties/"),
    )
    if (rules["additionalProperties"] !== false && rules["unevaluatedProperties"] !== false) {
      let value = this.emit(additional, direction)
      // TS's string index covers named properties and narrower pattern indexes too. Include
      // their actual projected types (including form binary values); their own declarations
      // retain their narrower constraints. JSON Schema additionalProperties excludes both.
      if (additional !== this.graph.any)
        value = union([
          value,
          ...elements.flatMap((element) =>
            ts.isPropertySignature(element) && element.type ? [element.type] : [],
          ),
          ...patterns.map(([, child]) => this.emit(child, direction)),
        ])
      elements.push(
        f.createIndexSignature(
          readonly,
          [
            f.createParameterDeclaration(
              undefined,
              undefined,
              "key",
              undefined,
              f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            ),
          ],
          value,
        ),
      )
    }
    for (const [pattern, child] of patterns) {
      const expression = pattern.slice("patternProperties/".length)
      const prefix = /^\^([A-Za-z0-9 _:-]+)(?:\.\*)?\$?$/.exec(expression)?.[1]
      if (prefix) {
        const key = f.createTemplateLiteralType(f.createTemplateHead(prefix), [
          f.createTemplateLiteralTypeSpan(
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            f.createTemplateTail(""),
          ),
        ])
        elements.push(
          f.createIndexSignature(
            readonly,
            [f.createParameterDeclaration(undefined, undefined, "key", undefined, key)],
            this.emit(child, direction),
          ),
        )
      }
    }
    return typeLiteral(elements)
  }

  private array(id: SchemaId, direction: Direction): ts.TypeNode {
    const node = this.graph.get(id)
    const rules = object(node.rules)
    const prefix = [...node.edges]
      .filter(([key]) => key.startsWith("prefixItems/"))
      .sort(([a], [b]) => Number(a.split("/")[1]) - Number(b.split("/")[1]))
      .map(([, child]) => child)
    const minimum = Number(rules["minItems"] ?? 0)
    const max = rules["maxItems"]
    const item = node.edges.get("items") ?? this.graph.any
    const closed = this.graph.get(item).rules === false
    if (!prefix.length && minimum === 0 && max === undefined && !closed)
      return typeReference("ReadonlyArray", [this.emit(item, direction)])
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- maxItems is an optional numeric schema keyword.
    const limit = closed
      ? prefix.length
      : // eslint-disable-next-line anti-slop/no-runtime-typeof -- Read the optional numeric maxItems keyword.
        typeof max === "number"
        ? max
        : Math.max(prefix.length, minimum)
    if (limit < minimum) return neverType()
    const elements: ts.TypeNode[] = []
    for (let index = 0; index < limit; index += 1) {
      const type = this.emit(prefix[index] ?? item, direction)
      elements.push(index >= minimum ? f.createOptionalTypeNode(type) : type)
    }
    if (!closed && max === undefined)
      elements.push(f.createRestTypeNode(f.createArrayTypeNode(this.emit(item, direction))))
    return f.createTypeOperatorNode(ts.SyntaxKind.ReadonlyKeyword, f.createTupleTypeNode(elements))
  }
}

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
const file = ts.createSourceFile(
  "generated.ts",
  "",
  ts.ScriptTarget.Latest,
  false,
  ts.ScriptKind.TS,
)
export function printNode(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, file)
}
