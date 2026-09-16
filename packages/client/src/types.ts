import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { AuthProvider, TokenSource } from "./auth.js"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE"
export type BodyMode = "merge" | "separate"
export type OperationKind = "query" | "mutation"
export type ParameterLocation = "path" | "query" | "header" | "cookie"
export type ParameterStyle =
  | "simple"
  | "label"
  | "matrix"
  | "form"
  | "spaceDelimited"
  | "pipeDelimited"
  | "deepObject"
type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type Numeric<S extends string> = S extends `${infer N extends number}` ? N : never
export type StatusRange<H extends 1 | 2 | 3 | 4 | 5> = Numeric<`${H}${Digit}${Digit}`>
export type StatusSelector = `${1 | 2 | 3 | 4 | 5}XX` | "default" | number
export interface StyleEncoding {
  readonly style: ParameterStyle
  readonly explode: boolean
  readonly allowReserved: boolean
}

export interface XmlNode {
  readonly kind: "object" | "array" | "string" | "number" | "boolean" | "unknown"
  readonly name?: string
  readonly namespace?: string
  readonly prefix?: string
  readonly attribute?: boolean
  readonly wrapped?: boolean
  readonly properties?: Readonly<Record<string, string>>
  readonly items?: string
  readonly additional?: string
}

export type CodecPlan =
  | { readonly kind: "empty" }
  | { readonly kind: "json" }
  | { readonly kind: "text"; readonly value?: "number" | "boolean" }
  | { readonly kind: "bytes"; readonly value: "upload" | "ArrayBuffer" }
  | { readonly kind: "parameter"; readonly encoding: StyleEncoding }
  | {
      readonly kind: "form"
      readonly mediaType: "application/x-www-form-urlencoded" | "multipart/form-data"
      readonly fields: Readonly<Record<string, FormFieldPlan>>
      readonly additional: FormFieldPlan
      readonly patterns: Readonly<Record<string, FormFieldPlan>>
    }
  | {
      readonly kind: "xml"
      readonly root: string
      readonly nodes: Readonly<Record<string, XmlNode>>
    }
  | { readonly kind: "raw-response" }

/** Only response style decoding needs declared value kinds; request serializers dispatch on caller values. */
export type FormStyleValue =
  | { readonly kind: "primitive"; readonly codec: CodecPlan }
  | { readonly kind: "array"; readonly items: CodecPlan }
  | {
      readonly kind: "object"
      readonly properties: Readonly<Record<string, CodecPlan>>
      readonly additional: CodecPlan
    }

export interface FormFieldPlan {
  readonly styleValue?: FormStyleValue
  readonly mediaType: string
  readonly codec: CodecPlan
  readonly multiple: boolean
  readonly headers: Readonly<Record<string, string>>
}

/** Shared input lookup and optional content encoding; requiredness belongs to the TS contract. */
export interface ParameterBinding {
  readonly name: string
  readonly inputName?: string
  readonly codec?: CodecPlan
  readonly explode?: boolean
}
export interface PathParameter extends ParameterBinding {
  /** Default: simple. Explode defaults to false. */
  readonly style?: "simple" | "label" | "matrix"
}
export interface QueryParameter extends ParameterBinding {
  /** Default: form. Explode defaults to true for form, false otherwise. */
  readonly style?: "form" | "spaceDelimited" | "pipeDelimited" | "deepObject"
  readonly allowReserved?: boolean
}
/** Headers always use simple style; explode defaults to false. */
export type HeaderParameter = ParameterBinding
/** Cookies always use form style; explode defaults to true. */
export type CookieParameter = ParameterBinding

export interface MediaPlan {
  readonly mediaType: string
  /** Omitted when the media type and request/response direction determine the codec. */
  readonly codec?: CodecPlan
  /** Optional response validation, after decoding this media variant. */
  readonly schema?: StandardSchemaV1
}

export interface RequestBodyDescriptor {
  readonly required?: boolean
  /** Default: merge. */
  readonly mode?: BodyMode
  readonly fields?: readonly string[]
  readonly content: readonly MediaPlan[]
  /** Default: application/json when declared, otherwise the first content entry. */
  readonly defaultMediaType?: string
}

export interface ResponseDescriptor {
  readonly status: StatusSelector
  readonly content: readonly MediaPlan[]
}

export type SecurityRequirement = Readonly<Record<string, readonly string[]>>
export type SecurityScheme =
  | { readonly type: "apiKey"; readonly name: string; readonly in: "header" | "query" | "cookie" }
  | { readonly type: "http"; readonly scheme: string }
  | {
      readonly type: "oauth2"
      readonly clientCredentials?: { readonly tokenUrl: string; readonly scopes: readonly string[] }
    }
  | { readonly type: "openIdConnect" | "mutualTLS" }

export interface EndpointPlan<K extends OperationKind = OperationKind> {
  readonly method: HttpMethod
  readonly path: string
  readonly id: string
  readonly kind: K
  readonly pathParams?: readonly PathParameter[]
  readonly queryParams?: readonly QueryParameter[]
  readonly headerParams?: readonly HeaderParameter[]
  readonly cookieParams?: readonly CookieParameter[]
  readonly requestBody?: RequestBodyDescriptor
  /** Status groups are ordered exact, range, default. Match the status before matching media. */
  readonly responses: readonly ResponseDescriptor[]
  /** Default: payload. */
  readonly resultMode?: "payload" | "status"
  readonly security?: readonly SecurityRequirement[]
  readonly securitySchemes?: Readonly<Record<string, SecurityScheme>>
}

export interface EndpointContract {
  readonly args: readonly [input?: unknown, options?: RequestOptions]
  readonly input: unknown
  readonly response: unknown
  readonly error: unknown
  readonly responses: unknown
  readonly fullResponse: unknown
}

/** Internal factory brand; no string discriminator is needed in generated definitions. */
export const endpointMarker: unique symbol = Symbol.for("@accord/client/endpoint")
export const endpointScope: unique symbol = Symbol.for("@accord/client/scope")
declare const endpointContract: unique symbol
export interface EndpointDefinition<
  C extends EndpointContract = EndpointContract,
  K extends OperationKind = OperationKind,
> extends EndpointPlan<K> {
  readonly [endpointMarker]: true
  readonly [endpointScope]?: string
  readonly [endpointContract]?: C
}
export type EndpointDescriptor<
  C extends EndpointContract = EndpointContract,
  K extends OperationKind = OperationKind,
> = EndpointDefinition<C, K>
export type QueryEndpoint = EndpointDefinition<EndpointContract, "query">
export type MutationEndpoint = EndpointDefinition<EndpointContract, "mutation">
type ContractOf<E extends EndpointDefinition> = NonNullable<E[typeof endpointContract]>
export type InputOf<E extends EndpointDefinition> = ContractOf<E>["input"]
export type ResponseOf<E extends EndpointDefinition> = ContractOf<E>["response"]
export type ErrorOf<E extends EndpointDefinition> = ContractOf<E>["error"]
export type ResponsesOf<E extends EndpointDefinition> = ContractOf<E>["responses"]
export type FullResponseOf<E extends EndpointDefinition> = ContractOf<E>["fullResponse"]
export type ArgumentsOf<E extends EndpointDefinition> = ContractOf<E>["args"]
type DefaultInput<A extends readonly unknown[]> = A extends readonly unknown[]
  ? [input: A[0]] extends A
    ? A[0]
    : never
  : never
export type DefaultInputOf<E extends EndpointDefinition> = DefaultInput<ArgumentsOf<E>>
type KeysOf<T> = T extends unknown ? keyof T : never
type InvalidHeaderKeys<H> = {
  [K in keyof H]: K extends string
    ? Lowercase<K> extends "content-type"
      ? K extends "content-type"
        ? never
        : K
      : never
    : never
}[keyof H]
/** Headers stay inspectable so an opaque dictionary or alternate casing cannot bypass media/input correlation. */
export type CheckedArguments<E extends EndpointDefinition, A extends ArgumentsOf<E>> =
  Exclude<keyof (A[0] extends object ? A[0] : {}), KeysOf<InputOf<E>>> extends never
    ? [NonNullable<A[1]>] extends [never]
      ? A
      : NonNullable<A[1]> extends { readonly headers?: infer H }
        ? string extends keyof NonNullable<H>
          ? never
          : InvalidHeaderKeys<NonNullable<H>> extends never
            ? A
            : never
        : A
    : never
export type CheckedCall<E extends EndpointDefinition, A extends readonly unknown[]> =
  [...A] extends ArgumentsOf<E> ? CheckedArguments<E, [...A]> : never
export type EndpointFunction<E extends EndpointDefinition> = (<const A extends ArgumentsOf<E>>(
  ...args: A & CheckedArguments<E, NoInfer<A>>
) => Promise<ResponseOf<E>>) & {
  readonly withResponse: <const A extends ArgumentsOf<E>>(
    ...args: A & CheckedArguments<E, NoInfer<A>>
  ) => Promise<FullResponseOf<E>>
  readonly endpoint: E
  readonly context: ClientOptions
}

export type ClientFor<TApi> = TApi extends EndpointDefinition
  ? EndpointFunction<TApi>
  : {
      [K in keyof TApi]: ClientFor<TApi[K]>
    }

export interface RequestOptions {
  readonly signal?: AbortSignal
  readonly headers?: Readonly<Record<string, string>>
}
export interface HttpResult<Status extends number = number, Data = unknown> {
  readonly status: Status
  readonly data: Data
  readonly headers: Headers
  readonly mediaType: string | null
  /** Decoding may already have consumed this response's body. */
  readonly response: Response
}

export type MaybePromise<T> = T | Promise<T>
export type RequestPrimitive = string | number | boolean | bigint | null | undefined
export type RequestBinary =
  | Blob
  | FormData
  | URLSearchParams
  | ArrayBuffer
  | ArrayBufferView
  | ReadableStream<Uint8Array>
export type RequestValue =
  | RequestPrimitive
  | Date
  | RequestBinary
  | readonly RequestValue[]
  | RequestObject
export interface RequestObject {
  readonly [key: string]: RequestValue
}
export type ParameterPrimitive = string | number | boolean | bigint | null | Date
export type ParameterValue = ParameterPrimitive | readonly ParameterValue[] | ParameterObject
export interface ParameterObject {
  readonly [key: string]: ParameterValue | undefined
}
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject
export interface JsonObject {
  readonly [key: string]: JsonValue
}
export type ResponsePayload = JsonValue | ArrayBuffer | undefined
export type BinaryUpload = Blob | ArrayBuffer | Uint8Array

export interface HeaderResolverContext {
  readonly endpoint: EndpointDefinition
  readonly input: RequestObject
}
export type HeaderResolver = (
  context: HeaderResolverContext,
) => MaybePromise<HeadersInit | undefined>
export interface RequestMiddlewareContext extends HeaderResolverContext {
  readonly url: URL
  readonly init: RequestInit
}
export type RequestMiddleware = (
  context: RequestMiddlewareContext,
) => MaybePromise<RequestMiddlewareContext | void>
export interface ResponseMiddlewareContext extends RequestMiddlewareContext {
  readonly response: Response
}
export type ResponseMiddleware = (
  context: ResponseMiddlewareContext,
) => MaybePromise<Response | void>
export type Credential = string | { readonly username: string; readonly password: string }
export interface ClientOptions {
  /** Defaults to the browser origin, or http://localhost outside a browser. OpenAPI servers are not used. */
  readonly baseUrl?: string
  readonly fetch?: typeof globalThis.fetch
  readonly headers?: HeadersInit | HeaderResolver
  readonly credentials?: Readonly<Record<string, Credential>>
  /** Bearer shortcut for secured endpoints; callbacks run for each request. */
  readonly token?: TokenSource
  /** One provider, or providers keyed by OpenAPI security scheme name. */
  readonly auth?: AuthProvider | Readonly<Record<string, AuthProvider>>
  /** Public account/tenant identity for cache isolation. Never put credentials here. */
  readonly cacheScope?: string
  readonly requestMiddleware?: readonly RequestMiddleware[]
  readonly responseMiddleware?: readonly ResponseMiddleware[]
}
