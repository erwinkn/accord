import { execFile } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { performance } from "node:perf_hooks"
import { promisify } from "node:util"
import { generate, type JsonValue, writeGeneratedSdk } from "../packages/codegen/src/index.js"

const count = 300
const paths: { [key: string]: JsonValue } = Object.create(null)
for (let index = 0; index < count; index++)
  paths[`/resources${index}/{id}`] = {
    get: {
      operationId: `getResource${index}`,
      "x-sdk-name": "get",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": {
          description: "Resource",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Resource" } } },
        },
      },
    },
  }
const document = {
  openapi: "3.1.0",
  info: { title: "Scale", version: "1" },
  paths,
  components: {
    schemas: {
      Resource: {
        type: "object",
        required: ["id", "name"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          children: { type: "array", items: { $ref: "#/components/schemas/Resource" } },
        },
      },
    },
  },
}
const start = performance.now()
const generated = await generate(document)
const generationMs = performance.now() - start
await mkdir(".accord-test-work/scale", { recursive: true })
await writeGeneratedSdk(".accord-test-work/scale/sdk.ts", generated)
await writeFile(
  ".accord-test-work/scale/consumer.ts",
  'import { createClient } from "@accord/client"; import { api } from "./sdk.js"; const client = createClient(api);\n' +
    Array.from(
      { length: count },
      (_, index) =>
        `const result${index}: Promise<{readonly id: string; readonly name: string}> = client.resources${index}.get({id:"1"});`,
    ).join("\n"),
)
const result = await promisify(execFile)(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "--strict",
    "--skipLibCheck",
    "false",
    "--exactOptionalPropertyTypes",
    "--noUncheckedIndexedAccess",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ES2022",
    "--noEmit",
    "--extendedDiagnostics",
    ".accord-test-work/scale/consumer.ts",
  ],
  { maxBuffer: 2_000_000 },
)
await mkdir("artifacts/scale", { recursive: true })
await writeFile(
  "artifacts/scale/report.json",
  JSON.stringify(
    {
      passed: true,
      operations: count,
      moduleCount: Object.keys(generated.files).length,
      sourceBytes: Object.values(generated.files).reduce(
        (total, source) => total + Buffer.byteLength(source),
        0,
      ),
      singleFileBytes: Buffer.byteLength(generated.source),
      generationMs,
      compiler: result.stdout,
    },
    null,
    2,
  ),
)
console.log(
  `Scale passed: ${count} generated endpoints and typed calls; generation ${generationMs.toFixed(0)}ms`,
)
