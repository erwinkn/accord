import { defaultRequestMediaType, selectResponse } from "@accord/client"
import ts from "typescript"
import type { Compilation } from "./compile.js"
import type { MediaModel, OperationModel, ResponseModel } from "./model.js"
import { sanitizeTypeIdentifier } from "./naming.js"
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
import type { ValidatorOutput } from "./validators.js"

const f = ts.factory
const stringType = () => f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)

function responseCodes(operation: OperationModel, response: ResponseModel): number[] {
  return Array.from({ length: 500 }, (_, index) => index + 100).filter(
    (code) => String(selectResponse(operation.plan.responses, code)?.status) === response.status,
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
  const content = union([
    literal(media.mediaType),
    f.createTemplateLiteralType(f.createTemplateHead(`${media.mediaType};`), [
      f.createTemplateLiteralTypeSpan(stringType(), f.createTemplateTail("")),
    ]),
  ])
  const headers = intersection([
    typeReference("Readonly", [typeReference("Record", [stringType(), stringType()])]),
    typeLiteral([property("content-type", content, isDefault)]),
  ])
  return intersection([
    typeReference("Omit", [typeReference("RequestOptions"), literal("headers")]),
    typeLiteral([property("headers", headers, isDefault)]),
  ])
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
  return params.length
    ? typeReference("AccordSimplify", [intersection([typeLiteral(params), bodyType])])
    : bodyType
}

interface RenderOperation {
  readonly contract: string
  readonly declaration: string
}

function renderOperation(operation: OperationModel, emitter: TypeEmitter): RenderOperation {
  const name = operation.typeName
  const declaration: string[] = []
  const variants = operation.body?.media ?? [undefined]
  const inputs = variants.map((media) => inputType(operation, emitter, media))
  declaration.push(printNode(alias(`${name}Input`, union(inputs))))
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
  declaration.push(printNode(alias(`${name}Arguments`, union(args))))
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
  declaration.push(printNode(alias(`${name}Response`, union(success))))
  declaration.push(printNode(alias(`${name}Error`, union(errors))))
  declaration.push(printNode(alias(`${name}Responses`, typeLiteral(responseProperties))))
  declaration.push(printNode(alias(`${name}FullResponse`, union(full))))
  const contract = `${name}Contract`
  declaration.push(
    printNode(
      alias(
        contract,
        typeLiteral([
          property("args", typeReference(`${name}Arguments`)),
          property("input", typeReference(`${name}Input`)),
          property("response", typeReference(`${name}Response`)),
          property("error", typeReference(`${name}Error`)),
          property("responses", typeReference(`${name}Responses`)),
          property("fullResponse", typeReference(`${name}FullResponse`)),
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

export function renderSdk(compilation: Compilation, validators?: ValidatorOutput): string {
  const emitter = new TypeEmitter(compilation.graph, [
    "api",
    "accordValidators",
    "createAccordValidators",
    "AccordValidationFunction",
    "standardSchema",
    "BinaryUpload",
    "HttpResult",
    "RequestOptions",
    "StatusRange",
    "AccordSimplify",
    "AccordObjectConstraints",
    "AccordArrayConstraints",
    ...compilation.model.operations.flatMap((operation) =>
      ["Input", "Arguments", "Response", "Error", "Responses", "FullResponse", "Contract"].map(
        (suffix) => `${operation.typeName}${suffix}`,
      ),
    ),
  ])
  emitter.emitNamed()
  const operations = new Map(
    compilation.model.operations.map((operation) => [
      operation.key,
      renderOperation(operation, emitter),
    ]),
  )
  const validatorDeclarations: string[] = []
  const validatorBindings = new Map<MediaModel, string>()
  if (validators) {
    for (const operation of compilation.model.operations) {
      for (const response of operation.responses) {
        for (const media of response.media) {
          const binding = validators.bindings.get(media)
          if (!binding) continue
          const name = `${operation.typeName}Response${sanitizeTypeIdentifier(`${response.status} ${media.mediaType}`)}Schema`
          const type = printNode(emitter.emit(media.schema, "response", media.codec))
          validatorDeclarations.push(
            `export const ${name} = standardSchema<${type}>(accordValidators.${binding.exportName}, ${binding.binary})`,
          )
          validatorBindings.set(media, name)
        }
      }
    }
  }
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
  // Intern security scheme dictionaries so common auth configuration appears only once.
  const securityDefinitions = new Map<string, string>()
  for (const operation of compilation.model.operations) {
    if (!operation.plan.securitySchemes || !Object.keys(operation.plan.securitySchemes).length)
      continue
    const json = JSON.stringify(operation.plan.securitySchemes)
    if (!securityDefinitions.has(json))
      securityDefinitions.set(json, `accordSecuritySchemes${securityDefinitions.size}`)
  }
  const renderTree = (node: TreeNode, depth: number): string => {
    if (node.operation) {
      const operation = node.operation
      const responses = operation.plan.responses.map((response) => {
        const model = operation.responses.find((item) => item.status === String(response.status))!
        const content = response.content.map((media) => {
          const source = model.media.find((item) => item.mediaType === media.mediaType)!
          const schema = validatorBindings.get(source)
          const json = JSON.stringify(media, null, 2)
          return schema ? `${json.slice(0, -1)}, "schema": ${schema} }` : json
        })
        // Only generated identifiers are injected; all spec-owned text remains JSON escaped.
        const json = JSON.stringify({ ...response, content: undefined }, null, 2)
        return `${json.slice(0, -1)}, "content": [\n${content.join(",\n")}\n] }`
      })
      const plan = JSON.stringify(
        { ...operation.plan, responses: undefined, securitySchemes: undefined },
        null,
        2,
      )
      const security = securityDefinitions.get(JSON.stringify(operation.plan.securitySchemes))
      const securityEntry = security ? `,\n"securitySchemes": ${security}` : ""
      const definition = `${plan.slice(0, -1)}${securityEntry},\n"responses": [\n${responses.join(",\n")}\n] }`
      return `defineEndpoint<${operations.get(operation.key)!.contract}, ${JSON.stringify(operation.plan.operationKind)}>(${definition})`
    }
    return `{\n${[...node.children].map(([key, child]) => `${"  ".repeat(depth + 1)}${JSON.stringify(key)}: ${renderTree(child, depth + 1)}`).join(",\n")}\n${"  ".repeat(depth)}}`
  }
  const source = [
    "/* Generated by @accord/codegen. Regenerate from the OpenAPI source. */",
    'import { defineEndpoint, type BinaryUpload, type HttpResult, type RequestOptions, type StatusRange } from "@accord/client"',
    ...(validators
      ? [
          'import { standardSchema, type ValidationFunction as AccordValidationFunction } from "@accord/client/validation"',
        ]
      : []),
    "type AccordSimplify<T> = T extends unknown ? { [K in keyof T]: T[K] } : never",
    "type AccordObjectConstraints<T, R> = T extends readonly unknown[] ? T : T extends object ? T & R : T",
    "type AccordArrayConstraints<T, R> = T extends readonly unknown[] ? T & R : T",
    ...[...emitter.declarations.values()].map(printNode),
    ...[...operations.values()].map((operation) => operation.declaration),
    ...(validators ? ["const accordValidators = createAccordValidators()"] : []),
    ...validatorDeclarations,
    ...[...securityDefinitions].map(([json, name]) => `const ${name} = ${json} as const`),
    `export const api = ${renderTree(root, 0)}`,
    ...(validators ? [validators.source] : []),
    "",
  ].join("\n\n")
  return ts
    .createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printFile(
      ts.createSourceFile("sdk.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
    )
}
