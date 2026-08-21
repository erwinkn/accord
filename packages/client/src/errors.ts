import type { EndpointDescriptor } from "./types.js"

export interface HttpErrorOptions<TBody> {
  readonly response: Response
  readonly endpoint: EndpointDescriptor
  readonly body: TBody
}

export class HttpError<TBody = unknown> extends Error {
  readonly status: number
  readonly statusText: string
  readonly response: Response
  readonly endpoint: EndpointDescriptor
  readonly body: TBody

  constructor(options: HttpErrorOptions<TBody>) {
    super(
      `HTTP ${options.response.status} ${options.response.statusText || "Error"} for ${options.endpoint.method} ${options.endpoint.path}`,
    )
    this.name = "HttpError"
    this.status = options.response.status
    this.statusText = options.response.statusText
    this.response = options.response
    this.endpoint = options.endpoint
    this.body = options.body
  }
}

export function isHttpError(value: unknown): value is HttpError {
  return value instanceof HttpError
}
