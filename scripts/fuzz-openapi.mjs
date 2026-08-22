import ts from "typescript"
import {
  AccordCodegenError,
  generate,
  normalizeOpenApi,
  renderNormalizedApi,
} from "../packages/codegen/dist/index.js"

const runs = positiveInteger(process.env.ACCORD_FUZZ_RUNS, 100)
const seed = positiveInteger(process.env.ACCORD_FUZZ_SEED, 0xacc0ad)
const random = xorshift32(seed)

for (let run = 0; run < runs; run += 1) {
  const document = randomDocument(random, run)
  const reordered = reorder(document, random)
  const first = await generate(document)
  const second = await generate(reordered)

  assert(first.source === second.source, `non-deterministic output at run ${run}`)
  assert(
    renderNormalizedApi(first.normalized) === renderNormalizedApi(second.normalized),
    `non-deterministic normalization at run ${run}`,
  )
  assertTypeScriptSyntax(first.source, run)
  assertUniqueEndpoints(first.normalized.operations, run)
}

const malformedCorpus = [
  null,
  [],
  { openapi: "2.0", paths: {} },
  { openapi: "3.1.0", paths: [] },
  { openapi: "3.1.0", paths: { "/x": { get: null } } },
  {
    openapi: "3.1.0",
    paths: {
      "/x/{id}": {
        get: {
          parameters: [{ in: "path", name: "id", required: false, schema: { type: "string" } }],
          responses: {},
        },
      },
    },
  },
  {
    openapi: "3.1.0",
    paths: {
      "/x": {
        post: {
          operationId: "pollution",
          requestBody: {
            content: {
              "application/json": {
                schema: JSON.parse(
                  '{"type":"object","properties":{"__proto__":{"type":"string"}}}',
                ),
              },
            },
          },
          responses: { 200: { description: "ok" } },
        },
      },
    },
  },
  {
    openapi: "3.1.0",
    paths: { "/x": { $ref: "#/components/pathItems/A" } },
    components: {
      pathItems: {
        A: { $ref: "#/components/pathItems/B" },
        B: { $ref: "#/components/pathItems/A" },
      },
    },
  },
]

for (const [index, value] of malformedCorpus.entries()) {
  try {
    normalizeOpenApi(value)
  } catch (error) {
    if (!(error instanceof AccordCodegenError)) {
      throw new Error(`malformed corpus ${index} threw an unexpected error`, { cause: error })
    }
  }
}

process.stdout.write(`Accord fuzz smoke passed: ${runs} generated documents, seed ${seed}\n`)

function randomDocument(randomValue, run) {
  const openapiVersion = integer(randomValue, 2) ? "3.1.0" : "3.0.3"
  const operationCount = 1 + integer(randomValue, 8)
  const paths = Object.create(null)
  for (let index = 0; index < operationCount; index += 1) {
    const method = ["get", "post", "put", "patch", "delete"][integer(randomValue, 5)]
    const parameterName = `id${run}_${index}`
    const path =
      `/resources-${run}-${index}/{${parameterName}}/children-` + integer(randomValue, 100)
    const operationId = `operation_${run}_${index}_${method}`
    const parameters = [
      {
        in: "path",
        name: parameterName,
        required: true,
        style: ["simple", "label", "matrix"][integer(randomValue, 3)],
        explode: Boolean(integer(randomValue, 2)),
        schema: { type: "string" },
      },
      {
        in: "query",
        name: `query_${index}`,
        required: Boolean(integer(randomValue, 2)),
        style: "form",
        explode: Boolean(integer(randomValue, 2)),
        schema: integer(randomValue, 2)
          ? { type: "array", items: { type: "integer" } }
          : { type: "string", nullable: Boolean(integer(randomValue, 2)) },
      },
    ]

    const operation = {
      operationId,
      parameters,
      responses: {
        200: {
          description: "ok",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Result" },
            },
          },
        },
        default: {
          description: "error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    }

    if (method !== "get" && method !== "delete") {
      operation.requestBody = {
        required: Boolean(integer(randomValue, 2)),
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
                count:
                  openapiVersion === "3.1.0"
                    ? { type: ["integer", "null"] }
                    : { type: "integer", nullable: true },
              },
              additionalProperties: false,
            },
          },
        },
      }
    }
    paths[path] = { [method]: operation }
  }

  return {
    openapi: openapiVersion,
    info: { title: `fuzz-${run}`, version: "1.0.0" },
    paths,
    components: {
      schemas: {
        Result: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
            state: { type: "string", enum: ["ready", "pending"] },
          },
        },
        Error: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string" } },
        },
      },
    },
  }
}

function reorder(value, randomValue) {
  if (Array.isArray(value)) return value.map((item) => reorder(item, randomValue))
  if (!value || typeof value !== "object") return value
  const entries = Object.entries(value)
  for (let index = entries.length - 1; index > 0; index -= 1) {
    const target = integer(randomValue, index + 1)
    ;[entries[index], entries[target]] = [entries[target], entries[index]]
  }
  return Object.fromEntries(entries.map(([key, item]) => [key, reorder(item, randomValue)]))
}

function assertTypeScriptSyntax(source, run) {
  const output = ts.transpileModule(source, {
    fileName: `fuzz-${run}.ts`,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  })
  const errors = (output.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  if (errors.length > 0) {
    throw new Error(
      `invalid generated TypeScript at run ${run}: ${errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
        .join("; ")}`,
    )
  }
}

function assertUniqueEndpoints(operations, run) {
  const paths = operations.map((operation) =>
    [...operation.namespace, operation.operationName].join("."),
  )
  assert(new Set(paths).size === paths.length, `silent endpoint overwrite at run ${run}`)
}

function xorshift32(initialSeed) {
  let state = initialSeed >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x1_0000_0000
  }
}

function integer(randomValue, maximum) {
  return Math.floor(randomValue() * maximum)
}

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
