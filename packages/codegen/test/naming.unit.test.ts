import { describe, expect, it } from "vitest"
import {
  allocateIdentifiers,
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

describe("batch identifier allocation", () => {
  it("keeps unique names short and qualifies every conflicting name", () => {
    const requests = [
      {
        key: "documents",
        core: "Get404",
        suffix: "Schema",
        qualifiers: [{ suffix: "Json" }, { prefix: "Documents" }],
      },
      {
        key: "files",
        core: "Get404",
        suffix: "Schema",
        qualifiers: [{ suffix: "Json" }, { prefix: "Files" }],
      },
      { key: "unique", core: "Create", suffix: "Input" },
    ]
    expect(Object.fromEntries(allocateIdentifiers(requests))).toEqual({
      documents: "DocumentsGet404Schema",
      files: "FilesGet404Schema",
      unique: "CreateInput",
    })
    expect(allocateIdentifiers(requests)).toEqual(allocateIdentifiers([...requests].reverse()))
  })
  it("uses media suffixes when they suffice, without adding namespace prefixes", () => {
    expect(
      Object.fromEntries(
        allocateIdentifiers([
          {
            key: "json",
            core: "Get200",
            suffix: "Schema",
            qualifiers: [{ suffix: "Json" }, { prefix: "Documents" }],
          },
          {
            key: "text",
            core: "Get200",
            suffix: "Schema",
            qualifiers: [{ suffix: "Plain" }, { prefix: "Documents" }],
          },
        ]),
      ),
    ).toEqual({ json: "Get200JsonSchema", text: "Get200PlainSchema" })
  })
  it("handles reserved identifiers, cascading collisions, and exhausted qualifiers", () => {
    const requests = [
      { key: "a", core: "Get", qualifiers: [{ prefix: "Documents" }] },
      { key: "b", core: "Get", qualifiers: [{ prefix: "Files" }] },
      { key: "c", core: "DocumentsGet", qualifiers: [{ prefix: "Other" }] },
      { key: "d", core: "Reserved" },
      { key: "e", core: "Reserved" },
    ]
    const names = allocateIdentifiers(requests, ["Reserved"])
    expect(new Set(names.values()).size).toBe(requests.length)
    expect(names.get("a")).not.toBe("DocumentsGet")
    expect(names.get("c")).not.toBe("DocumentsGet")
    expect([...names.values()]).not.toContain("Reserved")
    expect(names).toEqual(allocateIdentifiers([...requests].reverse(), ["Reserved"]))
  })
})
