import type { Compilation } from "./compile.js"
import type { DocumentStore } from "./loader.js"
import { object, pointerSegment } from "./loader.js"
import type { MediaModel, SchemaId } from "./model.js"
import { allocateIdentifiers, sanitizeTypeIdentifier } from "./naming.js"
import { isObject, isString } from "./object.js"
import type { JsonObject, JsonValue } from "./types.js"
import type { ValidationAdapter } from "./validation-adapter.js"

export interface ValidatorOutput {
  readonly adapter: ValidationAdapter
  readonly referenceSchemas: ReadonlyMap<string, SchemaId>
  readonly documents: readonly JsonObject[]
  readonly bindings: ReadonlyMap<MediaModel, boolean | JsonObject>
}

function validationTarget(compilation: Compilation, initial: SchemaId): SchemaId {
  let schema = initial
  const visited = new Set<SchemaId>()
  while (!visited.has(schema)) {
    visited.add(schema)
    const node = compilation.graph.get(schema)
    if (
      !node.reference ||
      !isObject(node.rules) ||
      Object.keys(node.rules).length !== 1 ||
      !isString(node.rules["$ref"])
    )
      return schema
    schema = node.reference
  }
  return schema
}

/** Place source schema trees under real JSON Schema keywords before handing them to a validation adapter.
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
  selectedSchemas: readonly SchemaId[],
  binarySchemas: ReadonlySet<SchemaId> = new Set(),
  context = "base",
): ValidatorDocuments {
  const graph = compilation.graph
  const nodes = [...graph.nodes.values()].filter((node) => node.id !== graph.any)
  const allRoots = nodes.filter(
    (node) =>
      !nodes.some(
        (parent) =>
          parent !== node &&
          parent.source.document === node.source.document &&
          node.source.pointer.startsWith(`${parent.source.pointer}/`),
      ),
  )
  // Keep whole lexical roots (including dynamic anchors), but only roots reachable from responses.
  const included = new Set<SchemaId>()
  const include = (id: SchemaId): void => {
    if (id === graph.any) return
    const node = graph.get(id)
    const root = allRoots.find(
      (root) =>
        root.source.document === node.source.document &&
        (root === node || node.source.pointer.startsWith(`${root.source.pointer}/`)),
    )!
    if (included.has(root.id)) return
    included.add(root.id)
    for (const child of nodes)
      if (
        child.source.document === root.source.document &&
        (child === root || child.source.pointer.startsWith(`${root.source.pointer}/`)) &&
        child.reference
      )
        include(child.reference)
  }
  for (const id of selectedSchemas) include(id)
  const roots = allRoots.filter((root) => included.has(root.id))
  const named = new Map([...graph.named].map(([name, id]) => [id, name]))
  const rootNames = allocateIdentifiers(
    roots.map((root) => {
      const operation = compilation.model.operations.find((operation) =>
        operation.responses.some((response) =>
          response.media.some((media) => media.schema === root.id),
        ),
      )
      const response = operation?.responses.find((response) =>
        response.media.some((media) => media.schema === root.id),
      )
      const file =
        new URL(root.source.document).pathname
          .split("/")
          .at(-1)
          ?.replace(/\.[^.]+$/, "") ?? "External"
      const core =
        named.get(root.id) ??
        (operation ? `${operation.exportPath.at(-1)}${response!.status}` : file)
      return {
        key: root.id,
        core: sanitizeTypeIdentifier(core),
        qualifiers: [
          { prefix: sanitizeTypeIdentifier(operation?.exportPath.slice(0, -1).join(" ") ?? file) },
        ],
      }
    }),
  )
  const references = new Map<SchemaId, string>()
  const containers = new Map<string, { uri: string; definitions: { [key: string]: JsonValue } }>()
  for (const root of roots) {
    let container = containers.get(root.source.document)
    if (!container) {
      container = {
        uri: `urn:accord:${context}:schemas${containers.size || ""}`,
        definitions: Object.create(null),
      }
      containers.set(root.source.document, container)
    }
    const key = rootNames.get(root.id)!
    container.definitions[key] = true
    for (const node of nodes) {
      if (
        node.source.document === root.source.document &&
        (node === root || node.source.pointer.startsWith(`${root.source.pointer}/`))
      ) {
        references.set(
          node.id,
          `${container.uri}#/$defs/${key}${node.source.pointer.slice(root.source.pointer.length).split("/").map(encodeURIComponent).join("/")}`,
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
          minByteLength: graph.annotation(node.id, "minLength") ?? 0,
          maxByteLength: graph.annotation(node.id, "maxLength") ?? Number.MAX_SAFE_INTEGER,
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
  adapter: ValidationAdapter,
): Promise<ValidatorOutput> {
  const selectedSchemas = compilation.model.operations.flatMap((operation) =>
    operation.responses.flatMap((response) =>
      response.media
        .filter((media) => media.codec.kind !== "bytes")
        .map((media) => validationTarget(compilation, media.schema)),
    ),
  )
  const { documents, references } = validationDocuments(compilation, store, selectedSchemas)
  const allDocuments = new Map(documents)
  const referenceSchemas = new Map([...references].map(([id, ref]) => [ref, id]))
  const bindings = new Map<MediaModel, boolean | JsonObject>()
  for (const operation of compilation.model.operations) {
    for (const response of operation.responses) {
      for (const media of response.media) {
        const codec = media.codec
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
            const context = encodeURIComponent(
              `${operation.key}:${response.status}:${media.mediaType}`,
            )
            const projected = validationDocuments(
              compilation,
              store,
              [validationTarget(compilation, media.schema)],
              binaries,
              context,
            )
            for (const [uri, document] of projected.documents) allDocuments.set(uri, document)
            selectedReferences = projected.references
            for (const [id, ref] of projected.references) referenceSchemas.set(ref, id)
          }
        }
        const schema = validationTarget(compilation, media.schema)
        let definition: boolean | JsonObject
        if (compilation.graph.impossible(schema)) definition = false
        else if (codec.kind === "bytes") {
          const minimum = compilation.graph.annotation(media.schema, "minLength")
          const maximum = compilation.graph.annotation(media.schema, "maxLength")
          let limits: JsonObject = {}
          if (minimum !== undefined) limits = { ...limits, minByteLength: minimum }
          if (maximum !== undefined) limits = { ...limits, maxByteLength: maximum }
          definition = { accordBinary: limits }
        } else if (schema === compilation.graph.any) definition = true
        else definition = { $ref: selectedReferences.get(schema)! }
        bindings.set(media, definition)
      }
    }
  }
  return { adapter, documents: [...allDocuments.values()], bindings, referenceSchemas }
}
