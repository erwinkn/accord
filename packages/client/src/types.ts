import type { StandardSchemaV1 } from "@standard-schema/spec"

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

export interface Representation {
  readonly key: string
  readonly codec: CodecPlan
}

/** The serializer consumes the same encoding record carried by the endpoint. */
export interface ParameterDescriptor extends StyleEncoding {
  readonly name: string
  readonly inputName?: string
  readonly in: ParameterLocation
  readonly required: boolean
  readonly representation?: Representation
}

export interface MediaPlan {
  readonly mediaType: string
  readonly representation: Representation
}

export interface RequestBodyDescriptor {
  readonly required: boolean
  readonly mode: BodyMode
  readonly fields: readonly string[]
  readonly content: readonly MediaPlan[]
  readonly defaultMediaType: string
}

export interface ResponseDescriptor {
  readonly status: StatusSelector
  readonly content: readonly MediaPlan[]
  readonly headers: readonly ParameterDescriptor[]
}

export interface Server {
  readonly url: string
  readonly variables: Readonly<
    Record<string, { readonly default: string; readonly enum?: readonly string[] }>
  >
}

export type SecurityRequirement = Readonly<Record<string, readonly string[]>>
export type SecurityScheme =
  | { readonly type: "apiKey"; readonly name: string; readonly in: "header" | "query" | "cookie" }
  | { readonly type: "http"; readonly scheme: string }
  | { readonly type: "oauth2" | "openIdConnect" | "mutualTLS" }

export interface EndpointPlan<K extends OperationKind = OperationKind> {
  readonly apiId: string
  readonly method: HttpMethod
  readonly path: string
  readonly operationId: string
  readonly operationKind: K
  readonly parameters: readonly ParameterDescriptor[]
  readonly requestBody?: RequestBodyDescriptor
  /** Status groups are ordered exact, range, default. Match the status before matching media. */
  readonly responses: readonly ResponseDescriptor[]
  readonly resultMode: "payload" | "status"
  readonly servers: readonly Server[]
  readonly security: readonly SecurityRequirement[]
  readonly securitySchemes: Readonly<Record<string, SecurityScheme>>
}

export interface EndpointContract {
  readonly args: readonly [input?: unknown, options?: RequestOptions]
  readonly input: unknown
  readonly response: unknown
  readonly error: unknown
  readonly responses: unknown
  readonly fullResponse: unknown
}

declare const endpointContract: unique symbol
export interface EndpointDefinition<
  C extends EndpointContract = EndpointContract,
  K extends OperationKind = OperationKind,
> {
  readonly kind: "endpoint"
  readonly plan: EndpointPlan<K>
  readonly validators?: Readonly<Record<string, StandardSchemaV1>>
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
  readonly baseUrl?: string
  readonly server?: number
  readonly serverVariables?: Readonly<Record<string, string>>
  readonly fetch?: typeof globalThis.fetch
  readonly headers?: HeadersInit | HeaderResolver
  readonly credentials?: Readonly<Record<string, Credential>>
  /** Public account/tenant identity for cache isolation. Never put credentials here. */
  readonly cacheScope?: string
  readonly requestMiddleware?: readonly RequestMiddleware[]
  readonly responseMiddleware?: readonly ResponseMiddleware[]
}
