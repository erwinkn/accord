import type { CodegenDiagnostic } from "../diagnostics.js"
import { isDangerousInputName, sanitizeIdentifier } from "../naming.js"
import { isObject, resolveObjectReference } from "../object.js"
import type {
  BodyMode,
  JsonObject,
  NormalizedBodyEncoding,
  NormalizedParameter,
  NormalizedRequestBody,
} from "../types.js"

const REQUEST_BODY_SHAPES = new WeakMap<object, BodyShape>()

const MEDIA_TYPE_PRIORITY = [
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain",
] as const

interface BodyShape {
  readonly object: boolean
  readonly dynamic: boolean
  readonly fields: ReadonlySet<string>
}

export function normalizeRequestBody(
  document: JsonObject,
  rawValue: unknown,
  diagnostics: CodegenDiagnostic[],
  location: string,
): NormalizedRequestBody | undefined {
  if (rawValue === undefined) return undefined
  const requestBody = resolveObjectReference(document, rawValue, diagnostics, location)
  if (!requestBody) {
    if (!isObject(rawValue)) {
      diagnostics.push({
        code: "INVALID_REQUEST_BODY",
        message: "requestBody must be an object or an internal reference",
        location,
      })
    }
    return undefined
  }

  const content = requestBody["content"]
  if (!isObject(content) || Object.keys(content).length === 0) {
    diagnostics.push({
      code: "INVALID_REQUEST_BODY",
      message: "requestBody.content must contain at least one media type",
      location: `${location}/content`,
    })
    return undefined
  }

  const contentTypes = Object.keys(content).sort()
  const contentType = preferredContentType(contentTypes)
  const media = content[contentType]
  if (!isObject(media)) {
    diagnostics.push({
      code: "INVALID_REQUEST_BODY",
      message: `Media type ${contentType} must be an object`,
      location: `${location}/content/${pointerSegment(contentType)}`,
    })
    return undefined
  }

  const mediaLocation = `${location}/content/${pointerSegment(contentType)}`
  const shape = inspectBodyShape(
    document,
    media["schema"],
    diagnostics,
    `${mediaLocation}/schema`,
  )
  const encoding = normalizeBodyEncoding(
    media["encoding"],
    diagnostics,
    `${mediaLocation}/encoding`,
  )

  const normalized: NormalizedRequestBody = {
    required: requestBody["required"] === true,
    contentType,
    contentTypes,
    fields: [...shape.fields].sort(),
    ...(encoding !== undefined ? { encoding } : {}),
  }
  REQUEST_BODY_SHAPES.set(normalized, shape)
  return normalized
}

function preferredContentType(contentTypes: readonly string[]): string {
  for (const preferred of MEDIA_TYPE_PRIORITY) {
    const exact = contentTypes.find(contentType => contentType.toLowerCase() === preferred)
    if (exact) return exact
  }
  const json = contentTypes.find(contentType => contentType.toLowerCase().endsWith("+json"))
  return json ?? contentTypes[0] ?? "application/json"
}

function normalizeBodyEncoding(
  value: unknown,
  diagnostics: CodegenDiagnostic[],
  location: string,
): Readonly<Record<string, NormalizedBodyEncoding>> | undefined {
  if (value === undefined) return undefined
  if (!isObject(value)) {
    diagnostics.push({
      code: "INVALID_REQUEST_BODY",
      message: "encoding must be an object",
      location,
    })
    return undefined
  }

  const result: Record<string, NormalizedBodyEncoding> = Object.create(null) as Record<
    string,
    NormalizedBodyEncoding
  >
  for (const name of Object.keys(value).sort()) {
    const rawEncoding = value[name]
    if (!isObject(rawEncoding)) {
      diagnostics.push({
        code: "INVALID_REQUEST_BODY",
        message: "Encoding entry must be an object",
        location: `${location}/${pointerSegment(name)}`,
      })
      continue
    }
    const style = rawEncoding["style"]
    const normalizedStyle =
      style === "form" ||
      style === "spaceDelimited" ||
      style === "pipeDelimited" ||
      style === "deepObject"
        ? style
        : undefined
    if (style !== undefined && normalizedStyle === undefined) {
      diagnostics.push({
        code: "UNSUPPORTED_PARAMETER_STYLE",
        message: `Unsupported body encoding style ${String(style)}`,
        location: `${location}/${pointerSegment(name)}/style`,
      })
    }
    result[name] = {
      ...(typeof rawEncoding["contentType"] === "string"
        ? { contentType: rawEncoding["contentType"] }
        : {}),
      ...(normalizedStyle !== undefined ? { style: normalizedStyle } : {}),
      ...(typeof rawEncoding["explode"] === "boolean"
        ? { explode: rawEncoding["explode"] }
        : {}),
      ...(typeof rawEncoding["allowReserved"] === "boolean"
        ? { allowReserved: rawEncoding["allowReserved"] }
        : {}),
    }
  }
  return result
}

function inspectBodyShape(
  document: JsonObject,
  rawSchema: unknown,
  diagnostics: CodegenDiagnostic[],
  location: string,
  visited: ReadonlySet<string> = new Set(),
  depth = 0,
): BodyShape {
  if (depth > 128) {
    diagnostics.push({
      code: "MAXIMUM_DEPTH_EXCEEDED",
      message: "Request body schema composition exceeded 128 levels",
      location,
    })
    return { object: false, dynamic: true, fields: new Set() }
  }
  if (!isObject(rawSchema)) return { object: false, dynamic: true, fields: new Set() }

  const reference = rawSchema["$ref"]
  if (typeof reference === "string") {
    if (visited.has(reference)) {
      return { object: true, dynamic: false, fields: new Set() }
    }
    const nextVisited = new Set(visited)
    nextVisited.add(reference)
    const resolved = resolveObjectReference(document, rawSchema, diagnostics, location)
    return resolved
      ? inspectBodyShape(document, resolved, diagnostics, location, nextVisited, depth + 1)
      : { object: false, dynamic: true, fields: new Set() }
  }

  const compositions = ["allOf", "oneOf", "anyOf"] as const
  for (const keyword of compositions) {
    const branches = rawSchema[keyword]
    if (!Array.isArray(branches)) continue
    const shapes = branches.map((branch, index) =>
      inspectBodyShape(
        document,
        branch,
        diagnostics,
        `${location}/${keyword}/${index}`,
        visited,
        depth + 1,
      ),
    )
    return {
      object: shapes.every(shape => shape.object),
      dynamic: shapes.some(shape => shape.dynamic),
      fields: new Set(shapes.flatMap(shape => [...shape.fields])),
    }
  }

  const type = rawSchema["type"]
  const objectType =
    type === "object" ||
    (Array.isArray(type) && type.includes("object")) ||
    isObject(rawSchema["properties"])
  if (!objectType) return { object: false, dynamic: false, fields: new Set() }

  const properties = rawSchema["properties"]
  const fields = new Set(isObject(properties) ? Object.keys(properties) : [])
  const additionalProperties = rawSchema["additionalProperties"]
  const dynamic = additionalProperties === true || isObject(additionalProperties)
  return { object: true, dynamic, fields }
}

function requestBodyShape(requestBody: NormalizedRequestBody): BodyShape {
  return REQUEST_BODY_SHAPES.get(requestBody) ?? {
    object: requestBody.fields.length > 0,
    dynamic: false,
    fields: new Set(requestBody.fields),
  }
}

export function validateMergedBody(
  parameters: readonly NormalizedParameter[],
  requestBody: NormalizedRequestBody | undefined,
  bodyMode: BodyMode,
  diagnostics: CodegenDiagnostic[],
  location: string,
): void {
  if (!requestBody || bodyMode !== "merge") return
  const shape = requestBodyShape(requestBody)
  if (!shape.object) {
    diagnostics.push({
      code: "BODY_MERGE_REQUIRES_OBJECT",
      message: "Merged request bodies require a statically known top-level object schema",
      location: `${location}/requestBody`,
    })
    return
  }
  if (shape.dynamic) {
    diagnostics.push({
      code: "BODY_MERGE_DYNAMIC_PROPERTIES",
      message: "Merged request bodies cannot use dynamic additionalProperties; use separate body mode",
      location: `${location}/requestBody`,
    })
  }

  const parameterNames = new Map(parameters.map(parameter => [parameter.inputName, parameter]))
  for (const field of shape.fields) {
    if (isDangerousInputName(field)) {
      diagnostics.push({
        code: "DANGEROUS_INPUT_NAME",
        message: `Body property ${JSON.stringify(field)} is unsafe in merged input mode`,
        location: `${location}/requestBody`,
      })
    }
    const bodyInputName = sanitizeIdentifier(field)
    if (bodyInputName !== field) {
      diagnostics.push({
        code: "BODY_MERGE_REQUIRES_OBJECT",
        message:
          `Body property ${JSON.stringify(field)} is not a safe TypeScript input identifier in merged mode; ` +
          "use separate body mode",
        location: `${location}/requestBody`,
      })
    }
    const parameter = parameterNames.get(bodyInputName)
    if (parameter) {
      diagnostics.push({
        code: "INPUT_COLLISION",
        message:
          `Body property ${field} collides with flattened ${parameter.in} parameter ` +
          `${parameter.name}; use separate body mode`,
        location: `${location}/requestBody`,
      })
    }
  }
}

function pointerSegment(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1")
}
