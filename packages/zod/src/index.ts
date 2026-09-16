import type {
  JsonObject,
  JsonValue,
  ValidationAdapter,
  ValidationContext,
  ValidationSchema,
} from "@accord/codegen"

function object(value: JsonValue | undefined): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
function string(value: JsonValue | undefined): value is string {
  return typeof value === "string"
}
function boolean(value: JsonValue | undefined): value is boolean {
  return typeof value === "boolean"
}
function number(value: JsonValue | undefined): value is number {
  return typeof value === "number"
}
function schema(value: JsonValue | undefined): ValidationSchema {
  if (value === true || value === false || object(value)) return value
  throw new TypeError("Expected a JSON Schema object or boolean")
}
function record(value: JsonValue | undefined): JsonObject {
  return object(value) ? value : {}
}
function list(value: JsonValue | undefined): readonly JsonValue[] {
  return Array.isArray(value) ? value : []
}
const quote = JSON.stringify
const annotations = new Set([
  "$id",
  "$schema",
  "$anchor",
  "$comment",
  "$defs",
  "definitions",
  "title",
  "description",
  "default",
  "examples",
  "deprecated",
  "readOnly",
  "writeOnly",
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
])
interface EvaluatedProperties {
  names: Set<string>
  patterns: Set<string>
  all: boolean
}
interface FormatExpressions {
  readonly [name: string]: string
}
const supported = new Set([
  "$ref",
  "type",
  "enum",
  "const",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "properties",
  "required",
  "additionalProperties",
  "patternProperties",
  "propertyNames",
  "dependentRequired",
  "dependentSchemas",
  "unevaluatedProperties",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "minContains",
  "maxContains",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minProperties",
  "maxProperties",
  "accordBinary",
])

/** Generate native Zod schemas; no schema interpreter or validation library is shipped by core. */
export function zodAdapter(): ValidationAdapter {
  return { name: "zod", reservedNames: ["z", "accordZod"], generate: generateZod }
}
export default zodAdapter

function generateZod(context: ValidationContext) {
  const documents = new Map(
    context.documents.map((document) => [String(document["$id"]), document]),
  )
  const resolve = (ref: string): ValidationSchema => {
    const [uri = "", pointer = ""] = ref.split("#")
    let value: JsonValue | undefined = documents.get(uri)
    for (const encoded of pointer.split("/").slice(1)) {
      const key = decodeURIComponent(encoded).replace(/~1/g, "/").replace(/~0/g, "~")
      value = Array.isArray(value) ? value[Number(key)] : object(value) ? value[key] : undefined
    }
    if (value === undefined) throw new TypeError(`@accord/zod: unresolved reference ${ref}`)
    return schema(value)
  }
  const references = new Set<string>()
  const uses = new Map<string, number>()
  const visit = (definition: ValidationSchema): void => {
    if (!object(definition)) return
    for (const key of Object.keys(definition))
      if (!supported.has(key) && !annotations.has(key) && !key.startsWith("x-"))
        throw new TypeError(`@accord/zod: unsupported JSON Schema keyword ${key}`)
    const ref = definition["$ref"]
    if (string(ref)) uses.set(ref, (uses.get(ref) ?? 0) + 1)
    if (string(ref) && !references.has(ref)) {
      references.add(ref)
      visit(resolve(ref))
    }
    for (const key of ["allOf", "anyOf", "oneOf", "prefixItems"])
      for (const child of list(definition[key])) visit(schema(child))
    for (const key of [
      "not",
      "if",
      "then",
      "else",
      "additionalProperties",
      "propertyNames",
      "unevaluatedProperties",
      "items",
      "contains",
    ])
      if (definition[key] !== undefined) visit(schema(definition[key]))
    for (const key of ["properties", "patternProperties", "dependentSchemas"])
      for (const child of Object.values(record(definition[key]))) visit(schema(child))
  }
  for (const entry of context.schemas) visit(entry.schema)
  const names = context.allocateIdentifiers(
    [...references].map((ref) => ({
      key: ref,
      core: ref.split("/$defs/")[1]?.split("/")[0] ?? "Value",
      suffix: "Schema",
      qualifiers: [{ prefix: "Model" }],
    })),
  )
  const helpers = new Set<string>()
  const helper = (name: string) => {
    helpers.add(name)
    return `accordZod.${name}`
  }
  const states = new Map<string, "visiting" | "done">()
  const recursive = new Set<string>()
  const declarations: string[] = []
  const reference = (ref: string): string => {
    if (uses.get(ref) === 1) return emit(resolve(ref))
    const name = names.get(ref)!
    if (states.get(ref) === "visiting") {
      recursive.add(ref)
      return `z.lazy(() => ${name})`
    }
    if (!states.has(ref)) {
      states.set(ref, "visiting")
      const expression = emit(resolve(ref))
      const annotation = recursive.has(ref)
        ? `: z.ZodType<${context.referenceTypes.get(ref) ?? "unknown"}>`
        : ""
      const assertion = recursive.has(ref)
        ? ` as z.ZodType<${context.referenceTypes.get(ref) ?? "unknown"}>`
        : ""
      declarations.push(`const ${name}${annotation} = ${expression}${assertion}`)
      states.set(ref, "done")
    }
    return name
  }
  const union = (branches: readonly string[]): string =>
    branches.length === 0
      ? "z.never()"
      : branches.length === 1
        ? branches[0]!
        : `z.union([${branches.join(", ")}])`
  const intersect = (branches: readonly string[]): string =>
    branches
      .filter((branch) => branch !== "z.unknown()")
      .reduce((left, right) => (left ? `z.intersection(${left}, ${right})` : right), "") ||
    "z.unknown()"
  const evaluated = (
    definition: ValidationSchema,
    seen = new Set<string>(),
  ): EvaluatedProperties => {
    const result = { names: new Set<string>(), patterns: new Set<string>(), all: false }
    if (!object(definition)) return result
    if (
      ["anyOf", "oneOf", "if", "dependentSchemas", "unevaluatedProperties"].some(
        (key) => definition[key] !== undefined,
      )
    )
      throw new TypeError(
        "@accord/zod: unevaluatedProperties with conditional evaluation is not supported",
      )
    for (const key of Object.keys(record(definition["properties"]))) result.names.add(key)
    for (const key of Object.keys(record(definition["patternProperties"]))) result.patterns.add(key)
    result.all = definition["additionalProperties"] !== undefined
    const children = list(definition["allOf"]).map(schema)
    const ref = definition["$ref"]
    if (string(ref) && !seen.has(ref)) {
      seen.add(ref)
      children.push(resolve(ref))
    }
    for (const child of children) {
      const next = evaluated(child, seen)
      for (const name of next.names) result.names.add(name)
      for (const pattern of next.patterns) result.patterns.add(pattern)
      result.all ||= next.all
    }
    return result
  }
  const emit = (definition: ValidationSchema): string => {
    if (definition === true) return "z.unknown()"
    if (definition === false) return "z.never()"
    const child = (value: JsonValue) => emit(schema(value))
    const typed = (type: string): string => {
      if (type === "null") return "z.null()"
      if (type === "boolean") return "z.boolean()"
      if (type === "integer" || type === "number") {
        let expression =
          type === "integer"
            ? 'z.number().refine(Number.isInteger, "Expected integer")'
            : "z.number()"
        for (const [key, method] of [
          ["minimum", "gte"],
          ["maximum", "lte"],
          ["exclusiveMinimum", "gt"],
          ["exclusiveMaximum", "lt"],
          ["multipleOf", "multipleOf"],
        ])
          if (number(definition[key!])) expression += `.${method}(${definition[key!]})`
        return expression
      }
      if (type === "string") {
        let expression = "z.string()"
        const format = definition["format"]
        const formats: FormatExpressions = {
          email: "z.email()",
          uuid: "z.uuid()",
          "date-time": "z.iso.datetime({ offset: true })",
          date: "z.iso.date()",
          time: 'z.string().refine(value => z.iso.datetime({ offset: true }).safeParse(`1970-01-01T${value}`).success, "Invalid time with timezone")',
          duration: "z.iso.duration()",
          ipv4: "z.ipv4()",
          ipv6: "z.ipv6()",
          uri: "z.url()",
          regex: `z.string().refine(accordZod.validRegex, "Invalid regular expression")`,
        }
        if (string(format)) {
          if (Object.hasOwn(formats, format)) {
            expression = formats[format]!
            if (format === "regex") helper("validRegex")
          } else if (
            !["binary", "byte", "int32", "int64", "float", "double", "password"].includes(format)
          )
            throw new TypeError(`@accord/zod: unsupported format ${format}`)
        }
        if (string(definition["pattern"])) {
          new RegExp(definition["pattern"], "u")
          expression += `.regex(new RegExp(${quote(definition["pattern"])}, "u"))`
        }
        for (const [key, operator] of [
          ["minLength", ">="],
          ["maxLength", "<="],
        ])
          if (number(definition[key!]))
            expression += `.refine(value => [...value].length ${operator} ${definition[key!]}, ${quote(`Must satisfy ${key}: ${definition[key!]}`)})`
        return expression
      }
      if (type === "array") {
        const prefix = list(definition["prefixItems"])
        const item = definition["items"] === undefined ? "z.unknown()" : child(definition["items"])
        let expression = prefix.length
          ? `z.tuple([${prefix.map((entry) => `${child(entry)}.optional()`).join(", ")}])${definition["items"] === false ? "" : `.rest(${item})`}`
          : `z.array(${item})`
        // Tuple schemas do not expose .min/.max; count constraints apply independently of prefixItems.
        for (const [key, operator] of [
          ["minItems", ">="],
          ["maxItems", "<="],
        ])
          if (number(definition[key!]))
            expression += `.refine(value => value.length ${operator} ${definition[key!]}, ${quote(`Must satisfy ${key}: ${definition[key!]}`)})`
        if (definition["uniqueItems"] === true)
          expression += `.refine(${helper("uniqueItems")}, "Array items must be unique")`
        if (definition["contains"] !== undefined) {
          const min = definition["minContains"] ?? 1
          const max = definition["maxContains"]
          expression += `.refine(value => { const count = value.filter(item => ${child(definition["contains"]!)}.safeParse(item).success).length; return count >= ${min}${max === undefined ? "" : ` && count <= ${max}`}; }, "Array does not satisfy contains")`
        }
        return expression
      }
      if (type === "object") {
        const properties = record(definition["properties"])
        const required = list(definition["required"]).filter(string)
        const patterns = Object.entries(record(definition["patternProperties"]))
        const additional = definition["additionalProperties"]
        const closed = additional === false && !patterns.length
        const forbidden = Object.keys(properties).filter(
          (key) => properties[key] === false && !required.includes(key),
        )
        const fields = [...new Set([...Object.keys(properties), ...required])]
          // Forbidden properties must be absent, rather than `field?: undefined`.
          .filter((key) => !forbidden.includes(key))
          .map((key) => {
            const present = Object.hasOwn(properties, key)
            const field = present ? child(properties[key]!) : "z.unknown()"
            return `${key === "__proto__" ? `[${quote(key)}]` : quote(key)}: ${field}${required.includes(key) ? "" : ".optional()"}`
          })
        let expression = `z.${closed ? "strictObject" : "looseObject"}({\n${fields.join(",\n")}\n})`
        // Required names absent from properties are still additional properties under JSON Schema.
        if (
          required.some((key) => !Object.hasOwn(properties, key)) ||
          required.some(
            (key) =>
              properties[key] === true ||
              (object(properties[key]) && Object.keys(properties[key]).length === 0),
          )
        )
          expression += `.superRefine(${helper("requiredKeys")}(${quote(required)}))`
        if (
          patterns.length ||
          (additional !== undefined && required.some((key) => !Object.hasOwn(properties, key)))
        ) {
          const patternsSource = patterns
            .map(([pattern, value]) => {
              new RegExp(pattern, "u")
              return `[new RegExp(${quote(pattern)}, "u"), ${child(value)}]`
            })
            .join(", ")
          expression += `.superRefine(${helper("objectKeys")}(${quote(Object.keys(properties))}, [${patternsSource}], ${additional === undefined ? "undefined" : child(additional)}))`
        } else if (additional !== undefined && additional !== true && additional !== false)
          expression += `.catchall(${child(additional)})`
        // Closed objects reject these keys through strictObject; open objects retain
        // unknown keys, so check their presence explicitly without stripping values.
        if (!closed)
          for (const key of forbidden)
            expression += `.refine(value => !Object.hasOwn(value, ${quote(key)}), { message: "Property is forbidden", path: [${quote(key)}] })`
        for (const [key, operator] of [
          ["minProperties", ">="],
          ["maxProperties", "<="],
        ])
          if (number(definition[key!]))
            expression += `.refine(value => Object.keys(value).length ${operator} ${definition[key!]}, ${quote(`Must satisfy ${key}: ${definition[key!]}`)})`
        if (definition["propertyNames"] !== undefined)
          expression += `.superRefine(${helper("propertyNames")}(${child(definition["propertyNames"]!)}))`
        for (const [key, value] of Object.entries(record(definition["dependentRequired"])))
          expression += `.superRefine(${helper("dependentKeys")}(${quote(key)}, ${quote(value)}))`
        for (const [key, value] of Object.entries(record(definition["dependentSchemas"])))
          expression += `.superRefine(${helper("dependentSchema")}(${quote(key)}, ${child(value)}))`
        return expression
      }
      throw new TypeError(`@accord/zod: unsupported type ${type}`)
    }
    const branches: string[] = []
    const binary = definition["accordBinary"]
    if (object(binary)) {
      let value = "z.instanceof(ArrayBuffer)"
      if (number(binary["minByteLength"]))
        value += `.refine(value => value.byteLength >= ${binary["minByteLength"]}, "Binary body is too short")`
      if (number(binary["maxByteLength"]))
        value += `.refine(value => value.byteLength <= ${binary["maxByteLength"]}, "Binary body is too long")`
      branches.push(value)
    }
    const type = definition["type"]
    if (string(type)) branches.push(typed(type))
    else if (Array.isArray(type)) branches.push(union(type.filter(string).map(typed)))
    else {
      for (const [kind, keywords] of [
        [
          "object",
          [
            "properties",
            "required",
            "additionalProperties",
            "patternProperties",
            "propertyNames",
            "dependentRequired",
            "dependentSchemas",
            "minProperties",
            "maxProperties",
          ],
        ],
        ["array", ["items", "prefixItems", "minItems", "maxItems", "contains", "uniqueItems"]],
        ["string", ["minLength", "maxLength", "pattern", "format"]],
        ["number", ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf"]],
      ] as const)
        if (keywords.some((keyword) => definition[keyword] !== undefined))
          branches.push(`${helper("whenType")}(${quote(kind)}, ${typed(kind)})`)
    }
    const literal = (value: JsonValue): string =>
      value === null || string(value) || number(value) || boolean(value)
        ? `z.literal(${quote(value)})`
        : `z.unknown().refine(value => ${helper("equal")} (value, JSON.parse(${quote(quote(value))})), "Unexpected value")`
    if (definition["const"] !== undefined) branches.push(literal(definition["const"]))
    if (definition["enum"] !== undefined)
      branches.push(union(list(definition["enum"]).map(literal)))
    if (string(definition["$ref"])) branches.push(reference(definition["$ref"]))
    for (const entry of list(definition["allOf"])) branches.push(child(entry))
    if (definition["anyOf"] !== undefined)
      branches.push(union(list(definition["anyOf"]).map(child)))
    if (definition["oneOf"] !== undefined)
      branches.push(`z.xor([${list(definition["oneOf"]).map(child).join(", ")}])`)
    if (definition["not"] !== undefined)
      branches.push(
        `z.unknown().refine(value => !${child(definition["not"]!)}.safeParse(value).success, "Value matches forbidden schema")`,
      )
    if (definition["if"] !== undefined)
      branches.push(
        `${helper("conditional")}(${child(definition["if"]!)}, ${child(definition["then"] ?? true)}, ${child(definition["else"] ?? true)})`,
      )
    if (definition["unevaluatedProperties"] !== undefined) {
      const { unevaluatedProperties, ...rest } = definition
      const seen = evaluated(rest)
      if (!seen.all)
        branches.push(
          `${helper("whenType")}("object", z.looseObject({}).superRefine(${helper("objectKeys")}(${quote([...seen.names])}, [${[...seen.patterns].map((pattern) => `[new RegExp(${quote(pattern)}, "u"), z.unknown()]`).join(", ")}], ${child(unevaluatedProperties!)})))`,
        )
    }
    return intersect(branches)
  }
  for (const entry of context.schemas)
    declarations.push(`export const ${entry.name} = ${emit(entry.schema)}`)
  const imports = ['import { z } from "zod"']
  if (helpers.size) imports.push('import * as accordZod from "@accord/zod/runtime"')
  return { imports, declarations }
}
