import { renderQueryString, serializeQueryParameter } from "./serialize.js"
import type {
  CodecPlan,
  FormFieldPlan,
  ParameterValue,
  RequestObject,
  RequestValue,
  XmlNode,
} from "./types.js"

export function mediaType(value: string | null): string {
  return (value ?? "").split(";", 1)[0]!.trim().toLowerCase()
}

/** Shared by codegen and runtime: only schema-dependent decoding needs an explicit override. */
export function defaultCodec(type: string, direction: "request" | "response"): CodecPlan {
  const actual = mediaType(type)
  if (actual === "application/json" || actual.endsWith("+json")) return { kind: "json" }
  if (actual.startsWith("text/")) return { kind: "text" }
  return { kind: "bytes", value: direction === "request" ? "upload" : "ArrayBuffer" }
}

export function mediaMatches(pattern: string, actual: string): boolean {
  const expected = mediaType(pattern)
  const received = mediaType(actual)
  return (
    expected === received ||
    expected === "*/*" ||
    (expected.endsWith("/*") && received.startsWith(expected.slice(0, -1)))
  )
}

function isRecord(value: RequestValue): value is RequestObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  )
}

function fieldPlan(codec: Extract<CodecPlan, { kind: "form" }>, key: string): FormFieldPlan {
  const direct = codec.fields[key]
  if (direct) return direct
  for (const [pattern, plan] of Object.entries(codec.patterns)) {
    if (new RegExp(pattern, "u").test(key)) return plan
  }
  return codec.additional
}

export async function encodeBody(
  codec: CodecPlan,
  value: RequestValue,
  headers: Headers,
): Promise<BodyInit | undefined> {
  switch (codec.kind) {
    case "empty":
      return undefined
    case "json":
      return JSON.stringify(value)
    case "text":
      return String(value ?? "")
    case "bytes": {
      // SAFETY: generated request types restrict this codec to fetch-compatible binary values.
      return value as Blob | ArrayBuffer | Uint8Array<ArrayBuffer>
    }
    case "parameter":
      return String(value ?? "")
    case "raw-response":
      throw new TypeError("A raw response codec cannot encode a request")
    case "xml":
      return encodeXml(codec, value)
    case "form": {
      // SAFETY: the generated form contract requires an object; caller arguments are not revalidated.
      const fields = value as RequestObject
      if (codec.mediaType === "multipart/form-data") return encodeMultipart(codec, fields, headers)
      const pieces: string[] = []
      for (const [key, field] of Object.entries(fields)) {
        if (field === undefined) continue
        const plan = fieldPlan(codec, key)
        if (plan.codec.kind === "parameter") {
          // SAFETY: parameter-style form fields have the same value domain as OpenAPI parameters.
          pieces.push(
            renderQueryString(
              serializeQueryParameter(
                { ...plan.codec.encoding, name: key, in: "query", required: false },
                field as ParameterValue,
              ),
            ),
          )
        } else {
          const values = plan.multiple && Array.isArray(field) ? field : [field]
          for (const value of values) {
            const content = await encodeBody(plan.codec, value, new Headers())
            const text = content instanceof Blob ? await content.text() : String(content ?? "")
            pieces.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`)
          }
        }
      }
      return pieces.join("&")
    }
  }
}

async function encodeMultipart(
  codec: Extract<CodecPlan, { kind: "form" }>,
  fields: RequestObject,
  headers: Headers,
): Promise<Blob> {
  const boundary = `accord-${globalThis.crypto.randomUUID()}`
  const parts: BlobPart[] = []
  for (const [key, field] of Object.entries(fields)) {
    if (field === undefined) continue
    const plan = fieldPlan(codec, key)
    const values = plan.multiple && Array.isArray(field) ? field : [field]
    // Explicit form styles choose part names and delimiters just as query serialization does.
    // SAFETY: style-encoded fields use the parameter value domain in the generated contract.
    const entries =
      plan.codec.kind === "parameter"
        ? serializeQueryParameter(
            { ...plan.codec.encoding, name: key, in: "query", required: false },
            field as ParameterValue,
          ).map(([name, value]) => [name, value] as const)
        : values.map((value) => [key, value] as const)
    for (const [name, value] of entries) {
      const safeName = name.replace(/[\r\n]/g, "").replace(/"/g, "%22")
      let disposition = `Content-Disposition: form-data; name="${safeName}"`
      if (value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        const filename = value instanceof File ? value.name : "blob"
        disposition += `; filename="${filename.replace(/[\r\n]/g, "").replace(/"/g, "%22")}"`
      }
      const itemHeaders = new Headers(plan.headers)
      itemHeaders.set(
        "content-type",
        value instanceof Blob && value.type ? value.type : plan.mediaType,
      )
      const encoded = await encodeBody(plan.codec, value, itemHeaders)
      parts.push(`--${boundary}\r\n${disposition}\r\n`)
      for (const [name, item] of itemHeaders) parts.push(`${name}: ${item}\r\n`)
      parts.push("\r\n")
      if (encoded instanceof Blob || encoded instanceof ArrayBuffer) parts.push(encoded)
      else if (ArrayBuffer.isView(encoded)) {
        // SAFETY: copy into a new ArrayBuffer-backed view, including SharedArrayBuffer-backed inputs.
        parts.push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength).slice())
      } else parts.push(String(encoded ?? ""))
      parts.push("\r\n")
    }
  }
  parts.push(`--${boundary}--\r\n`)
  headers.set("content-type", `multipart/form-data; boundary=${boundary}`)
  return new Blob(parts)
}

export async function decodeBody(
  codec: CodecPlan,
  response: Response,
  method: string,
): Promise<RequestValue | Response> {
  if (codec.kind === "raw-response") return response
  if (
    method === "HEAD" ||
    response.status === 204 ||
    response.status === 205 ||
    response.status === 304 ||
    codec.kind === "empty"
  )
    return undefined
  switch (codec.kind) {
    case "json":
      return response.json()
    case "text": {
      const text = await response.text()
      if (codec.value === "number") return decodeNumber(text)
      if (codec.value === "boolean") return decodeBoolean(text)
      return text
    }
    case "bytes":
      return response.arrayBuffer()
    case "xml":
      return decodeXml(codec, await response.text())
    case "form":
      return decodeForm(codec, await response.formData())
    case "parameter":
      return response.text()
  }
}

function decodeNumber(value: RequestValue): number {
  const text = String(value).trim()
  if (
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) ||
    !Number.isFinite(Number(text))
  )
    throw new SyntaxError(`Invalid numeric value ${text}`)
  return Number(text)
}

function decodeBoolean(value: RequestValue): boolean {
  const text = String(value).trim()
  if (text === "true" || text === "1") return true
  if (text === "false" || text === "0") return false
  throw new SyntaxError(`Invalid boolean value ${text}`)
}

async function decodeForm(
  codec: Extract<CodecPlan, { kind: "form" }>,
  data: FormData,
): Promise<RequestObject> {
  const result: { [key: string]: RequestValue } = Object.create(null)
  const consumed = new Set<string>()
  const decode = async (plan: CodecPlan, value: FormDataEntryValue): Promise<RequestValue> => {
    const response = new Response(value, {
      headers: { "content-type": value instanceof Blob ? value.type : "text/plain" },
    })
    // SAFETY: field decoders cannot select raw-response; their values belong to the request/response value domain.
    return (await decodeBody(plan, response, "GET")) as RequestValue
  }
  for (const [key, plan] of Object.entries(codec.fields)) {
    const style = plan.codec.kind === "parameter" ? plan.codec.encoding : undefined
    const valuePlan = plan.styleValue
    if (!style || !valuePlan) continue
    const values = data.getAll(key)
    const delimiter =
      style.style === "spaceDelimited" ? " " : style.style === "pipeDelimited" ? "|" : ","
    if (valuePlan.kind === "object") {
      const fields: { [key: string]: RequestValue } = Object.create(null)
      if (style.style === "deepObject" || style.explode) {
        for (const [name, value] of data) {
          const child =
            style.style === "deepObject"
              ? name.startsWith(`${key}[`) && name.endsWith("]")
                ? name.slice(key.length + 1, -1)
                : undefined
              : Object.hasOwn(valuePlan.properties, name)
                ? name
                : undefined
          if (child === undefined) continue
          fields[child] = await decode(valuePlan.properties[child] ?? valuePlan.additional, value)
          consumed.add(name)
        }
      } else if (values.length) {
        const parts = String(values[0]).split(delimiter)
        for (let index = 0; index + 1 < parts.length; index += 2)
          fields[parts[index]!] = await decode(
            valuePlan.properties[parts[index]!] ?? valuePlan.additional,
            parts[index + 1]!,
          )
        consumed.add(key)
      }
      if (Object.keys(fields).length || values.length)
        result[key] = Object.fromEntries(Object.entries(fields))
    } else if (values.length) {
      consumed.add(key)
      if (valuePlan.kind === "array") {
        const entries = style.explode ? values : String(values[0]).split(delimiter)
        result[key] = await Promise.all(entries.map((value) => decode(valuePlan.items, value)))
      } else result[key] = await decode(valuePlan.codec, values[0]!)
    }
  }
  for (const key of new Set(data.keys())) {
    if (consumed.has(key)) continue
    const plan = fieldPlan(codec, key)
    const values = await Promise.all(data.getAll(key).map((value) => decode(plan.codec, value)))
    result[key] = plan.multiple || values.length > 1 ? values : values[0]
  }
  return Object.fromEntries(Object.entries(result))
}

export function fallbackCodec(type: string | null): CodecPlan {
  const actual = mediaType(type)
  if (!actual || actual.endsWith("xml")) return { kind: "text" }
  return defaultCodec(actual, "response")
}

function escapeXml(value: RequestValue): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function xmlName(node: XmlNode, fallback: string): string {
  const local = node.name ?? fallback
  return node.prefix ? `${node.prefix}:${local}` : local
}

function encodeXml(codec: Extract<CodecPlan, { kind: "xml" }>, value: RequestValue): string {
  const emit = (id: string, item: RequestValue, fallback: string): string => {
    const node = codec.nodes[id]!
    const name = xmlName(node, fallback)
    let attributes = node.namespace
      ? ` xmlns${node.prefix ? `:${node.prefix}` : ""}="${escapeXml(node.namespace)}"`
      : ""
    if (node.kind === "array" && Array.isArray(item) && node.items) {
      const children = item
        .map((entry) => emit(node.items!, entry, node.wrapped ? "item" : fallback))
        .join("")
      return node.wrapped ? `<${name}${attributes}>${children}</${name}>` : children
    }
    let content = ""
    if (node.kind === "object" && isRecord(item)) {
      for (const [key, field] of Object.entries(item)) {
        if (field === undefined) continue
        const child = node.properties?.[key] ?? node.additional
        if (!child) {
          content += `<${key}>${escapeXml(field)}</${key}>`
          continue
        }
        const childNode = codec.nodes[child]!
        if (childNode.attribute) attributes += ` ${xmlName(childNode, key)}="${escapeXml(field)}"`
        else content += emit(child, field, key)
      }
    } else content = escapeXml(item)
    return `<${name}${attributes}>${content}</${name}>`
  }
  return emit(codec.root, value, "root")
}

async function decodeXml(
  codec: Extract<CodecPlan, { kind: "xml" }>,
  text: string,
): Promise<RequestValue> {
  const { XMLParser, XMLValidator } = await import("fast-xml-parser")
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new SyntaxError("XML document type and entity declarations are unsupported")
  const valid = XMLValidator.validate(text)
  if (valid !== true) throw new SyntaxError(valid.err.msg)
  // Disable entity declarations and value coercion; declared XML nodes choose primitive decoding.
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: true,
    trimValues: false,
  })
  const parsed: RequestObject = parser.parse(text)
  const read = (id: string, value: RequestValue): RequestValue => {
    const node = codec.nodes[id]!
    if (node.kind === "number") return decodeNumber(value)
    if (node.kind === "boolean") return decodeBoolean(value)
    if (node.kind === "array" && node.items) {
      let values = value
      if (node.wrapped && isRecord(values))
        values = values[xmlName(codec.nodes[node.items]!, "item")]
      const entries =
        values === undefined || values === "" ? [] : Array.isArray(values) ? values : [values]
      return entries.map((entry) => read(node.items!, entry))
    }
    if (node.kind === "object") {
      const result: { [key: string]: RequestValue } = Object.create(null)
      if (isRecord(value)) {
        const consumed = new Set<string>()
        for (const [key, child] of Object.entries(node.properties ?? {})) {
          const childNode = codec.nodes[child]!
          const wire = `${childNode.attribute ? "@" : ""}${xmlName(childNode, key)}`
          consumed.add(wire)
          if (Object.hasOwn(value, wire)) result[key] = read(child, value[wire])
        }
        for (const [key, field] of Object.entries(value)) {
          if (!consumed.has(key) && !key.startsWith("@xmlns"))
            result[key] = node.additional ? read(node.additional, field) : field
        }
      }
      return Object.fromEntries(Object.entries(result))
    }
    return value
  }
  const root = codec.nodes[codec.root]!
  if (root.name && !Object.hasOwn(parsed, xmlName(root, "root")))
    throw new SyntaxError(`Expected XML root element ${xmlName(root, "root")}`)
  return read(
    codec.root,
    root.name
      ? parsed[xmlName(root, "root")]
      : Object.entries(parsed).find(([name]) => !name.startsWith("?"))?.[1],
  )
}
