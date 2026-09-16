import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { generateFromFile } from "../src/generate.js"

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
    const first = await generateFromFile(fixture("users.openapi.yaml"), { validators: true })
    const second = await generateFromFile(fixture("users.openapi.yaml"), { validators: true })
    expect(first.source).toBe(second.source)
    expect(first.files).toEqual(second.files)
  })
})
