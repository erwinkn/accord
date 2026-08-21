export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | (string & {})

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

export interface ParameterDescriptor {
  readonly name: string
  readonly inputName?: string
  readonly in: ParameterLocation
  readonly required: boolean
  readonly style: ParameterStyle
  readonly explode: boolean
  readonly allowReserved: boolean
}

export interface BodyEncodingDescriptor {
  readonly contentType?: string
  readonly style?: "form" | "spaceDelimited" | "pipeDelimited" | "deepObject"
  readonly explode?: boolean
  readonly allowReserved?: boolean
}

export interface RequestBodyDescriptor {
  readonly required: boolean
  readonly contentType: string
  readonly contentTypes: readonly string[]
  /** Known top-level body properties used to reconstruct merged request bodies. */
  readonly fields: readonly string[]
  readonly encoding?: Readonly<Record<string, BodyEncodingDescriptor>>
}

export interface ResponseDescriptor {
  readonly status: number | string
  readonly contentTypes: readonly string[]
}

export interface EndpointTypes {
  readonly path: unknown
  readonly query: unknown
  readonly headers: unknown
  readonly cookies: unknown
  readonly body: unknown
  readonly bodyRequired: boolean
  readonly response: unknown
  readonly error: unknown
  readonly responses: unknown
}

export interface EndpointDescriptor<
  TTypes extends EndpointTypes = EndpointTypes,
  TBodyMode extends BodyMode = BodyMode,
  TOperationKind extends OperationKind = OperationKind,
> {
  /** Optional marker. Runtimes must also accept structurally compatible descriptors. */
  readonly kind?: "endpoint"
  readonly method: HttpMethod
  readonly path: string
  readonly operationId?: string
  readonly operationKind: TOperationKind
  readonly bodyMode: TBodyMode
  readonly parameters: readonly ParameterDescriptor[]
  readonly requestBody?: RequestBodyDescriptor
  readonly responses: readonly ResponseDescriptor[]
  readonly __types?: TTypes
}

type TypesOf<E> =
  E extends EndpointDescriptor<infer TTypes, BodyMode, OperationKind> ? TTypes : never

type FieldOf<E, TKey extends keyof EndpointTypes> =
  TypesOf<E> extends infer TTypes ? (TTypes extends EndpointTypes ? TTypes[TKey] : never) : never

type ObjectGroup<T> = [T] extends [never] ? {} : T extends object ? T : {}
type Simplify<T> = T extends object ? { [TKey in keyof T]: T[TKey] } : T
type AbsentObject<T extends object> = { [TKey in keyof T]?: never }

type BodyInput<E extends EndpointDescriptor> = [FieldOf<E, "body">] extends [never]
  ? {}
  : E extends EndpointDescriptor<EndpointTypes, infer TBodyMode, OperationKind>
    ? TBodyMode extends "separate"
      ? FieldOf<E, "bodyRequired"> extends true
        ? { body: FieldOf<E, "body"> }
        : { body?: FieldOf<E, "body"> }
      : FieldOf<E, "body"> extends object
        ? FieldOf<E, "bodyRequired"> extends true
          ? FieldOf<E, "body">
          : FieldOf<E, "body"> | AbsentObject<FieldOf<E, "body">>
        : never
    : never

export type InputOf<E extends EndpointDescriptor> = Simplify<
  ObjectGroup<FieldOf<E, "path">> &
    ObjectGroup<FieldOf<E, "query">> &
    ObjectGroup<FieldOf<E, "headers">> &
    ObjectGroup<FieldOf<E, "cookies">> &
    BodyInput<E>
>

export type ResponseOf<E extends EndpointDescriptor> = FieldOf<E, "response">
export type ErrorOf<E extends EndpointDescriptor> = FieldOf<E, "error">
export type ResponsesOf<E extends EndpointDescriptor> = FieldOf<E, "responses">

export interface RequestOptions {
  readonly signal?: AbortSignal
  readonly headers?: HeadersInit
}

type RequestArguments<E extends EndpointDescriptor> =
  {} extends InputOf<E>
    ? [input?: InputOf<E>, options?: RequestOptions]
    : [input: InputOf<E>, options?: RequestOptions]

export type EndpointFunction<E extends EndpointDescriptor> = (
  ...args: RequestArguments<E>
) => Promise<ResponseOf<E>>

export type ClientFor<TApi> = TApi extends EndpointDescriptor
  ? EndpointFunction<TApi>
  : TApi extends object
    ? { [TKey in keyof TApi]: ClientFor<TApi[TKey]> }
    : never

export type QueryEndpoint = EndpointDescriptor<EndpointTypes, BodyMode, "query">
export type MutationEndpoint = EndpointDescriptor<EndpointTypes, BodyMode, "mutation">

export type MaybePromise<T> = T | Promise<T>

export interface HeaderResolverContext {
  readonly endpoint: EndpointDescriptor
  readonly input: Readonly<Record<string, unknown>>
}

export type HeaderResolver = (
  context: HeaderResolverContext,
) => MaybePromise<HeadersInit | undefined>

export interface RequestMiddlewareContext {
  readonly endpoint: EndpointDescriptor
  readonly input: Readonly<Record<string, unknown>>
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

export interface ClientOptions {
  readonly baseUrl?: string
  readonly fetch?: typeof globalThis.fetch
  readonly headers?: HeadersInit | HeaderResolver
  readonly requestMiddleware?: readonly RequestMiddleware[]
  readonly responseMiddleware?: readonly ResponseMiddleware[]
}
