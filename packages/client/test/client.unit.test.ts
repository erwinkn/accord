import { describe, expect, it, vi } from "vitest"
import {
  createClient,
  HttpError,
  type EndpointDescriptor,
  type EndpointTypes,
} from "../src/index.js"

type User = { id: string; name: string }

type UserEndpointTypes = {
  path: { userId: string }
  query: { includePosts?: boolean }
  headers: { "x-request-id"?: string }
  cookies: {}
  body: never
  bodyRequired: false
  response: User
  error: { status: 404; body: { message: string } }
  responses: { 200: User; 404: { message: string } }
}

type CreateEndpointTypes = {
  path: {}
  query: {}
  headers: {}
  cookies: {}
  body: { name: string; email?: string }
  bodyRequired: true
  response: User
  error: never
  responses: { 201: User }
}

const getUser = {
  kind: "endpoint",
  method: "GET",
  path: "/users/{userId}",
  operationId: "getUser",
  operationKind: "query",
  bodyMode: "merge",
  parameters: [
    {
      name: "userId",
      in: "path",
      required: true,
      style: "simple",
      explode: false,
      allowReserved: false,
    },
    {
      name: "includePosts",
      in: "query",
      required: false,
      style: "form",
      explode: true,
      allowReserved: false,
    },
    {
      name: "x-request-id",
      in: "header",
      required: false,
      style: "simple",
      explode: false,
      allowReserved: false,
    },
  ],
  responses: [
    { status: 200, contentTypes: ["application/json"] },
    { status: 404, contentTypes: ["application/json"] },
  ],
} as EndpointDescriptor<UserEndpointTypes, "merge", "query">

const createUser = {
  kind: "endpoint",
  method: "POST",
  path: "/users",
  operationId: "createUser",
  operationKind: "mutation",
  bodyMode: "merge",
  parameters: [],
  requestBody: {
    required: true,
    contentType: "application/json",
    contentTypes: ["application/json"],
    fields: ["name", "email"],
  },
  responses: [{ status: 201, contentTypes: ["application/json"] }],
} as EndpointDescriptor<CreateEndpointTypes, "merge", "mutation">

const api = { users: { getUser, createUser } }

describe("createClient", () => {
  it("maps endpoint trees and sends normalized requests", async () => {
    const fetchMock = vi.fn<typeof fetch>(async request => {
      const url = request instanceof Request ? request.url : String(request)
      return new Response(JSON.stringify({ id: url.split("/").at(-1), name: "Erwin" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    })

    const client = createClient(api, {
      baseUrl: "https://example.test/api/v1",
      fetch: fetchMock,
      headers: { authorization: "Bearer token" },
    })

    await expect(
      client.users.getUser(
        { userId: "a/b", includePosts: true, "x-request-id": "request-1" },
        { headers: { "x-extra": "yes" } },
      ),
    ).resolves.toEqual({ id: "a%2Fb?includePosts=true", name: "Erwin" })

    const [requestUrl, init] = fetchMock.mock.calls[0] ?? []
    expect(String(requestUrl)).toBe("https://example.test/api/v1/users/a%2Fb?includePosts=true")
    const headers = new Headers(init?.headers)
    expect(headers.get("authorization")).toBe("Bearer token")
    expect(headers.get("x-request-id")).toBe("request-1")
    expect(headers.get("x-extra")).toBe("yes")
  })

  it("reconstructs a merged JSON request body", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_request, init) => {
      expect(init?.method).toBe("POST")
      expect(new Headers(init?.headers).get("content-type")).toBe("application/json")
      expect(init?.body).toBe(JSON.stringify({ name: "Alice", email: "alice@example.test" }))
      return new Response(JSON.stringify({ id: "1", name: "Alice" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    })

    const client = createClient(api, { baseUrl: "https://example.test", fetch: fetchMock })
    await expect(
      client.users.createUser({ name: "Alice", email: "alice@example.test" }),
    ).resolves.toEqual({ id: "1", name: "Alice" })
  })

  it("throws a parsed HttpError for non-2xx responses", async () => {
    const client = createClient(api, {
      baseUrl: "https://example.test",
      fetch: async () =>
        new Response(JSON.stringify({ message: "missing" }), {
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
        }),
    })

    const error = await client.users.getUser({ userId: "missing" }).catch(value => value)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ status: 404, body: { message: "missing" } })
  })

  it("supports request/response middleware and AbortSignal", async () => {
    const controller = new AbortController()
    const client = createClient(api, {
      baseUrl: "https://example.test",
      requestMiddleware: [context => ({ ...context, url: new URL("/rewritten", context.url) })],
      responseMiddleware: [context =>
        new Response(JSON.stringify({ id: "middleware", name: "Changed" }), {
          status: context.response.status,
          headers: { "content-type": "application/json" },
        }),
      ],
      fetch: async (request, init) => {
        expect(String(request)).toBe("https://example.test/rewritten")
        expect(init?.signal).toBe(controller.signal)
        return new Response(JSON.stringify({ id: "original", name: "Original" }), {
          headers: { "content-type": "application/json" },
        })
      },
    })

    await expect(client.users.getUser({ userId: "1" }, { signal: controller.signal })).resolves.toEqual(
      { id: "middleware", name: "Changed" },
    )
  })
})

const _endpointTypesSatisfyConstraint: EndpointTypes = {
  path: {},
  query: {},
  headers: {},
  cookies: {},
  body: undefined,
  bodyRequired: false,
  response: undefined,
  error: undefined,
  responses: {},
}
void _endpointTypesSatisfyConstraint
