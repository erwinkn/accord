import {
  type CodecPlan,
  type FormFieldPlan,
  type RequestBodyDescriptor,
  type RequestBodyVariant,
  type RequestEncoding,
  type RequestField,
  type RequestFormEncoding,
  requestMediaType,
} from "@accord/client"
import type { OperationModel } from "./model.js"

/** Lower request transport decisions without repeating default media types or empty metadata. */
export function requestBodyPlan(
  body: NonNullable<OperationModel["body"]>,
  defaultMediaType: string,
): RequestBodyDescriptor {
  const variants = [...body.media]
    .sort(
      (a, b) => Number(b.mediaType === defaultMediaType) - Number(a.mediaType === defaultMediaType),
    )
    .map((media): RequestBodyVariant => {
      const encoding = requestEncoding(media.codec)
      if (encoding.type === "parameter")
        throw new TypeError("A request body cannot use parameter encoding")
      let variant: RequestBodyVariant = encoding
      if (media.mediaType !== requestMediaType(encoding))
        variant = { ...variant, mediaType: media.mediaType }
      if (body.required) variant = { ...variant, required: true }
      if (body.mode === "separate") return { ...variant, mode: "separate" }
      if (variant.type === "multipart" || variant.type === "urlencoded") {
        // The same keys both extract the flat input and select each form field's encoding.
        const declared = variant.fields ?? {}
        const fields = Object.fromEntries(
          body.fields.map((name): [string, RequestField] => [
            name,
            Object.hasOwn(declared, name)
              ? declared[name]!
              : (variant.additional ?? { type: "binary" }),
          ]),
        )
        return Object.keys(fields).length ? { ...variant, fields } : variant
      }
      return body.fields.length ? { ...variant, fields: body.fields } : variant
    })
  return variants.length === 1 ? variants[0]! : variants
}

function requestEncoding(codec: CodecPlan): RequestEncoding {
  switch (codec.kind) {
    case "json":
      return { type: "json" }
    case "text":
      return { type: "text" }
    case "bytes":
      return { type: "binary" }
    case "xml":
      return { type: "xml", root: codec.root, nodes: codec.nodes }
    case "parameter": {
      const { style, explode, allowReserved } = codec.encoding
      let encoding: Extract<RequestEncoding, { type: "parameter" }> = { type: "parameter" }
      if (style !== "form") {
        // SAFETY: form field styles are compiled with the query-parameter style vocabulary.
        encoding = { ...encoding, style: style as NonNullable<typeof encoding.style> }
      }
      if (explode !== (style === "form")) encoding = { ...encoding, explode }
      if (allowReserved) encoding = { ...encoding, allowReserved: true }
      return encoding
    }
    case "form": {
      let encoding: RequestFormEncoding = {
        type: codec.mediaType === "multipart/form-data" ? "multipart" : "urlencoded",
      }
      const fields = Object.fromEntries(
        Object.entries(codec.fields).map(([name, field]) => [name, requestField(field)]),
      )
      const patterns = Object.fromEntries(
        Object.entries(codec.patterns).map(([pattern, field]) => [pattern, requestField(field)]),
      )
      const additional = requestField(codec.additional)
      if (Object.keys(fields).length) encoding = { ...encoding, fields }
      if (Object.keys(patterns).length) encoding = { ...encoding, patterns }
      if (JSON.stringify(additional) !== JSON.stringify({ type: "binary" }))
        encoding = { ...encoding, additional }
      return encoding
    }
    default:
      throw new TypeError(`Unsupported request encoding ${codec.kind}`)
  }
}
function requestField(field: FormFieldPlan): RequestField {
  const encoding = requestEncoding(field.codec)
  let result: RequestField = encoding.type === "text" ? {} : encoding
  if (field.mediaType !== requestMediaType(result))
    result = { ...result, mediaType: field.mediaType }
  if (field.multiple) result = { ...result, multiple: true }
  if (Object.keys(field.headers).length) result = { ...result, headers: field.headers }
  return result
}
