import { describe, expect, it } from "vitest"
import { compileApi } from "../src/compile.js"
import { DocumentStore } from "../src/loader.js"
import type { AccordCodegenConfig, JsonValue } from "../src/types.js"

function compile(document: JsonValue, config: AccordCodegenConfig = {}) {
  return compileApi(new DocumentStore(document, "file:///fixture.json"), config).model
}

describe("fallback operation names", () => {
  it("keeps collection and parameterized operations distinct without operationIds", () => {
    const normalized = compile({
      openapi: "3.1.0",
      info: { title: "fallback", version: "1.0.0" },
      paths: {
        "/users": {
          get: { responses: { 200: { description: "ok" } } },
        },
        "/users/{userId}": {
          get: {
            parameters: [
              {
                in: "path",
                name: "userId",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "ok" } },
          },
        },
      },
    })

    expect(normalized.operations.map((operation) => operation.exportPath.at(-1))).toEqual([
      "get",
      "getByUserId",
    ])
  })
})
