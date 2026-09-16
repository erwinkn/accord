import assert from "node:assert/strict"
import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { JsonObject, JsonValue } from "@accord/codegen"
import { generate } from "@accord/codegen"
import fc from "fast-check"
import { consumer, document, integerSchema, references, stringSchema } from "./fixture.js"
import { root, verifyFixture } from "./harness.js"

interface FuzzResponses {
  [key: string]: JsonValue
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error(`Expected positive integer, received ${value}`)
  return number
}

function isObject(value: JsonValue): value is JsonObject {
  return value !== null && !Array.isArray(value) && typeof value === "object"
}

function reordered(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(reordered)
  if (!isObject(value)) return value
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, item]) => [key, reordered(item)]),
  )
}

const word = fc
  .array(fc.constantFrom("a", "Z", "0", "é", "漢", " ", "/", "&", "#", "+", "%"), { maxLength: 16 })
  .map((letters) => letters.join(""))
const scenario = fc.record({
  version: fc.constantFrom("3.0.3", "3.1.0"),
  composition: fc.constantFrom("inline", "reference", "allOf", "oneOf"),
  mode: fc.constantFrom("merge", "separate"),
  id: word.map((value) => `id-${value}`),
  query: word,
  name: word,
  count: fc.integer({ min: -100_000, max: 100_000 }),
  enabled: fc.boolean(),
  validators: fc.boolean(),
  status: fc.constantFrom(200, 201, 202, 204),
  statusUnion: fc.boolean(),
})

async function main(): Promise<void> {
  const seedValue = process.env["ACCORD_FUZZ_SEED"]
  const seed = seedValue === undefined ? 11321517 : Number(seedValue)
  if (!Number.isSafeInteger(seed) || seed < -2147483648 || seed > 2147483647)
    throw new Error("Invalid signed 32-bit fuzz seed")
  const numRuns = positiveInteger(process.env["ACCORD_FUZZ_RUNS"], 20)
  const replay = process.env["ACCORD_FUZZ_PATH"]
  const parameters = replay === undefined ? { seed, numRuns } : { seed, numRuns, path: replay }
  await rm(join(root, "artifacts/fuzz"), { recursive: true, force: true })
  await rm(join(root, "artifacts/conformance/failures/fuzz.generated-wire"), {
    recursive: true,
    force: true,
  })
  let verified = 0
  const details = await fc.check(
    fc.asyncProperty(scenario, async (sample) => {
      const leaf = {
        type: "object",
        additionalProperties: false,
        properties: { name: stringSchema, count: integerSchema, enabled: { type: "boolean" } },
        required: ["name", "count", "enabled"],
      }
      let schema: JsonValue = leaf
      if (sample.composition === "reference") schema = { $ref: "#/components/schemas/Payload" }
      if (sample.composition === "allOf") schema = { allOf: [leaf] }
      if (sample.composition === "oneOf")
        schema = {
          oneOf: [
            leaf,
            {
              type: "object",
              properties: { other: stringSchema },
              required: ["other"],
              additionalProperties: false,
            },
          ],
        }
      const responses: FuzzResponses = {
        [sample.status]:
          sample.status === 204
            ? { description: "No content" }
            : { description: "Result", content: { "application/json": { schema: leaf } } },
      }
      if (sample.statusUnion)
        responses[sample.status === 202 ? 200 : 202] = {
          description: "Alternate success",
          content: { "application/json": { schema: leaf } },
        }
      const inputDocument = {
        ...document(
          {
            "/probe/{id}": {
              post: {
                operationId: "call",
                parameters: [
                  { name: "id", in: "path", required: true, schema: stringSchema },
                  { name: "q", in: "query", required: true, schema: stringSchema },
                ],
                requestBody: { required: true, content: { "application/json": { schema } } },
                responses,
              },
            },
          },
          { schemas: { Payload: leaf } },
        ),
        openapi: sample.version,
      }
      const config = {
        body: { mode: sample.mode === "merge" ? "merge" : "separate" },
        validators: sample.validators,
      } as const
      const [first, second] = await Promise.all([
        generate(inputDocument, config),
        generate(reordered(inputDocument), config),
      ])
      assert.equal(first.source, second.source, "Reordering object keys changed generated source")
      assert.deepEqual(
        first.model,
        second.model,
        "Reordering object keys changed endpoint metadata",
      )
      const body = { name: sample.name, count: sample.count, enabled: sample.enabled }
      const payload = sample.status === 204 ? undefined : body
      const input =
        sample.mode === "merge"
          ? { id: sample.id, q: sample.query, ...body }
          : { id: sample.id, q: sample.query, body }
      const failure = await verifyFixture({
        id: "fuzz.generated-wire",
        title: "Generated schema, types and request agree",
        area: "wire",
        reference: references.accord,
        document: inputDocument,
        config,
        consumer: {
          source: consumer(`export async function run() {
        await withServer(async (baseUrl, requests) => {
          const result = await createClient(api, { baseUrl }).probe.call(${JSON.stringify(input)})
          assert.deepEqual(result, ${sample.statusUnion ? `{ status: ${sample.status}, data: ${JSON.stringify(payload) ?? "undefined"} }` : (JSON.stringify(payload) ?? "undefined")}, "ACCORD_FUZZ_RESPONSE")
          assert.equal(requests.length, 1)
          const request = requests[0]!
          const url = new URL(request.url, baseUrl)
          assert.equal(decodeURIComponent(url.pathname.slice("/base/probe/".length)), ${JSON.stringify(sample.id)}, "ACCORD_FUZZ_PATH")
          assert.deepEqual([...url.searchParams], [["q", ${JSON.stringify(sample.query)}]], "ACCORD_FUZZ_QUERY")
          assert.deepEqual(JSON.parse(request.body.toString()), ${JSON.stringify(body)}, "ACCORD_FUZZ_BODY")
        }, { status: ${sample.status}, headers: { "content-type": "application/json" }, body: ${JSON.stringify(payload ? JSON.stringify(payload) : "")} })
      }`),
        },
      })
      if (failure) throw new Error(`${failure.phase}/${failure.signature}: ${failure.message}`)
      verified += 1
    }),
    parameters,
  )
  const directory = join(root, "artifacts", "fuzz")
  await mkdir(directory, { recursive: true })
  const report = {
    seed: details.seed,
    path: details.counterexamplePath,
    numRuns: details.numRuns,
    numShrinks: details.numShrinks,
    failed: details.failed,
    verified,
    counterexample: details.counterexample,
    error: details.errorInstance instanceof Error ? details.errorInstance.stack : null,
  }
  await writeFile(join(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`)
  if (details.failed) {
    // Keep the minimized executable reproduction when the subsequent strict corpus clears its reports.
    const failureDirectory = join(root, "artifacts/conformance/failures/fuzz.generated-wire")
    if (
      await stat(failureDirectory).then(
        () => true,
        () => false,
      )
    ) {
      await cp(failureDirectory, join(directory, "reproduction"), { recursive: true })
    }
    console.error(
      `Replay: ACCORD_FUZZ_SEED=${details.seed} ACCORD_FUZZ_PATH='${details.counterexamplePath}' pnpm test:fuzz`,
    )
    throw details.errorInstance ?? new Error("Generated conformance property failed")
  }
  console.log(
    `Conformance fuzz passed: ${details.numRuns} complete generate + semantic compile + HTTP cases; seed=${seed}`,
  )
}

main().catch((error: Error) => {
  console.error(error.stack ?? error.message)
  process.exitCode = 1
})
