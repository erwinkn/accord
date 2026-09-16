import { createRequire } from "node:module"
import { dirname } from "node:path"
import { _, Ajv2020 } from "ajv/dist/2020.js"
import { build } from "esbuild"
import type { Compilation } from "./compile.js"
import type { DocumentStore } from "./loader.js"
import { object, pointerSegment } from "./loader.js"
import type { SchemaId } from "./model.js"
import { isObject, isString } from "./object.js"
import type { JsonObject, JsonValue } from "./types.js"

// Ajv's CJS plugin exports do not expose a callable default under NodeNext's interop types.
const require = createRequire(import.meta.url)
const addFormats: typeof import("ajv-formats").default = require("ajv-formats")
const standalone: typeof import("ajv/dist/standalone/index.js").default = require("ajv/dist/standalone/index.js")

export interface ValidatorBinding {
  readonly exportName: string
  readonly binary: boolean
  readonly schema: SchemaId
}
export interface ValidatorOutput {
  readonly module: string
  readonly files: Readonly<Record<string, string>>
  readonly bindings: ReadonlyMap<string, ReadonlyMap<string, ValidatorBinding>>
}

/** Place source schema trees under real JSON Schema keywords before handing them to Ajv.
 * OpenAPI paths/media names are not schema keywords; passing the whole API to a schema
 * walker can misinterpret instance data and fails to escape pointers under unknown keys.
 */
interface ValidatorDocuments {
  readonly documents: ReadonlyMap<string, JsonObject>
  readonly references: ReadonlyMap<SchemaId, string>
}
function validationDocuments(
  compilation: Compilation,
  store: DocumentStore,
  binarySchemas: ReadonlySet<SchemaId> = new Set(),
  context = "base",
): ValidatorDocuments {
  const graph = compilation.graph
  const nodes = [...graph.nodes.values()].filter((node) => node.id !== graph.any)
  const roots = nodes.filter(
    (node) =>
      !nodes.some(
        (parent) =>
          parent !== node &&
          parent.source.document === node.source.document &&
          node.source.pointer.startsWith(`${parent.source.pointer}/`),
      ),
  )
  const references = new Map<SchemaId, string>()
  const containers = new Map<string, { uri: string; definitions: { [key: string]: JsonValue } }>()
  for (const root of roots) {
    let container = containers.get(root.source.document)
    if (!container) {
      container = {
        uri: `urn:accord:${compilation.model.id}:${context}:resource${containers.size}`,
        definitions: Object.create(null),
      }
      containers.set(root.source.document, container)
    }
    const key = `schema${Object.keys(container.definitions).length}`
    container.definitions[key] = true
    for (const node of nodes) {
      if (
        node.source.document === root.source.document &&
        (node === root || node.source.pointer.startsWith(`${root.source.pointer}/`))
      ) {
        references.set(
          node.id,
          `${container.uri}#/$defs/${key}${node.source.pointer.slice(root.source.pointer.length)}`,
        )
      }
    }
  }
  const project = (value: JsonValue, document: string, pointer: string): JsonValue => {
    const node = graph.nodes.get(`${document}#${pointer}`)
    if (node?.rules === false) return false
    if (node && binarySchemas.has(node.id))
      return {
        accordBinary: {
          minimum: graph.annotation(node.id, "minLength") ?? 0,
          maximum: graph.annotation(node.id, "maxLength") ?? Number.MAX_SAFE_INTEGER,
        },
      }
    if (Array.isArray(value))
      return value.map((child, index) => project(child, document, `${pointer}/${index}`))
    if (!isObject(value)) return value
    if (node?.rules === true) return node.rules
    const original = node ? object(node.rules) : value
    const output: { [key: string]: JsonValue } = Object.create(null)
    for (const [key, child] of Object.entries(original)) {
      if (node && ["nullable", "discriminator", "xml", "example"].includes(key)) continue
      output[key] = project(child, document, `${pointer}/${pointerSegment(key)}`)
    }
    if (node) {
      if (isString(original["$id"]))
        output["$id"] =
          context === "base"
            ? node.source.base
            : `${node.source.base}${node.source.base.includes("?") ? "&" : "?"}accord-context=${context}`
      if (isString(original["$ref"]) && node.reference)
        output["$ref"] = references.get(node.reference)!
      // Local dynamic anchors must remain dynamic rather than being replaced by static targets.
      if (isString(original["$dynamicRef"])) output["$dynamicRef"] = original["$dynamicRef"]
      if (isObject(output["properties"])) {
        const properties = { ...output["properties"] }
        const excluded = new Set<string>()
        for (const key of Object.keys(properties)) {
          if (graph.excluded(graph.edge(node.id, `properties/${key}`), "response")) {
            properties[key] = false
            excluded.add(key)
          }
        }
        output["properties"] = properties
        const required = output["required"]
        if (Array.isArray(required))
          output["required"] = required.filter((name) => !isString(name) || !excluded.has(name))
      }
      if (store.version === "3.0") {
        if (original["nullable"] === true && isString(original["type"]))
          output["type"] = [original["type"], "null"]
        for (const [exclusive, bound] of [
          ["exclusiveMinimum", "minimum"],
          ["exclusiveMaximum", "maximum"],
        ] as const) {
          if (original[exclusive] === true && original[bound] !== undefined) {
            output[exclusive] = original[bound]
            delete output[bound]
          } else if (original[exclusive] === false) delete output[exclusive]
        }
      }
    }
    return output
  }
  for (const root of roots) {
    const container = containers.get(root.source.document)!
    const key = references.get(root.id)!.split("/$defs/")[1]!
    container.definitions[key] = project(root.rules, root.source.document, root.source.pointer)
  }
  return {
    documents: new Map(
      [...containers.values()].map((container) => [
        container.uri,
        { $id: container.uri, $defs: container.definitions },
      ]),
    ),
    references,
  }
}

export async function generateValidators(
  compilation: Compilation,
  store: DocumentStore,
): Promise<ValidatorOutput> {
  const ajv = new Ajv2020({
    strict: false,
    validateSchema: false,
    allErrors: true,
    ownProperties: true,
    code: { source: true, esm: true },
    removeAdditional: false,
    useDefaults: false,
    coerceTypes: false,
  })
  ajv.addKeyword({
    keyword: "accordBinary",
    schemaType: "object",
    code(context) {
      const { data, schemaCode } = context
      context.fail(
        _`!(${data} instanceof ArrayBuffer) || ${data}.byteLength < ${schemaCode}.minimum || ${data}.byteLength > ${schemaCode}.maximum`,
      )
    },
  })
  addFormats(ajv)
  // Formats describing transport representations do not imply string transformations.
  for (const format of ["binary", "byte", "int32", "int64", "float", "double", "password"])
    ajv.addFormat(format, true)
  const { documents, references } = validationDocuments(compilation, store)
  for (const [uri, document] of documents) ajv.addSchema(document, uri)
  const exports: { [key: string]: string } = Object.create(null)
  const bindings = new Map<string, ReadonlyMap<string, ValidatorBinding>>()
  let count = 0
  for (const operation of compilation.model.operations) {
    const operationBindings = new Map<string, ValidatorBinding>()
    for (const response of operation.responses) {
      for (const media of response.media) {
        const exportName = `check${count++}`
        const key = `urn:accord:${compilation.model.id}:${exportName}`
        const codec = media.representation.codec
        const binary = codec.kind === "bytes"
        let selectedReferences = references
        if (codec.kind === "form") {
          const binaries = new Set<SchemaId>()
          const view = compilation.graph.objectView(media.schema, "response")
          for (const [name, schemas] of view.fields) {
            const field = codec.fields[name]
            if (field?.codec.kind === "bytes")
              for (const schema of schemas)
                binaries.add(field.multiple ? compilation.graph.edge(schema, "items") : schema)
          }
          if (binaries.size) {
            const projected = validationDocuments(compilation, store, binaries, exportName)
            for (const [uri, document] of projected.documents) ajv.addSchema(document, uri)
            selectedReferences = projected.references
          }
        }
        let validator: JsonObject
        if (compilation.graph.impossible(media.schema)) validator = { not: {} }
        else if (binary) {
          const rules = {
            minLength: compilation.graph.annotation(media.schema, "minLength"),
            maxLength: compilation.graph.annotation(media.schema, "maxLength"),
          }
          validator = { type: "integer", minimum: rules["minLength"] ?? 0 }
          if (rules["maxLength"] !== undefined)
            validator = { ...validator, maximum: rules["maxLength"] }
        } else if (media.schema === compilation.graph.any) validator = {}
        else validator = { $ref: selectedReferences.get(media.schema)! }
        ajv.addSchema(validator, key)
        exports[exportName] = key
        operationBindings.set(media.representation.key, {
          exportName,
          binary,
          schema: media.schema,
        })
      }
    }
    bindings.set(operation.key, operationBindings)
  }
  const module = `accord-${compilation.model.id}.validators`
  const javascript = standalone(ajv, exports)
  const bundled = await build({
    stdin: {
      contents: javascript,
      resolveDir: dirname(require.resolve("ajv/package.json")),
      loader: "js",
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    logLevel: "silent",
  })
  const declaration = [
    'import type { ValidationFunction } from "@accord/client/validation"',
    ...Object.keys(exports).map((name) => `export declare const ${name}: ValidationFunction`),
    "",
  ].join("\n")
  return {
    module,
    bindings,
    files: { [`${module}.js`]: bundled.outputFiles[0]!.text, [`${module}.d.ts`]: declaration },
  }
}
