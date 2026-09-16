import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ApiKeyAuth,
  type AuthProvider,
  type AuthRequest,
  BasicAuth,
  BearerAuth,
  CustomAuth,
  createClient,
  defineEndpoint,
  type EndpointContract,
  OAuthClientCredentialsAuth,
} from "../src/index.js"

function api() {
  return {
    get: defineEndpoint<EndpointContract>({
      id: "get",
      kind: "query",
      method: "GET",
      path: "/resource",
      responses: { 200: { mediaType: "application/json" } },
    }),
  }
}
function context(): AuthRequest {
  return {
    endpoint: api().get,
    url: new URL("https://api.test/resource"),
    baseUrl: "https://api.test/",
    headers: new Headers(),
    init: {},
  }
}
afterEach(() => vi.restoreAllMocks())
describe("client authentication", () => {
  it("resolves token callbacks per request and honors explicit header overrides", async () => {
    let token = "first"
    const callback = vi.fn(async () => token)
    const headers: Headers[] = []
    const client = createClient(api(), {
      token: callback,
      fetch: async (_url, init) => {
        headers.push(new Headers(init?.headers))
        return Response.json({})
      },
    })
    await client.get()
    token = "second"
    await client.get()
    await client.get({}, { headers: { authorization: "Custom override" } })
    expect(headers.map((value) => value.get("authorization"))).toEqual([
      "Bearer first",
      "Bearer second",
      "Custom override",
    ])
    expect(callback).toHaveBeenCalledTimes(3)
  })
  it("skips configured authentication only when the call opts out", async () => {
    const token = vi.fn(async () => "secret")
    const apply = vi.fn()
    for (const options of [{ token }, { auth: CustomAuth(apply) }]) {
      const client = createClient(api(), {
        ...options,
        fetch: async (_url, init) => {
          expect(new Headers(init?.headers).get("authorization")).toBe("Explicit header")
          return Response.json({})
        },
      })
      await client.get({}, { auth: false, headers: { authorization: "Explicit header" } })
    }
    expect(token).not.toHaveBeenCalled()
    expect(apply).not.toHaveBeenCalled()
  })
  it("applies every provider in order with explicit API-key placement", async () => {
    const last = vi.fn((request: AuthRequest) => {
      expect(request.url.searchParams.get("api_key")).toBe("a+b")
      expect(request.headers.get("authorization")).toBe(`Basic ${btoa("user:pass")}`)
      request.headers.set("x-custom", "last")
    })
    await createClient(api(), {
      auth: [
        ApiKeyAuth("a+b", { in: "query", name: "api_key" }),
        BasicAuth("user", "pass"),
        CustomAuth(last),
      ],
      fetch: async (url, init) => {
        expect(new URL(String(url)).searchParams.get("api_key")).toBe("a+b")
        expect(new Headers(init?.headers).get("x-custom")).toBe("last")
        return Response.json({})
      },
    }).get()
    expect(last).toHaveBeenCalledOnce()
  })
  it("supports custom providers and fails before fetch on provider errors", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}))
    const client = createClient(api(), {
      auth: CustomAuth(async (request) => {
        expect(request.endpoint.id).toBe("get")
        throw new Error("token unavailable")
      }),
      fetch,
    })
    await expect(client.get()).rejects.toThrow("token unavailable")
    expect(fetch).not.toHaveBeenCalled()
    const request = context()
    await BearerAuth(async () => undefined).apply(request)
    expect(request.headers.has("authorization")).toBe(false)
  })
})
describe("OAuth client credentials", () => {
  it("shares acquisition, caches until expiry, and isolates provider configurations", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(100_000)
    const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
      expect(init?.redirect).toBe("error")
      expect(new Headers(init?.headers).get("authorization")).toBe(
        `Basic ${btoa("client%3Aid:secret+value")}`,
      )
      expect(new URLSearchParams(String(init?.body)).get("grant_type")).toBe("client_credentials")
      return Response.json({
        access_token: `token${fetch.mock.calls.length}`,
        token_type: "Bearer",
        expires_in: 100,
      })
    })
    const auth = OAuthClientCredentialsAuth({
      clientId: "client:id",
      clientSecret: "secret value",
      tokenUrl: "https://auth.test/token",
      scopes: ["read"],
      fetch,
    })
    const requests = Array.from({ length: 10 }, () => context())
    await Promise.all(requests.map((request) => auth.apply(request)))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(
      requests.every((request) => request.headers.get("authorization") === "Bearer token1"),
    ).toBe(true)
    await auth.apply(context())
    expect(fetch).toHaveBeenCalledTimes(1)
    const writer = OAuthClientCredentialsAuth({
      clientId: "client:id",
      clientSecret: "secret value",
      tokenUrl: "https://auth.test/token",
      scopes: ["write"],
      fetch,
    })
    await writer.apply(context())
    expect(new URLSearchParams(String(fetch.mock.calls[0]![1]?.body)).get("scope")).toBe("read")
    expect(new URLSearchParams(String(fetch.mock.calls[1]![1]?.body)).get("scope")).toBe("write")
    expect(fetch).toHaveBeenCalledTimes(2)
    now.mockReturnValue(191_000)
    await auth.apply(context())
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it("resolves an explicit relative token URL and retries after acquisition failure", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response("private detail", { status: 503 }))
      .mockResolvedValue(
        Response.json({ access_token: "new", token_type: "bearer", expires_in: 300 }),
      )
    const auth = OAuthClientCredentialsAuth({
      clientId: "id",
      clientSecret: "secret",
      tokenUrl: "/oauth/token",
      scopes: ["read"],
      authentication: "client_secret_post",
      fetch,
    })
    const request = context()
    await expect(auth.apply(request)).rejects.toThrow("HTTP 503")
    await auth.apply(request)
    expect(String(fetch.mock.calls[1]![0])).toBe("https://api.test/oauth/token")
    expect(new URLSearchParams(String(fetch.mock.calls[1]![1]?.body)).get("scope")).toBe("read")
    expect(new URLSearchParams(String(fetch.mock.calls[1]![1]?.body)).get("client_secret")).toBe(
      "secret",
    )
    expect(request.headers.get("authorization")).toBe("Bearer new")
  })
  it("rejects malformed token responses and does not cache tokens without an expiry", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "x", token_type: "mac" }))
      .mockImplementation(async () => Response.json({ access_token: "x", token_type: "bearer" }))
    const auth: AuthProvider = OAuthClientCredentialsAuth({
      clientId: "id",
      clientSecret: "secret",
      tokenUrl: "https://auth.test/token",
      fetch,
    })
    await expect(auth.apply(context())).rejects.toThrow("invalid bearer-token")
    await auth.apply(context())
    await auth.apply(context())
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})

it("explicit auth configuration takes precedence over the token shortcut", async () => {
  const token = vi.fn(async () => "unused")
  const headers: Headers[] = []
  for (const auth of [BearerAuth("explicit"), []])
    await createClient(api(), {
      token,
      auth,
      fetch: async (_url, init) => {
        headers.push(new Headers(init?.headers))
        return Response.json({})
      },
    }).get()
  expect(token).not.toHaveBeenCalled()
  expect(headers.map((header) => header.get("authorization"))).toEqual(["Bearer explicit", null])
})
