import { describe, expect, it } from "vitest"
import { compileApi } from "../src/compile.js"
import { AccordCodegenError } from "../src/diagnostics.js"
import { DocumentStore } from "../src/loader.js"
import type { AccordCodegenConfig, JsonValue } from "../src/types.js"

function compile(document: JsonValue, config: AccordCodegenConfig = {}) {
  return compileApi(new DocumentStore(document, "file:///fixture.json"), config).model
}

import type { JsonObject } from "../src/types.js"

const userSchema = {
  type: "object",
  required: ["id", "name"],
  properties: { id: { type: "string" }, name: { type: "string" } },
}

function document(paths: JsonObject, components: JsonObject = {}): JsonObject {
  return {
    openapi: "3.1.0",
    info: { title: "test", version: "1" },
    paths,
    components: { schemas: { User: userSchema, ...components } },
  }
}

describe("compile", () => {
  it("normalizes a typed vertical slice", () => {
    const api = compile(
      document({
        "/users": {
          get: {
            operationId: "listUsers",
            parameters: [{ in: "query", name: "limit", schema: { type: "integer" } }],
            responses: {
              200: {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
          },
          post: {
            operationId: "createUser",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name"],
                    properties: { name: { type: "string" } },
                  },
                },
              },
            },
            responses: { 201: { description: "created" } },
          },
        },
        "/users/{userId}": {
          get: {
            operationId: "getUser",
            parameters: [
              {
                in: "path",
                name: "userId",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "ok" }, 404: { description: "missing" } },
          },
        },
      }),
    )

    expect(api.operations.map((operation) => operation.exportPath)).toEqual([
      ["users", "listUsers"],
      ["users", "createUser"],
      ["users", "getUser"],
    ])
    expect(api.operations[0]?.plan.queryParams?.[0]).toEqual({ name: "limit" })
    expect(api.operations[1]?.plan.requestBody).toMatchObject({
      required: true,
      mode: "separate",
    })
    expect(api.operations[1]?.body?.fields).toEqual(["name"])
    expect(api.operations[2]?.plan.kind).toBe("query")
  })

  it("lets operation parameters override path-item parameters", () => {
    const api = compile(
      document({
        "/users/{id}": {
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              style: "simple",
              schema: { type: "string" },
            },
          ],
          get: {
            operationId: "getUser",
            parameters: [
              {
                in: "path",
                name: "id",
                required: true,
                style: "matrix",
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "ok" } },
          },
        },
      }),
    )
    expect(api.operations[0]?.parameters).toHaveLength(1)
    expect(api.operations[0]?.plan.pathParams?.[0]?.style).toBe("matrix")
  })

  it("supports path and tag namespaces with base path stripping", () => {
    const input = document({
      "/api/v1/users/{id}/posts": {
        get: {
          operationId: "listPosts",
          tags: ["Blog API"],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "ok" } },
        },
      },
    })
    expect(compile(input, { basePath: "/api/v1" }).operations[0]?.exportPath.slice(0, -1)).toEqual([
      "users",
      "posts",
    ])
    expect(compile(input, { namespace: "tag" }).operations[0]?.exportPath.slice(0, -1)).toEqual([
      "blogApi",
    ])
  })

  it("renames invalid parameter identifiers structurally", () => {
    const api = compile(
      document({
        "/organizations/{organization-id}": {
          get: {
            operationId: "getOrganization",
            parameters: [
              {
                in: "path",
                name: "organization-id",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "ok" } },
          },
        },
      }),
    )
    expect(api.operations[0]?.parameters[0]?.inputName).toBe("organizationId")
  })

  it("rejects duplicate operation IDs", () => {
    expect(() =>
      compile(
        document({
          "/a": { get: { operationId: "duplicate", responses: { 200: { description: "ok" } } } },
          "/b": { get: { operationId: "duplicate", responses: { 200: { description: "ok" } } } },
        }),
      ),
    ).toThrowError(/DUPLICATE_OPERATION_ID/)
  })

  it("rejects endpoint/namespace and sanitized-name collisions", () => {
    expect(() =>
      compile(
        document({
          "/users": {
            get: { "x-sdk-name": "posts", responses: { 200: { description: "ok" } } },
          },
          "/users/posts": {
            get: { operationId: "listPosts", responses: { 200: { description: "ok" } } },
          },
        }),
      ),
    ).toThrowError(/NAME_COLLISION/)

    expect(() =>
      compile(
        document({
          "/users/{user-id}": {
            get: {
              operationId: "getUser",
              parameters: [
                { in: "path", name: "user-id", required: true, schema: { type: "string" } },
                { in: "query", name: "user.id", schema: { type: "string" } },
              ],
              responses: { 200: { description: "ok" } },
            },
          },
        }),
      ),
    ).toThrowError(/INPUT_COLLISION/)
  })

  it("rejects merged body collisions and accepts separate mode", () => {
    const input = document({
      "/users/{id}": {
        patch: {
          operationId: "updateUser",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { id: { type: "string" }, name: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "ok" } },
        },
      },
    })
    expect(() => compile(input, { body: { mode: "merge" } })).toThrowError(/INPUT_COLLISION/)
    expect(compile(input, { body: { mode: "separate" } }).operations[0]?.body?.mode).toBe(
      "separate",
    )
  })

  it("requires object schemas for merged bodies", () => {
    const input = document({
      "/echo": {
        post: {
          operationId: "echo",
          requestBody: {
            content: { "text/plain": { schema: { type: "string" } } },
          },
          responses: { 200: { description: "ok" } },
        },
      },
    })
    expect(() => compile(input, { body: { mode: "merge" } })).toThrowError(
      /BODY_MERGE_REQUIRES_OBJECT/,
    )
    expect(compile(input, { body: { mode: "separate" } }).operations).toHaveLength(1)
  })

  it("resolves internal parameter, request body, and response references", () => {
    const input = {
      ...document({
        "/users/{id}": {
          post: {
            operationId: "replaceUser",
            parameters: [{ $ref: "#/components/parameters/UserId" }],
            requestBody: { $ref: "#/components/requestBodies/UserBody" },
            responses: { 200: { $ref: "#/components/responses/UserResponse" } },
          },
        },
      }),
      components: {
        schemas: { User: userSchema },
        parameters: {
          UserId: { in: "path", name: "id", required: true, schema: { type: "string" } },
        },
        requestBodies: {
          UserBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
        },
        responses: {
          UserResponse: {
            description: "ok",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
        },
      },
    }
    const operation = compile(input, { body: { mode: "separate" } }).operations[0]
    expect(operation?.body?.mode).toBe("separate")
    expect(operation?.parameters[0]?.name).toBe("id")
    expect(operation?.body?.fields).toEqual(["id", "name"])
    expect(operation?.plan.requestBody?.fields).toBeUndefined()
    expect(operation?.plan.responses).toEqual({ 200: { mediaType: "application/json" } })
  })

  it("returns structured diagnostics", () => {
    try {
      compile({ openapi: "2.0", paths: {} })
      throw new Error("expected compile to fail")
    } catch (cause) {
      expect(cause).toBeInstanceOf(AccordCodegenError)
      if (!(cause instanceof AccordCodegenError)) throw cause
      expect(cause.diagnostics[0]?.code).toBe("UNSUPPORTED_OPENAPI_VERSION")
    }
  })
})
