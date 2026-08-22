import { describe, expect, it } from "vitest"
import { normalizeOpenApi } from "../src/normalize.js"

describe("fallback operation names", () => {
  it("keeps collection and parameterized operations distinct without operationIds", () => {
    const normalized = normalizeOpenApi({
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

    expect(normalized.operations.map((operation) => operation.operationName)).toEqual([
      "get",
      "getByUserId",
    ])
  })
})
