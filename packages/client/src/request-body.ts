import type {
  CodecPlan,
  FormFieldPlan,
  RequestBodyDescriptor,
  RequestBodyVariant,
  RequestEncoding,
  RequestField,
} from "./types.js"

function isBodyList(body: RequestBodyDescriptor): body is readonly RequestBodyVariant[] {
  return Array.isArray(body)
}
export function requestBodyVariants(body: RequestBodyDescriptor): readonly RequestBodyVariant[] {
  return isBodyList(body) ? body : [body]
}

/** Media selection and emission use the same defaults, including nested form parts. */
export function requestMediaType(encoding: {
  readonly type: RequestEncoding["type"]
  readonly mediaType?: string
}): string {
  if (encoding.mediaType !== undefined) return encoding.mediaType
  switch (encoding.type) {
    case "json":
      return "application/json"
    case "binary":
      return "application/octet-stream"
    case "xml":
      return "application/xml"
    case "multipart":
      return "multipart/form-data"
    case "urlencoded":
      return "application/x-www-form-urlencoded"
    default:
      return "text/plain"
  }
}
export function defaultRequestMediaType(body: RequestBodyDescriptor): string {
  const first = requestBodyVariants(body)[0]
  if (!first) throw new TypeError("Request body must declare an encoding")
  return requestMediaType(first)
}

export function requestBodyFields(body: RequestBodyVariant): readonly string[] {
  if (body.type === "multipart" || body.type === "urlencoded") return Object.keys(body.fields ?? {})
  return body.fields ?? []
}

/** Expand only transport defaults; source schemas and request values are never interpreted here. */
export function requestCodec(encoding: RequestEncoding): CodecPlan {
  switch (encoding.type) {
    case "json":
      return { kind: "json" }
    case "binary":
      return { kind: "bytes", value: "upload" }
    case "xml":
      return { kind: "xml", root: encoding.root, nodes: encoding.nodes }
    case "parameter": {
      const style = encoding.style ?? "form"
      return {
        kind: "parameter",
        encoding: {
          style,
          explode: encoding.explode ?? style === "form",
          allowReserved: encoding.allowReserved ?? false,
        },
      }
    }
    case "multipart":
    case "urlencoded":
      return {
        kind: "form",
        mediaType:
          encoding.type === "multipart"
            ? "multipart/form-data"
            : "application/x-www-form-urlencoded",
        fields: Object.fromEntries(
          Object.entries(encoding.fields ?? {}).map(([name, field]) => [name, expandField(field)]),
        ),
        patterns: Object.fromEntries(
          Object.entries(encoding.patterns ?? {}).map(([pattern, field]) => [
            pattern,
            expandField(field),
          ]),
        ),
        additional: expandField(encoding.additional ?? { type: "binary" }),
      }
    default:
      return { kind: "text" }
  }
}
function expandField(field: RequestField): FormFieldPlan {
  return {
    mediaType: requestMediaType(field),
    codec: requestCodec(field),
    multiple: field.multiple ?? false,
    headers: field.headers ?? {},
  }
}
