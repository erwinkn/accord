import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { generate, loadOpenApiFile } from "../src/generate.js"
import { normalizeOpenApi } from "../src/normalize.js"
import { renderGeneratedModule, renderNormalizedApi } from "../src/render.js"

const fixture = (name: string) =>
  fileURLToPath(new URL(`../../../tests/fixtures/${name}`, import.meta.url))
const golden = (name: string) =>
  fileURLToPath(new URL(`../../../tests/golden/${name}`, import.meta.url))

const mockTypes = `export interface paths {
  "/users": {
    parameters: { query?: never; header?: never; path?: never; cookie?: never }
    get: operations["listUsers"]
    post: operations["createUser"]
  }
  "/users/{userId}": {
    parameters: { query?: never; header?: never; path?: never; cookie?: never }
    get: operations["getUser"]
  }
}
export interface components {
  schemas: {
    User: { id: string; name: string; email?: string | null }
    CreateUser: { name: string; email?: string }
    ApiError: { code: string; message: string }
  }
}
export interface operations {
  listUsers: {
    parameters: { query?: { limit?: number }; header?: never; path?: never; cookie?: never }
    responses: { 200: { content: { "application/json": components["schemas"]["User"][] } } }
  }
  createUser: {
    parameters: { query?: never; header?: never; path?: never; cookie?: never }
    requestBody: { content: { "application/json": components["schemas"]["CreateUser"] } }
    responses: {
      201: { content: { "application/json": components["schemas"]["User"] } }
      400: { content: { "application/json": components["schemas"]["ApiError"] } }
    }
  }
  getUser: {
    parameters: { query?: never; header?: never; path: { userId: string }; cookie?: never }
    responses: {
      200: { content: { "application/json": components["schemas"]["User"] } }
      404: { content: { "application/json": components["schemas"]["ApiError"] } }
    }
  }
}`

describe("golden generation", () => {
  it.each([
    ["users.openapi.yaml", "users.normalized.json", {}],
    ["features.openapi.yaml", "features.normalized.json", { basePath: "/api/v1" }],
  ] as const)("matches normalized golden for %s", async (fixtureName, goldenName, config) => {
    const document = await loadOpenApiFile(fixture(fixtureName))
    const actual = renderNormalizedApi(normalizeOpenApi(document, config))
    expect(actual).toBe(await readFile(golden(goldenName), "utf8"))
  })

  it("matches the committed generated-module golden", async () => {
    const document = await loadOpenApiFile(fixture("users.openapi.yaml"))
    const source = renderGeneratedModule(normalizeOpenApi(document), mockTypes)
    expect(source).toBe(await readFile(golden("users.rendered.ts"), "utf8"))
  })

  it("is deterministic with the real schema type generator", async () => {
    const document = await loadOpenApiFile(fixture("users.openapi.yaml"))
    const first = await generate(document)
    const second = await generate(document)
    expect(first.source).toBe(second.source)
    expect(first.source).toContain("export const api")
    expect(first.source).toContain('"getUser"')
    expect(first.source).toContain("UsersGetUserInput")
  })
})
