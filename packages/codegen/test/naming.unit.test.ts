import { describe, expect, it } from "vitest"
import {
  fallbackOperationName,
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

  it("uses x-sdk-name, then operationId, then a path-aware fallback", () => {
    expect(
      operationName(
        { "x-sdk-name": "fetch-one", operationId: "ignored" },
        "get",
        "/users/{userId}",
      ),
    ).toBe("fetchOne")
    expect(operationName({ operationId: "get-user" }, "get", "/users/{userId}")).toBe("getUser")
    expect(operationName({}, "patch", "/users")).toBe("patch")
    expect(operationName({}, "get", "/users/{userId}")).toBe("getByUserId")
  })

  it("includes every ordered path parameter in fallback names", () => {
    expect(fallbackOperationName("GET", "/users/{user-id}/posts/{postId}")).toBe(
      "getByUserIdAndPostId",
    )
  })
})
