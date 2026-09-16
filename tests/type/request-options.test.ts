import type { RequestOptions, RequestOptionsFor } from "@accord/client"

declare function defaultJson(options: RequestOptionsFor<"application/json">): RequestOptions
declare function selectCsv(options: RequestOptionsFor<"text/csv", true>): RequestOptions

defaultJson({})
defaultJson({ auth: false, signal: new AbortController().signal, headers: { "x-request-id": "1" } })
defaultJson({ headers: { "content-type": "application/json; charset=utf-8" } })
selectCsv({ headers: { "content-type": "text/csv", accept: "application/json" } })
selectCsv({ headers: { "content-type": "text/csv; charset=utf-8" }, auth: false })

// @ts-expect-error A supplied content type must match the selected representation.
defaultJson({ headers: { "content-type": "text/csv" } })
// @ts-expect-error An alternative representation requires a selector.
selectCsv({})
// @ts-expect-error Supplying unrelated headers does not select the alternative representation.
selectCsv({ headers: { accept: "text/csv" } })
// @ts-expect-error Media parameters cannot change the underlying media type.
selectCsv({ headers: { "content-type": "text/plain; charset=utf-8" } })
// @ts-expect-error Other header values remain strings.
defaultJson({ headers: { "x-count": 3 } })
// @ts-expect-error Optional fields retain exact optional property semantics.
defaultJson({ headers: { "content-type": undefined } })
