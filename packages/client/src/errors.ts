import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { EndpointDefinition } from "./types.js"

export interface HttpErrorOptions<TBody> {
  readonly response: Response
  readonly endpoint: EndpointDefinition
  readonly body: TBody | undefined
  readonly cause?: unknown
}

export class HttpError<TBody = unknown> extends Error {
  readonly status: number
  readonly statusText: string
  readonly headers: Headers
  readonly response: Response
  readonly endpoint: EndpointDefinition
  readonly body: TBody | undefined
  constructor(options: HttpErrorOptions<TBody>) {
    super(
      `HTTP ${options.response.status} ${options.response.statusText || "Error"} for ${options.endpoint.plan.method} ${options.endpoint.plan.path}`,
      { cause: options.cause },
    )
    this.name = "HttpError"
    this.status = options.response.status
    this.statusText = options.response.statusText
    this.headers = options.response.headers
    this.response = options.response
    this.endpoint = options.endpoint
    this.body = options.body
  }
}

export class DecodeError extends Error {
  constructor(
    readonly response: Response,
    readonly endpoint: EndpointDefinition,
    cause: unknown,
  ) {
    super(`Could not decode response for ${endpoint.plan.operationId}`, { cause })
    this.name = "DecodeError"
  }
}

export class ValidationError extends Error {
  constructor(
    readonly issues: readonly StandardSchemaV1.Issue[],
    readonly response: Response,
    readonly endpoint: EndpointDefinition,
  ) {
    super(
      `Invalid response for ${endpoint.plan.operationId}: ${issues.map((issue) => issue.message).join("; ")}`,
    )
    this.name = "ValidationError"
  }
}

export class NetworkError extends Error {
  constructor(
    readonly endpoint: EndpointDefinition,
    cause: unknown,
  ) {
    super(`Request failed for ${endpoint.plan.operationId}`, { cause })
    this.name = "NetworkError"
  }
}

export function isHttpError<TValue>(value: TValue): value is TValue & HttpError {
  return value instanceof HttpError
}
