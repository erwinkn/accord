import { once } from "node:events"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { createClient, HttpError, type JsonValue } from "@accord/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { api } from "../generated/users.js"

interface CapturedRequest {
  readonly method: string
  readonly url: string
  readonly headers: Readonly<Record<string, string | string[] | undefined>>
  readonly body: string
}

const requests: CapturedRequest[] = []
const server = createServer(async (request, response) => {
  const body = await readBody(request)
  requests.push({
    method: request.method ?? "GET",
    url: request.url ?? "/",
    headers: request.headers,
    body,
  })
  route(request, response, body)
})

let baseUrl = ""

beforeAll(async () => {
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  if (!(address instanceof Object)) {
    throw new Error("Test server did not expose a port")
  }
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`
})

afterAll(async () => {
  server.close()
  await once(server, "close")
})

describe("OpenAPI -> generated API -> client -> HTTP server", () => {
  it("executes the first milestone end to end", async () => {
    requests.length = 0
    const http = createClient(api, {
      baseUrl,
      headers: { authorization: "Bearer integration-token" },
    })

    await expect(http.users.listUsers({ limit: 20 })).resolves.toEqual([
      { id: "1", name: "Alice", email: null },
    ])
    await expect(http.users.getUser({ userId: "a/b" })).resolves.toEqual({
      id: "a/b",
      name: "Erwin",
    })
    await expect(
      http.users.createUser({ body: { email: "alice@example.test", name: "Alice" } }),
    ).resolves.toEqual({ id: "2", name: "Alice", email: "alice@example.test" })

    expect(requests).toMatchObject([
      {
        method: "GET",
        url: "/api/v1/users?limit=20",
        headers: { authorization: "Bearer integration-token" },
        body: "",
      },
      {
        method: "GET",
        url: "/api/v1/users/a%2Fb",
        body: "",
      },
      {
        method: "POST",
        url: "/api/v1/users",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "alice@example.test", name: "Alice" }),
      },
    ])
  })

  it("throws a parsed, endpoint-aware HTTP error", async () => {
    const http = createClient(api, { baseUrl })
    const error = await http.users.getUser({ userId: "missing" }).catch((value) => value)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({
      status: 404,
      body: { code: "not_found", message: "User missing was not found" },
      endpoint: { plan: { operationId: "getUser" } },
    })
  })
})

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString("utf8")
}

function route(request: IncomingMessage, response: ServerResponse, body: string): void {
  const url = new URL(request.url ?? "/", "http://localhost")
  if (request.method === "GET" && url.pathname === "/api/v1/users") {
    expect(url.searchParams.get("limit")).toBe("20")
    json(response, 200, [{ id: "1", name: "Alice", email: null }])
    return
  }

  const userMatch = /^\/api\/v1\/users\/(.+)$/.exec(url.pathname)
  if (request.method === "GET" && userMatch) {
    const id = decodeURIComponent(userMatch[1] ?? "")
    if (id === "missing") {
      json(response, 404, { code: "not_found", message: `User ${id} was not found` })
    } else {
      json(response, 200, { id, name: "Erwin" })
    }
    return
  }

  if (request.method === "POST" && url.pathname === "/api/v1/users") {
    const input: { name: string; email?: string } = JSON.parse(body)
    json(response, 201, { id: "2", ...input })
    return
  }

  json(response, 404, { code: "unknown_route", message: "Unknown route" })
}

function json(response: ServerResponse, status: number, value: JsonValue): void {
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(value))
}
