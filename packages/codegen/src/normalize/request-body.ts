import type { CodegenDiagnostic } from "../diagnostics.js"
import { isDangerousInputName, sanitizeIdentifier } from "../naming.js"
import { isBoolean, isObject, isString, resolveObjectReference } from "../object.js"
import type {
  BodyMode,
  JsonObject,
  JsonValue,
  NormalizedBodyEncoding,
  NormalizedParameter,
  NormalizedRequestBody,
} from "../types.js"

const REQUEST_BODY_PROFILES = new WeakMap<NormalizedRequestBody, BodySchemaProfile>()

const MEDIA_TYPE_PRIORITY = [
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain",
] as const

interface BodySchemaProfile {
  readonly object: boolean
  readonly dynamic: boolean
  readonly fields: ReadonlySet<string>
}

interface RequestBodyBuilder {
  required: boolean
  contentType: string
  contentTypes: readonly string[]
  fields: readonly string[]
  encoding?: Readonly<Record<string, NormalizedBodyEncoding>>
}

interface BodyEncodingBuilder {
  contentType?: string
  style?: "form" | "spaceDelimited" | "pipeDelimited" | "deepObject"
  explode?: boolean
  allowReserved?: boolean
}

export function normalizeRequestBody(
  document: JsonObject,
  rawValue: JsonValue | undefined,
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
  const profile = inspectBodySchema(
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

  const normalized: RequestBodyBuilder = {
    required: requestBody["required"] === true,
    contentType,
    contentTypes,
    fields: [...profile.fields].sort(),
  }
  if (encoding !== undefined) normalized.encoding = encoding
  REQUEST_BODY_PROFILES.set(normalized, profile)
  return normalized
}

function preferredContentType(contentTypes: readonly string[]): string {
  for (const preferred of MEDIA_TYPE_PRIORITY) {
    const exact = contentTypes.find((contentType) => contentType.toLowerCase() === preferred)
    if (exact) return exact
  }
  const json = contentTypes.find((contentType) => contentType.toLowerCase().endsWith("+json"))
  return json ?? contentTypes[0] ?? "application/json"
}

function normalizeBodyEncoding(
  value: JsonValue | undefined,
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

  const result: Record<string, NormalizedBodyEncoding> = Object.create(null)
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

    const entry: BodyEncodingBuilder = {}
    const rawContentType = rawEncoding["contentType"]
    const rawExplode = rawEncoding["explode"]
    const rawAllowReserved = rawEncoding["allowReserved"]
    if (isString(rawContentType)) entry.contentType = rawContentType
    if (normalizedStyle !== undefined) entry.style = normalizedStyle
    if (isBoolean(rawExplode)) entry.explode = rawExplode
    if (isBoolean(rawAllowReserved)) entry.allowReserved = rawAllowReserved
    result[name] = entry
  }
  return result
}

function inspectBodySchema(
  document: JsonObject,
  rawSchema: JsonValue | undefined,
  diagnostics: CodegenDiagnostic[],
  location: string,
  visited: ReadonlySet<string> = new Set(),
  depth = 0,
): BodySchemaProfile {
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
  if (isString(reference)) {
    if (visited.has(reference)) {
      return { object: true, dynamic: false, fields: new Set() }
    }
    const nextVisited = new Set(visited)
    nextVisited.add(reference)
    const resolved = resolveObjectReference(document, rawSchema, diagnostics, location)
    return resolved
      ? inspectBodySchema(document, resolved, diagnostics, location, nextVisited, depth + 1)
      : { object: false, dynamic: true, fields: new Set() }
  }

  const compositions = ["allOf", "oneOf", "anyOf"] as const
  for (const keyword of compositions) {
    const branches = rawSchema[keyword]
    if (!Array.isArray(branches)) continue
    const profiles = branches.map((branch, index) =>
      inspectBodySchema(
        document,
        branch,
        diagnostics,
        `${location}/${keyword}/${index}`,
        visited,
        depth + 1,
      ),
    )
    return {
      object: profiles.every((profile) => profile.object),
      dynamic: profiles.some((profile) => profile.dynamic),
      fields: new Set(profiles.flatMap((profile) => [...profile.fields])),
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

function requestBodyProfile(requestBody: NormalizedRequestBody): BodySchemaProfile {
  return (
    REQUEST_BODY_PROFILES.get(requestBody) ?? {
      object: requestBody.fields.length > 0,
      dynamic: false,
      fields: new Set(requestBody.fields),
    }
  )
}

export function validateMergedBody(
  parameters: readonly NormalizedParameter[],
  requestBody: NormalizedRequestBody | undefined,
  bodyMode: BodyMode,
  diagnostics: CodegenDiagnostic[],
  location: string,
): void {
  if (!requestBody || bodyMode !== "merge") return
  const profile = requestBodyProfile(requestBody)
  if (!profile.object) {
    diagnostics.push({
      code: "BODY_MERGE_REQUIRES_OBJECT",
      message: "Merged request bodies require a statically known top-level object schema",
      location: `${location}/requestBody`,
    })
    return
  }
  if (profile.dynamic) {
    diagnostics.push({
      code: "BODY_MERGE_DYNAMIC_PROPERTIES",
      message:
        "Merged request bodies cannot use dynamic additionalProperties; use separate body mode",
      location: `${location}/requestBody`,
    })
  }

  const parameterNames = new Map(parameters.map((parameter) => [parameter.inputName, parameter]))
  for (const field of profile.fields) {
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
