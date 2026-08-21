import { describe, expect, it } from "vitest"
import {
  operationName,
  pathNamespace,
  sanitizeIdentifier,
  sanitizeTypeIdentifier,
  stripBasePath,
} from "../src/naming.js"

describe("identifier generation", () => {
  it.each([
    ["get-user", "getUser"],
    ["GetUser", "getUser"],
    ["123 users", "_123Users"],
    ["déjà-vu", "dejaVu"],
    ["constructor", "_constructor"],
    ["🔥", "_"],
  ])("sanitizes %s", (input, expected) => {
    expect(sanitizeIdentifier(input)).toBe(expected)
  })

  it("generates PascalCase type names", () => {
    expect(sanitizeTypeIdentifier("users get-user")).toBe("UsersGetUser")
  })

  it("removes path parameters and an exact base prefix from namespaces", () => {
    expect(pathNamespace("/api/v1/users/{userId}/posts/{postId}", "/api/v1")).toEqual([
      "users",
      "posts",
    ])
    expect(stripBasePath("/api/v10/users", "/api/v1")).toBe("/api/v10/users")
  })

  it("uses x-sdk-name, then operationId, then method", () => {
    expect(operationName({ "x-sdk-name": "fetch-one", operationId: "ignored" }, "get")).toBe(
      "fetchOne",
    )
    expect(operationName({ operationId: "get-user" }, "get")).toBe("getUser")
    expect(operationName({}, "patch")).toBe("patch")
  })
})
