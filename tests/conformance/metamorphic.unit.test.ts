import { rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { generate, generateFromFile } from "@accord/codegen"
import { describe, expect, it } from "vitest"
import { endpoint } from "./fixture.js"
import { newWorkspace } from "./harness.js"

describe("public generator metamorphic invariants", () => {
  it("JSON and YAML produce the same SDK and normalized metadata", async () => {
    const directory = await newWorkspace("formats")
    try {
      await writeFile(join(directory, "openapi.json"), JSON.stringify(endpoint()))
      await writeFile(
        join(directory, "openapi.yaml"),
        `openapi: 3.1.0
info:
  title: Accord conformance
  version: '1'
paths:
  /probe:
    get:
      operationId: call
      responses:
        '204':
          description: No content
components: {}
`,
      )
      expect(await generateFromFile(join(directory, "openapi.yaml"))).toEqual(
        await generateFromFile(join(directory, "openapi.json")),
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("descriptive metadata changes neither endpoint identity nor wire metadata", async () => {
    const [before, after] = await Promise.all([
      generate(endpoint()),
      generate(endpoint({ summary: "A new summary", description: "Documentation is not routing" })),
    ])
    expect(after.normalized).toEqual(before.normalized)
  })

  it("generation does not mutate the input document", async () => {
    const input = endpoint()
    const before = JSON.stringify(input)
    Object.freeze(input)
    await generate(input)
    expect(JSON.stringify(input)).toBe(before)
  })
})
