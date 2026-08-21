import { describe, expect, it } from "vitest"
import { AccordCodegenError } from "../src/diagnostics.js"
import { normalizeOpenApi } from "../src/normalize.js"

const userSchema = {
  type: "object",
  required: ["id", "name"],
  properties: { id: { type: "string" }, name: { type: "string" } },
}

function document(paths: Record<string, unknown>, components: Record<string, unknown> = {}) {
  return {
    openapi: "3.1.0",
    info: { title: "test", version: "1" },
    paths,
    components: { schemas: { User: userSchema, ...components } },
  }
}

describe("normalizeOpenApi", () => {
  it("normalizes a typed vertical slice", () => {
    const api = normalizeOpenApi(
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

    expect(
      api.operations.map((operation) => [...operation.namespace, operation.operationName]),
    ).toEqual([
      ["users", "listUsers"],
      ["users", "createUser"],
      ["users", "getUser"],
    ])
    expect(api.operations[0]?.parameters[0]).toMatchObject({
      name: "limit",
      inputName: "limit",
      in: "query",
      required: false,
      style: "form",
      explode: true,
    })
    expect(api.operations[1]?.requestBody).toMatchObject({
      required: true,
      contentType: "application/json",
      fields: ["name"],
    })
    expect(api.operations[2]?.operationKind).toBe("query")
  })

  it("lets operation parameters override path-item parameters", () => {
    const api = normalizeOpenApi(
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
    expect(api.operations[0]?.parameters[0]?.style).toBe("matrix")
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
    expect(normalizeOpenApi(input, { basePath: "/api/v1" }).operations[0]?.namespace).toEqual([
      "users",
      "posts",
    ])
    expect(normalizeOpenApi(input, { namespace: "tag" }).operations[0]?.namespace).toEqual([
      "blogApi",
    ])
  })

  it("renames invalid parameter identifiers structurally", () => {
    const api = normalizeOpenApi(
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
      normalizeOpenApi(
        document({
          "/a": { get: { operationId: "duplicate", responses: { 200: { description: "ok" } } } },
          "/b": { get: { operationId: "duplicate", responses: { 200: { description: "ok" } } } },
        }),
      ),
    ).toThrowError(/DUPLICATE_OPERATION_ID/)
  })

  it("rejects endpoint/namespace and sanitized-name collisions", () => {
    expect(() =>
      normalizeOpenApi(
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
      normalizeOpenApi(
        document({
          "/users/{user-id}": {
            get: {
              operationId: "getUser",
              parameters: [
                { in: "path", name: "user-id", required: true, schema: { type: "string" } },
                { in: "query", name: "user_id", schema: { type: "string" } },
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
    expect(() => normalizeOpenApi(input)).toThrowError(/INPUT_COLLISION/)
    expect(normalizeOpenApi(input, { body: { mode: "separate" } }).operations[0]?.bodyMode).toBe(
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
    expect(() => normalizeOpenApi(input)).toThrowError(/BODY_MERGE_REQUIRES_OBJECT/)
    expect(normalizeOpenApi(input, { body: { mode: "separate" } }).operations).toHaveLength(1)
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
    const operation = normalizeOpenApi(input).operations[0]
    expect(operation?.parameters[0]?.name).toBe("id")
    expect(operation?.requestBody?.fields).toEqual(["id", "name"])
    expect(operation?.responses[0]?.contentTypes).toEqual(["application/json"])
  })

  it("returns structured diagnostics", () => {
    try {
      normalizeOpenApi({ openapi: "2.0", paths: {} })
      throw new Error("expected normalizeOpenApi to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(AccordCodegenError)
      expect((error as AccordCodegenError).diagnostics[0]?.code).toBe("UNSUPPORTED_OPENAPI_VERSION")
    }
  })
})
