import { mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { zodAdapter } from "@accord/zod"
import { describe, expect, it } from "vitest"
import { generate, generateFromFile, writeGeneratedSdk } from "../src/generate.js"
import type { JsonObject } from "../src/types.js"

const fixture = (name: string) =>
  fileURLToPath(new URL(`../../../tests/fixtures/${name}`, import.meta.url))
const golden = (name: string) =>
  fileURLToPath(new URL(`../../../tests/golden/${name}`, import.meta.url))

describe("owned generation goldens", () => {
  it.each([
    ["users.openapi.yaml", "users.normalized.json", {}],
    ["features.openapi.yaml", "features.normalized.json", { basePath: "/api/v1" }],
  ] as const)("matches reviewed endpoint plans for %s", async (input, output, config) => {
    const result = await generateFromFile(fixture(input), config)
    const plans = result.model.operations.map((operation) => ({
      exportPath: operation.exportPath,
      plan: operation.plan,
    }))
    expect(`${JSON.stringify(plans, null, 2)}\n`).toBe(await readFile(golden(output), "utf8"))
  })
  it("matches real generated types and metadata without a mocked type producer", async () => {
    const result = await generateFromFile(fixture("users.openapi.yaml"))
    expect(result.source).toBe(await readFile(golden("users.rendered.ts"), "utf8"))
  })
  it("is deterministic across complete generation runs", async () => {
    const first = await generateFromFile(fixture("users.openapi.yaml"), {
      validators: zodAdapter(),
    })
    const second = await generateFromFile(fixture("users.openapi.yaml"), {
      validators: zodAdapter(),
    })
    expect(first.source).toBe(second.source)
  })
  it("writes a complete single-file SDK, including optional validators", async () => {
    const directory = await mkdtemp(join(tmpdir(), "accord-single-file-"))
    try {
      const result = await generateFromFile(fixture("users.openapi.yaml"), {
        validators: zodAdapter(),
      })
      await writeGeneratedSdk(join(directory, "sdk.ts"), result)
      expect(await readdir(directory)).toEqual(["sdk.ts"])
      expect(await readFile(join(directory, "sdk.ts"), "utf8")).toBe(result.source)
      expect(result.source).not.toMatch(/@ts-(?:ignore|nocheck)|\.validators\.js/)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
  it("shared response models do not duplicate the validation implementation per endpoint", async () => {
    const model = {
      type: "object",
      required: ["id", "name", "email", "roles"],
      properties: {
        id: { type: "integer" },
        name: { type: "string", minLength: 2 },
        email: { type: "string", format: "email" },
        roles: { type: "array", items: { type: "string", enum: ["admin", "member"] } },
      },
    }
    const document = (count: number): JsonObject => ({
      openapi: "3.1.0",
      info: { title: "Shared validators", version: "1" },
      components: { schemas: { User: model } },
      paths: Object.fromEntries(
        Array.from({ length: count }, (_, index) => [
          `/users${index}`,
          {
            get: {
              operationId: `getUser${index}`,
              responses: {
                200: {
                  description: "User",
                  content: {
                    "application/json": { schema: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
          },
        ]),
      ),
    })
    const extraBytes = async (count: number) => {
      const input = document(count)
      const withChecks = await generate(input, { validators: zodAdapter() })
      const withoutChecks = await generate(input)
      return withChecks.source.length - withoutChecks.source.length
    }
    // Extra endpoint bindings are small; the complex schema check must not grow 20-fold.
    expect(await extraBytes(20)).toBeLessThan((await extraBytes(1)) + 20 * 180)
    const shared = await generate(document(20), { validators: zodAdapter() })
    expect(shared.source.match(/z\.email\(\)/g)).toHaveLength(1)
  })
})

it("disambiguates all conflicting schema names and retains short unambiguous names", async () => {
  const get = (id: string, name: string) => ({
    operationId: id,
    "x-sdk-name": name,
    responses: {
      200: { description: "ok", content: { "application/json": { schema: { type: "string" } } } },
    },
  })
  const { source } = await generate(
    {
      openapi: "3.1.0",
      info: { title: "Names", version: "1" },
      paths: {
        "/documents": { get: get("documentsGet", "get") },
        "/files": { get: get("filesGet", "get") },
        "/users": { get: get("getUser", "getUser") },
      },
    },
    { validators: zodAdapter() },
  )
  expect(source).toContain("DocumentsGet200Schema")
  expect(source).toContain("FilesGet200Schema")
  expect(source).toContain("GetUser200Schema")
  expect(source).not.toContain('"apiId"')
  expect(source).not.toContain('"operationId"')
  expect(source).toContain('"id": "getUser"')
  expect(source).toContain('"kind": "query"')
})
