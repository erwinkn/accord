import { describe, expect, it, vi } from "vitest"
import {
  createClient,
  DecodeError,
  defineEndpoint,
  HttpError,
  type HttpResult,
  NetworkError,
  type RequestOptions,
} from "../src/index.js"

type User = { id: string; name: string }
type GetInput = { userId: string; includePosts?: boolean; "x-request-id"?: string }
type CreateInput = { name: string; email?: string }
type Contract<I> = {
  args: [input: I, options?: RequestOptions]
  input: I
  response: User
  error: { message: string }
  responses: { 200: User; 404: { message: string } }
  fullResponse: HttpResult<200, User>
}
const base = {
  apiId: "unit",
  servers: [],
  security: [],
  securitySchemes: {},
  resultMode: "payload",
} as const
const json = {
  mediaType: "application/json",
  representation: { key: "json", codec: { kind: "json" } },
} as const
const getUser = defineEndpoint<Contract<GetInput>, "query">({
  kind: "endpoint",
  plan: {
    ...base,
    method: "GET",
    path: "/users/{userId}",
    operationId: "getUser",
    operationKind: "query",
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
      { status: 200, content: [json], headers: [] },
      { status: 404, content: [json], headers: [] },
    ],
  },
})
const createUser = defineEndpoint<Contract<CreateInput>, "mutation">({
  kind: "endpoint",
  plan: {
    ...base,
    method: "POST",
    path: "/users",
    operationId: "createUser",
    operationKind: "mutation",
    parameters: [],
    requestBody: {
      required: true,
      defaultMediaType: "application/json",
      content: [json],
      mode: "merge",
      fields: ["name", "email"],
    },
    responses: [{ status: 201, content: [json], headers: [] }],
  },
})
const api = { users: { getUser, createUser } }

describe("createClient", () => {
  it("maps endpoint trees and sends normalized requests", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (request) => {
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

    const error = await client.users.getUser({ userId: "missing" }).catch((value) => value)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ status: 404, body: { message: "missing" } })
  })

  it("supports request/response middleware and AbortSignal", async () => {
    const controller = new AbortController()
    const client = createClient(api, {
      baseUrl: "https://example.test",
      requestMiddleware: [(context) => ({ ...context, url: new URL("/rewritten", context.url) })],
      responseMiddleware: [
        (context) =>
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

    await expect(
      client.users.getUser({ userId: "1" }, { signal: controller.signal }),
    ).resolves.toEqual({ id: "middleware", name: "Changed" })
  })
})

describe("response boundaries", () => {
  it("retains HTTP status when the error body cannot be decoded", async () => {
    const call = createClient(api, {
      fetch: async () =>
        new Response("broken json", {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
    }).users.getUser
    await expect(call({ userId: "1" })).rejects.toMatchObject({
      status: 404,
      cause: expect.any(DecodeError),
    })
  })
  it("rejects an undeclared success media type instead of skipping a generated validator", async () => {
    const call = createClient(api, {
      fetch: async () => new Response("not JSON", { headers: { "content-type": "text/plain" } }),
    }).users.getUser
    await expect(call({ userId: "1" })).rejects.toBeInstanceOf(DecodeError)
  })
  it("preserves transport failures separately from HTTP failures", async () => {
    const cause = new TypeError("offline")
    const call = createClient(api, {
      fetch: async () => {
        throw cause
      },
    }).users.getUser
    await expect(call({ userId: "1" })).rejects.toMatchObject({ cause })
    await expect(call({ userId: "1" })).rejects.toBeInstanceOf(NetworkError)
  })
  it("passes the original input object to middleware without validating or rebuilding it", async () => {
    const input = { userId: "1", includePosts: true }
    const http = createClient(api, {
      requestMiddleware: [
        (context) => {
          expect(context.input).toBe(input)
        },
      ],
      fetch: async () => Response.json({ id: "1", name: "Ada" }),
    })
    const full = await http.users.getUser.withResponse(input)
    expect(full.data).toEqual({ id: "1", name: "Ada" })
    expect(full.response.bodyUsed).toBe(true)
  })
})
