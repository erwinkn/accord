import {
  defaultCodec,
  type EndpointPlan,
  type HttpMethod,
  type MediaPlan,
  type ParameterBinding,
  type PathParameter,
  type QueryParameter,
  type ResponseMap,
  type StatusSelector,
  selectResponse,
} from "@accord/client"
import { type DocumentStore, fail, list, object, string } from "./loader.js"
import type {
  ApiModel,
  Direction,
  LocatedValue,
  MediaModel,
  OperationModel,
  ParameterModel,
  ResponseModel,
} from "./model.js"
import {
  isDangerousInputName,
  operationName,
  operationNamespace,
  sanitizeIdentifier,
  sanitizeTypeIdentifier,
} from "./naming.js"
import { isObject, isString } from "./object.js"
import { requestBodyPlan } from "./request-plan.js"
import { SchemaGraph, styleEncoding } from "./schema.js"
import type { AccordCodegenConfig } from "./types.js"

export interface Compilation {
  readonly model: ApiModel
  readonly graph: SchemaGraph
}

const METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const

export function compileApi(store: DocumentStore, config: AccordCodegenConfig): Compilation {
  const graph = new SchemaGraph(store)
  const root = object(store.root.value)
  const components = object(root["components"])
  for (const name of Object.keys(object(components["schemas"])).sort())
    graph.named.set(name, graph.add(store.child(store.root, "components", "schemas", name)))
  const operations: OperationModel[] = []
  const operationIds = new Set<string>()
  const exportPaths: string[][] = []
  if (!isObject(root["paths"]))
    fail("INVALID_DOCUMENT", "Expected a paths object", store.root.source)
  for (const path of Object.keys(root["paths"]).sort()) {
    if (path.startsWith("x-")) continue
    const pathAt = store.dereference(store.child(store.root, "paths", path))
    if (!isObject(pathAt.value) || !path.startsWith("/"))
      fail("INVALID_PATH_ITEM", `Invalid path ${path}`, pathAt.source)
    const pathItem = pathAt.value
    const inherited = parameters(pathAt, "parameters", graph)
    for (const method of METHODS) {
      if (pathItem[method] === undefined) continue
      const at = store.child(pathAt, method)
      if (!isObject(at.value)) fail("INVALID_OPERATION", "Operation must be an object", at.source)
      const value = at.value
      const rawId = value["operationId"]
      if (rawId !== undefined && (!isString(rawId) || !rawId.trim()))
        fail("INVALID_OPERATION", "operationId must be a nonempty string", at.source)
      const id = string(rawId, `${method.toUpperCase()} ${path}`)
      if (operationIds.has(id))
        fail("DUPLICATE_OPERATION_ID", `Duplicate operationId ${id}`, at.source)
      operationIds.add(id)
      const merged = new Map(
        inherited.map((parameter) => [
          `${parameter.location}:${parameter.location === "header" ? parameter.name.toLowerCase() : parameter.name}`,
          parameter,
        ]),
      )
      for (const parameter of parameters(at, "parameters", graph))
        merged.set(
          `${parameter.location}:${parameter.location === "header" ? parameter.name.toLowerCase() : parameter.name}`,
          parameter,
        )
      const params = [...merged.values()]
      const inputs = new Set<string>()
      for (const parameter of params) {
        if (inputs.has(parameter.inputName))
          fail(
            "INPUT_COLLISION",
            `Multiple parameters use input ${parameter.inputName}`,
            parameter.source,
          )
        if (isDangerousInputName(parameter.name) || isDangerousInputName(parameter.inputName))
          fail("DANGEROUS_INPUT_NAME", `Unsafe input name ${parameter.inputName}`, parameter.source)
        inputs.add(parameter.inputName)
      }
      const tokens = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]!)
      for (const name of tokens)
        if (!params.some((parameter) => parameter.location === "path" && parameter.name === name))
          fail("INVALID_PARAMETER", `Missing declaration for path parameter ${name}`, at.source)
      for (const parameter of params)
        if (parameter.location === "path" && !tokens.includes(parameter.name))
          fail(
            "INVALID_PARAMETER",
            `Path parameter ${parameter.name} is not in the path`,
            parameter.source,
          )
      const name = operationName(value, method, path)
      const namespace = operationNamespace({
        strategy: config.namespace ?? "path",
        path,
        basePath: config.basePath ?? "",
        tags: list(value["tags"]),
      })
      const exportPath = [...namespace, name]
      for (const previous of exportPaths) {
        if (
          exportPath.slice(0, previous.length).join(".") === previous.join(".") ||
          previous.slice(0, exportPath.length).join(".") === exportPath.join(".")
        )
          fail(
            "NAME_COLLISION",
            `Endpoint namespace collision at ${exportPath.join(".")}`,
            at.source,
          )
      }
      exportPaths.push(exportPath)
      const typeName = sanitizeTypeIdentifier(exportPath.join(" "))
      const body = requestBody(at, params, graph, config, id, method, path)
      const responses = responseModels(at, graph).map((response) =>
        method === "head" ? { ...response, media: [] } : response,
      )
      const responsePlans: ResponseMap = Object.fromEntries(
        responses.map((response) => {
          const status = statusSelector(response.status, at)
          const variants = response.media.map((media) => mediaPlan(media, "response"))
          return [status, variants.length > 1 ? variants : (variants[0] ?? {})]
        }),
      )
      const successful = Array.from({ length: 100 }, (_, index) => index + 200).filter((status) =>
        selectResponse(responsePlans, status),
      )
      const override =
        config.operationKinds?.[id] ??
        config.operationKinds?.[`${method.toUpperCase()} ${path}`] ??
        value["x-sdk-kind"] ??
        value["x-operation-kind"] ??
        value["x-sdk-operation-kind"]
      if (override !== undefined && override !== "query" && override !== "mutation")
        fail("INVALID_EXTENSION", "Invalid operation kind", at.source)
      const operationKind =
        override ?? (method === "get" || method === "head" ? "query" : "mutation")
      let plan: EndpointPlan = {
        // SAFETY: method comes from the exhaustive HTTP method list.
        method: method.toUpperCase() as HttpMethod,
        path,
        id,
        kind: operationKind,
        ...parameterGroups(params),
        responses: responsePlans,
      }
      if (successful.length > 1) plan = { ...plan, resultMode: "status" }
      if (body) {
        const preferred =
          config.defaultMediaTypes?.[id] ??
          config.defaultMediaTypes?.[`${method.toUpperCase()} ${path}`]
        const defaultMediaType =
          preferred ??
          body.media.find((media) => media.mediaType === "application/json")?.mediaType ??
          body.media[0]!.mediaType
        if (!body.media.some((media) => media.mediaType === defaultMediaType))
          fail("INVALID_EXTENSION", `Unknown default media type ${defaultMediaType}`, at.source)
        plan = { ...plan, requestBody: requestBodyPlan(body, defaultMediaType) }
      }
      let operation: OperationModel = {
        key: id,
        typeName,
        exportPath,
        deprecated: value["deprecated"] === true,
        parameters: params,
        responses,
        plan,
        source: at.source,
      }
      if (body) operation = { ...operation, body }
      const description = value["description"] ?? value["summary"]
      if (isString(description)) operation = { ...operation, description }
      operations.push(operation)
    }
  }
  graph.assertProductiveReferences()
  const resolved = operations.map((operation) => ({
    ...operation,
    plan: operation.plan,
  }))
  return {
    graph,
    model: {
      prefix: config.prefix ?? (string(object(root["info"])["title"]).trim() || "api"),
      version: store.version,
      schemas: graph.nodes,
      resources: store.resources,
      namedSchemas: graph.named,
      operations: resolved,
    },
  }
}

function parameters(at: LocatedValue, keyword: string, graph: SchemaGraph): ParameterModel[] {
  const raw = object(at.value)[keyword]
  if (raw !== undefined && !Array.isArray(raw))
    fail("INVALID_PARAMETER", "parameters must be an array", at.source)
  const result: ParameterModel[] = []
  const seen = new Set<string>()
  for (const [index] of list(raw).entries()) {
    const parameter = graph.store.dereference(graph.store.child(at, keyword, String(index)))
    const value = object(parameter.value)
    const name = string(value["name"])
    const location = value["in"]
    if (
      !name ||
      (location !== "path" &&
        location !== "query" &&
        location !== "header" &&
        location !== "cookie")
    )
      fail("INVALID_PARAMETER", "Parameter needs a name and valid location", parameter.source)
    if (location === "path" && value["required"] !== true)
      fail("INVALID_PARAMETER", "Path parameters must be required", parameter.source)
    if (
      location === "header" &&
      ["accept", "content-type", "authorization"].includes(name.toLowerCase())
    )
      continue
    const key = `${location}:${location === "header" ? name.toLowerCase() : name}`
    if (seen.has(key)) fail("INVALID_PARAMETER", `Duplicate parameter ${key}`, parameter.source)
    seen.add(key)
    const content = Object.keys(object(value["content"]))
    if (value["schema"] !== undefined && content.length)
      fail("INVALID_PARAMETER", "A parameter cannot have both schema and content", parameter.source)
    if (content.length > 1)
      fail("INVALID_PARAMETER", "Parameter content must have one media type", parameter.source)
    const schema = content.length
      ? mediaModels(parameter, graph, "request")[0]!.schema
      : value["schema"] !== undefined
        ? graph.add(graph.store.child(parameter, "schema"))
        : graph.any
    const codec = content.length
      ? graph.codec(schema, "request", content[0]!)
      : { kind: "parameter" as const, encoding: styleEncoding(value, location) }
    result.push({
      name,
      inputName: sanitizeIdentifier(name),
      location,
      required: value["required"] === true,
      schema,
      codec,
      source: parameter.source,
    })
  }
  return result
}

function parameterBinding(parameter: ParameterModel): ParameterBinding {
  const codec = parameter.codec
  const encoding = codec.kind === "parameter" ? codec.encoding : undefined
  const defaultExplode = encoding
    ? encoding.style === "form"
    : parameter.location === "query" || parameter.location === "cookie"
  const explode = encoding?.explode ?? false
  let binding: ParameterBinding = { name: parameter.name }
  if (parameter.inputName !== parameter.name)
    binding = { ...binding, inputName: parameter.inputName }
  if (codec.kind !== "parameter") binding = { ...binding, codec }
  if (explode !== defaultExplode) binding = { ...binding, explode }
  return binding
}

function pathParameter(parameter: ParameterModel): PathParameter {
  const style = parameter.codec.kind === "parameter" ? parameter.codec.encoding.style : "simple"
  if (style !== "simple" && style !== "label" && style !== "matrix")
    fail("INVALID_PARAMETER", `Invalid path style ${style}`, parameter.source)
  return style === "simple"
    ? parameterBinding(parameter)
    : { ...parameterBinding(parameter), style }
}

function queryParameter(parameter: ParameterModel): QueryParameter {
  const encoding = parameter.codec.kind === "parameter" ? parameter.codec.encoding : undefined
  const style = encoding?.style ?? "form"
  if (
    style !== "form" &&
    style !== "spaceDelimited" &&
    style !== "pipeDelimited" &&
    style !== "deepObject"
  )
    fail("INVALID_PARAMETER", `Invalid query style ${style}`, parameter.source)
  let binding: QueryParameter = parameterBinding(parameter)
  if (style !== "form") binding = { ...binding, style }
  if (encoding?.allowReserved) binding = { ...binding, allowReserved: true }
  return binding
}

function parameterGroups(
  parameters: readonly ParameterModel[],
): Pick<EndpointPlan, "pathParams" | "queryParams" | "headerParams" | "cookieParams"> {
  const pathParams = parameters.filter((item) => item.location === "path").map(pathParameter)
  const queryParams = parameters.filter((item) => item.location === "query").map(queryParameter)
  const headerParams = parameters.filter((item) => item.location === "header").map(parameterBinding)
  const cookieParams = parameters.filter((item) => item.location === "cookie").map(parameterBinding)
  let groups: Pick<EndpointPlan, "pathParams" | "queryParams" | "headerParams" | "cookieParams"> =
    {}
  if (pathParams.length) groups = { ...groups, pathParams }
  if (queryParams.length) groups = { ...groups, queryParams }
  if (headerParams.length) groups = { ...groups, headerParams }
  if (cookieParams.length) groups = { ...groups, cookieParams }
  return groups
}

function mediaModels(
  at: LocatedValue,
  graph: SchemaGraph,
  direction: "request" | "response",
): MediaModel[] {
  const content = object(object(at.value)["content"])
  return Object.keys(content)
    .sort()
    .map((mediaType) => {
      const mediaAt = graph.store.child(at, "content", mediaType)
      const media = object(mediaAt.value)
      const schema =
        media["schema"] === undefined ? graph.any : graph.add(graph.store.child(mediaAt, "schema"))
      const codec = graph.codec(schema, direction, mediaType, object(media["encoding"]))
      return { mediaType, schema, codec }
    })
}

function mediaPlan(media: MediaModel, direction: Direction): MediaPlan {
  const { mediaType, codec } = media
  return JSON.stringify(codec) === JSON.stringify(defaultCodec(mediaType, direction))
    ? { mediaType }
    : { mediaType, codec }
}

function requestBody(
  at: LocatedValue,
  params: readonly ParameterModel[],
  graph: SchemaGraph,
  config: AccordCodegenConfig,
  id: string,
  method: string,
  path: string,
): OperationModel["body"] {
  if (object(at.value)["requestBody"] === undefined) return undefined
  const bodyAt = graph.store.dereference(graph.store.child(at, "requestBody"))
  const body = object(bodyAt.value)
  const media = mediaModels(bodyAt, graph, "request")
  if (!media.length)
    fail("INVALID_REQUEST_BODY", "Request body needs at least one media type", bodyAt.source)
  const views = media.map((item) => graph.objectView(item.schema, "request"))
  const fields = [
    ...new Set(views.flatMap((view) => [...view.fields.keys(), ...view.required])),
  ].sort()
  const collision = fields.some((field) =>
    params.some((parameter) => parameter.inputName === field),
  )
  const canMerge =
    body["required"] === true &&
    views.every((view) => view.object && view.closed && view.patterns.size === 0) &&
    !collision &&
    !fields.some(isDangerousInputName)
  const override =
    config.body?.overrides?.[id] ??
    config.body?.overrides?.[`${method.toUpperCase()} ${path}`] ??
    object(at.value)["x-sdk-body-mode"] ??
    object(at.value)["x-body-mode"] ??
    config.body?.mode
  if (override !== undefined && override !== "merge" && override !== "separate")
    fail("INVALID_EXTENSION", "Invalid body mode", at.source)
  if (override === "merge" && !canMerge) {
    const code = collision
      ? "INPUT_COLLISION"
      : views.some((view) => !view.object)
        ? "BODY_MERGE_REQUIRES_OBJECT"
        : "BODY_MERGE_DYNAMIC_PROPERTIES"
    fail(
      code,
      "Explicit merge would lose body information; use separate or automatic mode",
      bodyAt.source,
    )
  }
  const mode = override ?? (canMerge ? "merge" : "separate")
  if (mode === "separate" && params.some((parameter) => parameter.inputName === "body"))
    fail(
      "INPUT_COLLISION",
      "The body escape hatch conflicts with a parameter named body",
      bodyAt.source,
    )
  return { required: body["required"] === true, mode, media, fields }
}

function responseModels(at: LocatedValue, graph: SchemaGraph): ResponseModel[] {
  const raw = object(at.value)["responses"]
  if (!isObject(raw) || !Object.keys(raw).length)
    fail("INVALID_RESPONSE", "An operation needs responses", at.source)
  const responses: ResponseModel[] = []
  for (const status of Object.keys(raw).sort()) {
    if (status.startsWith("x-")) continue
    statusSelector(status, at)
    const response = graph.store.dereference(graph.store.child(at, "responses", status))
    if (!isObject(response.value))
      fail("INVALID_RESPONSE", "Response must be an object", response.source)
    const headers: ParameterModel[] = []
    for (const name of Object.keys(object(response.value["headers"]))) {
      const header = graph.store.dereference(graph.store.child(response, "headers", name))
      const value = object(header.value)
      const schema =
        value["schema"] === undefined ? graph.any : graph.add(graph.store.child(header, "schema"))
      headers.push({
        name,
        inputName: name,
        location: "header",
        required: value["required"] === true,
        schema,
        codec: { kind: "parameter", encoding: styleEncoding(value, "header") },
        source: header.source,
      })
    }
    responses.push({
      status,
      media: ["204", "205", "304"].includes(status) ? [] : mediaModels(response, graph, "response"),
      headers,
    })
  }
  return responses
}

function statusSelector(status: string, at: LocatedValue): StatusSelector {
  if (status === "default") return status
  if (/^[1-5]XX$/.test(status)) {
    // SAFETY: the status range grammar is validated above.
    return status as `${1 | 2 | 3 | 4 | 5}XX`
  }
  if (/^[1-5][0-9][0-9]$/.test(status)) return Number(status)
  fail("INVALID_RESPONSE", `Invalid response status ${status}`, at.source)
}
