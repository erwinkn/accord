import { defaultRequestMediaType, responseVariants, selectResponseStatus } from "@accord/client"
import ts from "typescript"
import type { Compilation } from "./compile.js"
import { AccordCodegenError } from "./diagnostics.js"
import type { MediaModel, OperationModel, ResponseModel } from "./model.js"
import { allocateIdentifiers, type IdentifierRequest, sanitizeTypeIdentifier } from "./naming.js"
import { formatSource, generatedHeader, renderModules, typeHelpers } from "./render-modules.js"
import {
  alias,
  intersection,
  literal,
  printNode,
  property,
  TypeEmitter,
  typeLiteral,
  typeReference,
  undefinedType,
  union,
} from "./type-emitter.js"
import type { ValidationSchemaExport, ValidationSource } from "./validation-adapter.js"
import type { ValidatorOutput } from "./validators.js"

const f = ts.factory
const stringType = () => f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)

function responseCodes(operation: OperationModel, response: ResponseModel): number[] {
  return Array.from({ length: 500 }, (_, index) => index + 100).filter(
    (code) => String(selectResponseStatus(operation.plan.responses, code)) === response.status,
  )
}

function statusType(codes: readonly number[]): ts.TypeNode {
  const types: ts.TypeNode[] = []
  for (const hundred of [1, 2, 3, 4, 5]) {
    const members = codes.filter((code) => Math.floor(code / 100) === hundred)
    if (members.length > 50) {
      const omitted = Array.from({ length: 100 }, (_, index) => hundred * 100 + index).filter(
        (code) => !members.includes(code),
      )
      const range = typeReference("StatusRange", [literal(hundred)])
      types.push(
        omitted.length ? typeReference("Exclude", [range, union(omitted.map(literal))]) : range,
      )
    } else types.push(...members.map(literal))
  }
  return union(types)
}

function optionsType(media: MediaModel, isDefault: boolean): ts.TypeNode {
  return typeReference(
    "RequestOptionsFor",
    isDefault ? [literal(media.mediaType)] : [literal(media.mediaType), literal(true)],
  )
}

function inputType(
  operation: OperationModel,
  emitter: TypeEmitter,
  media?: MediaModel,
): ts.TypeNode {
  const params = operation.parameters.map((parameter) =>
    property(
      parameter.inputName,
      emitter.emit(parameter.schema, "request", parameter.codec),
      !parameter.required,
    ),
  )
  if (!media || !operation.body) return typeLiteral(params)
  const bodyType = emitter.emit(media.schema, "request", media.codec)
  if (operation.body.mode === "separate")
    return typeLiteral([...params, property("body", bodyType, !operation.body.required)])
  return params.length ? intersection([typeLiteral(params), bodyType]) : bodyType
}

interface RenderOperation {
  readonly contract: string
  readonly declaration: string
}

const OPERATION_TYPES = [
  "Input",
  "Arguments",
  "Response",
  "Error",
  "Responses",
  "FullResponse",
  "Contract",
] as const
function symbolKey(...parts: readonly string[]): string {
  return JSON.stringify(parts)
}

function renderOperation(
  operation: OperationModel,
  emitter: TypeEmitter,
  names: ReadonlyMap<string, string>,
): RenderOperation {
  const name = (suffix: string) => names.get(symbolKey("operation", operation.key, suffix))!
  const declaration: string[] = []
  const variants = operation.body?.media ?? [undefined]
  const inputs = variants.map((media) => inputType(operation, emitter, media))
  declaration.push(printNode(alias(name("Input"), union(inputs))))
  const args = variants.map((media, index) => {
    const isDefault =
      !media || media.mediaType === defaultRequestMediaType(operation.plan.requestBody!)
    const inputOptional =
      !operation.parameters.some((parameter) => parameter.required) && !operation.body?.required
    const options = media ? optionsType(media, isDefault) : typeReference("RequestOptions")
    return f.createTupleTypeNode([
      f.createNamedTupleMember(
        undefined,
        f.createIdentifier("input"),
        inputOptional && isDefault ? f.createToken(ts.SyntaxKind.QuestionToken) : undefined,
        inputs[index]!,
      ),
      f.createNamedTupleMember(
        undefined,
        f.createIdentifier("options"),
        isDefault ? f.createToken(ts.SyntaxKind.QuestionToken) : undefined,
        options,
      ),
    ])
  })
  declaration.push(printNode(alias(name("Arguments"), union(args))))
  const success: ts.TypeNode[] = []
  const errors: ts.TypeNode[] = []
  const full: ts.TypeNode[] = []
  const responseProperties: ts.TypeElement[] = []
  for (const response of operation.responses) {
    const codes = responseCodes(operation, response)
    const successfulCodes = codes.filter(
      (code) => code >= 200 && code < 300 && code !== 204 && code !== 205,
    )
    const emptyCodes = codes.filter((code) => code === 204 || code === 205)
    if (emptyCodes.length) {
      success.push(
        operation.plan.resultMode === "status"
          ? typeLiteral([
              property("status", statusType(emptyCodes)),
              property("data", undefinedType()),
            ])
          : undefinedType(),
      )
      full.push(typeReference("HttpResult", [statusType(emptyCodes), undefinedType()]))
    }
    const payloads = response.media.length
      ? response.media.map((media) => emitter.emit(media.schema, "response", media.codec))
      : [undefinedType()]
    const payload = union(payloads)
    responseProperties.push(
      property(response.status, emptyCodes.length ? union([payload, undefinedType()]) : payload),
    )
    if (successfulCodes.length) {
      success.push(
        operation.plan.resultMode === "status"
          ? typeLiteral([
              property("status", statusType(successfulCodes)),
              property("data", payload),
            ])
          : payload,
      )
      for (const [index, data] of payloads.entries()) {
        const base = typeReference("HttpResult", [statusType(successfulCodes), data])
        full.push(
          response.media.length > 1
            ? intersection([
                base,
                typeLiteral([
                  property(
                    "mediaType",
                    response.media[index]!.mediaType.includes("*")
                      ? stringType()
                      : literal(response.media[index]!.mediaType),
                  ),
                ]),
              ])
            : base,
        )
      }
    }
    if (codes.some((code) => code < 200 || code >= 300)) errors.push(payload)
    if (codes.includes(304)) errors.push(undefinedType())
  }
  declaration.push(printNode(alias(name("Response"), union(success))))
  declaration.push(printNode(alias(name("Error"), union(errors))))
  declaration.push(printNode(alias(name("Responses"), typeLiteral(responseProperties))))
  declaration.push(printNode(alias(name("FullResponse"), union(full))))
  const contract = name("Contract")
  declaration.push(
    printNode(
      alias(
        contract,
        typeLiteral([
          property("args", typeReference(name("Arguments"))),
          property("input", typeReference(name("Input"))),
          property("response", typeReference(name("Response"))),
          property("error", typeReference(name("Error"))),
          property("responses", typeReference(name("Responses"))),
          property("fullResponse", typeReference(name("FullResponse"))),
        ]),
      ),
    ),
  )
  return { contract, declaration: declaration.join("\n\n") }
}

interface TreeNode {
  readonly children: Map<string, TreeNode>
  operation?: OperationModel
}

export function renderSdk(compilation: Compilation, validators?: ValidatorOutput) {
  const reserved = [
    "api",
    "createEndpointFactory",
    "defineEndpoint",
    ...(validators?.adapter.reservedNames ?? []),
    "BinaryUpload",
    "HttpResult",
    "RequestOptions",
    "RequestOptionsFor",
    "StatusRange",
    "ObjectConstraints",
    "ArrayConstraints",
    "ArrayBuffer",
    "Response",
    "Record",
    "Readonly",
    "Omit",
    "Exclude",
    "Promise",
    "Uint8Array",
  ]
  const requests: IdentifierRequest[] = []
  for (const [name, id] of compilation.graph.named) {
    const core = sanitizeTypeIdentifier(name)
    requests.push({
      key: `response:${id}`,
      core,
      qualifiers: [{ prefix: "Response" }, { prefix: "ModelResponse" }],
    })
    requests.push({
      key: `request:${id}`,
      core,
      suffix: "Request",
      qualifiers: [{ prefix: "Request" }, { prefix: "ModelRequest" }],
    })
  }
  for (const operation of compilation.model.operations) {
    const core = sanitizeTypeIdentifier(operation.exportPath.at(-1)!)
    const prefix = sanitizeTypeIdentifier(operation.exportPath.slice(0, -1).join(" "))
    for (const suffix of OPERATION_TYPES)
      requests.push({
        key: symbolKey("operation", operation.key, suffix),
        core,
        suffix,
        qualifiers: [{ prefix }, { prefix: `${prefix}Operation` }],
      })
    if (validators)
      for (const response of operation.responses)
        for (const media of response.media) {
          const shortMedia = sanitizeTypeIdentifier(media.mediaType.split("/").at(-1)!)
          const fullMedia = sanitizeTypeIdentifier(media.mediaType)
          requests.push({
            key: symbolKey("validator", operation.key, response.status, media.mediaType),
            core: `${core}${response.status === "default" ? "Default" : response.status}`,
            suffix: "Schema",
            qualifiers: [
              { suffix: shortMedia },
              { prefix },
              { suffix: fullMedia },
              { prefix, suffix: shortMedia },
              { prefix, suffix: fullMedia },
            ],
          })
        }
  }
  const names = allocateIdentifiers(requests, reserved)
  const typeNames = new Map(
    [...names].filter(([key]) => key.startsWith("request:") || key.startsWith("response:")),
  )
  const emitter = new TypeEmitter(compilation.graph, [...reserved, ...names.values()], typeNames)
  emitter.emitNamed()
  const operations = new Map(
    compilation.model.operations.map((operation) => [
      operation.key,
      renderOperation(operation, emitter, names),
    ]),
  )
  const schemaExports: ValidationSchemaExport[] = []
  const validatorBindings = new Map<MediaModel, string>()
  if (validators) {
    for (const operation of compilation.model.operations) {
      for (const response of operation.responses) {
        for (const media of response.media) {
          const binding = validators.bindings.get(media)
          if (binding === undefined) continue
          const name = names.get(
            symbolKey("validator", operation.key, response.status, media.mediaType),
          )!
          const type = printNode(emitter.emit(media.schema, "response", media.codec))
          schemaExports.push({ name, type, schema: binding })
          validatorBindings.set(media, name)
        }
      }
    }
  }
  let validationSource: ValidationSource | undefined
  if (validators) {
    try {
      validationSource = validators.adapter.generate({
        documents: validators.documents,
        schemas: schemaExports,
        referenceTypes: new Map(
          [...validators.referenceSchemas].map(([ref, id]) => [
            ref,
            printNode(emitter.emit(id, "response")),
          ]),
        ),
        allocateIdentifiers: (requests) =>
          allocateIdentifiers(requests, [
            ...reserved,
            ...names.values(),
            ...emitter.declarations.keys(),
          ]),
      })
    } catch (cause) {
      throw new AccordCodegenError([
        {
          code: "VALIDATION_ADAPTER_ERROR",
          message: `${validators.adapter.name}: ${cause instanceof Error ? cause.message : String(cause)}`,
        },
      ])
    }
  }

  emitter.retainUsedDeclarations(
    ts.createSourceFile(
      "contracts.ts",
      [
        ...[...operations.values()].map((operation) => operation.declaration),
        ...(validationSource?.declarations ?? []),
      ].join("\n"),
      ts.ScriptTarget.Latest,
      true,
    ),
  )
  const root: TreeNode = { children: new Map() }
  for (const operation of compilation.model.operations) {
    let at = root
    for (const key of operation.exportPath) {
      let child = at.children.get(key)
      if (!child) {
        child = { children: new Map() }
        at.children.set(key, child)
      }
      at = child
    }
    at.operation = operation
  }
  const renderTree = (node: TreeNode, depth: number): string => {
    if (node.operation) {
      const operation = node.operation
      const responses = Object.entries(operation.plan.responses).map(([status, metadata]) => {
        const model = operation.responses.find((item) => item.status === status)!
        const variants = responseVariants(metadata).map((response) => {
          const media = model.media.find((item) => item.mediaType === response.mediaType)
          const schema = media && validatorBindings.get(media)
          const json = JSON.stringify(response, null, 2)
          // Only generated identifiers are injected; all spec-owned text remains JSON escaped.
          return schema ? `${json.slice(0, -1)}, "schema": ${schema} }` : json
        })
        return `${JSON.stringify(status)}: ${variants.length > 1 ? `[\n${variants.join(",\n")}\n]` : variants[0]}`
      })
      const plan = JSON.stringify({ ...operation.plan, responses: undefined }, null, 2)
      const definition = `${plan.slice(0, -1)},\n"responses": {\n${responses.join(",\n")}\n} }`
      return `defineEndpoint<${operations.get(operation.key)!.contract}, ${JSON.stringify(operation.plan.kind)}>(${definition})`
    }
    return `{\n${[...node.children].map(([key, child]) => `${"  ".repeat(depth + 1)}${JSON.stringify(key)}: ${renderTree(child, depth + 1)}`).join(",\n")}\n${"  ".repeat(depth)}}`
  }
  const source = [
    generatedHeader,
    'import { createEndpointFactory, type BinaryUpload, type HttpResult, type RequestOptions, type RequestOptionsFor, type StatusRange } from "@accord/client"',
    ...(validationSource?.imports ?? []),
    ...typeHelpers,
    ...[...emitter.declarations.values()].map(printNode),
    ...[...operations.values()].map((operation) => operation.declaration),
    ...(validationSource?.declarations ?? []),
    `const defineEndpoint = createEndpointFactory(${JSON.stringify(compilation.model.id)})`,
    `export const api = ${renderTree(root, 0)}`,
    "",
  ].join("\n\n")
  const groups = [...root.children].map(([name, node]) => {
    const members = compilation.model.operations.filter(
      (operation) => operation.exportPath[0] === name,
    )
    return {
      name,
      types: members.map((operation) => operations.get(operation.key)!.declaration).join("\n\n"),
      contracts: members.map((operation) => operations.get(operation.key)!.contract),
      schemas: [
        ...new Set(
          members.flatMap((operation) =>
            operation.responses.flatMap((response) =>
              response.media.flatMap((media) => {
                const binding = validatorBindings.get(media)
                return binding ? [binding] : []
              }),
            ),
          ),
        ),
      ],
      endpoints: renderTree(node, 0),
    }
  })
  return {
    source: formatSource(source),
    files: renderModules({
      apiId: compilation.model.id,
      models: new Map(
        [...emitter.declarations].map(([name, declaration]) => [name, printNode(declaration)]),
      ),
      modelFamilies: emitter.declarationFamilies(),
      groups,
      validation: validationSource,
    }),
  }
}
