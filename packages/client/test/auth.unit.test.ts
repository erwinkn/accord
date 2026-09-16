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
  type SecurityRequirement,
  type SecurityScheme,
} from "../src/index.js"

function api(
  security: readonly SecurityRequirement[] = [{ bearer: [] }],
  securitySchemes: Readonly<Record<string, SecurityScheme>> = {
    bearer: { type: "http", scheme: "bearer" },
  },
) {
  return {
    get: defineEndpoint<EndpointContract>({
      id: "get",
      kind: "query",
      method: "GET",
      path: "/resource",
      security,
      securitySchemes,
      responses: [{ status: 200, content: [{ mediaType: "application/json" }] }],
    }),
  }
}
function context(scopes: readonly string[] = []): AuthRequest {
  return {
    endpoint: api().get,
    url: new URL("https://api.test/resource"),
    baseUrl: "https://api.test/",
    headers: new Headers(),
    init: {},
    scopes,
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
  it("does not acquire or send tokens for public/anonymous endpoints", async () => {
    const token = vi.fn(async () => "secret")
    for (const security of [[], [{}]])
      await createClient(api(security), {
        token,
        fetch: async (_url, init) => {
          expect(new Headers(init?.headers).has("authorization")).toBe(false)
          return Response.json({})
        },
      }).get()
    expect(token).not.toHaveBeenCalled()
  })
  it("selects a complete OR alternative and applies all of its AND providers", async () => {
    const skipped = vi.fn()
    const definitions = api(
      [
        { missing: [], key: [] },
        { key: [], basic: [] },
      ],
      {
        missing: { type: "http", scheme: "bearer" },
        key: { type: "apiKey", in: "query", name: "api_key" },
        basic: { type: "http", scheme: "basic" },
      },
    )
    await createClient(definitions, {
      auth: {
        key: ApiKeyAuth("a+b"),
        basic: BasicAuth("user", "pass"),
        unused: CustomAuth(skipped),
      },
      fetch: async (url, init) => {
        expect(new URL(String(url)).searchParams.get("api_key")).toBe("a+b")
        expect(new Headers(init?.headers).get("authorization")).toBe(`Basic ${btoa("user:pass")}`)
        return Response.json({})
      },
    }).get()
    expect(skipped).not.toHaveBeenCalled()
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
  it("shares acquisition, caches until expiry, and separates scope sets", async () => {
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
      fetch,
    })
    const requests = Array.from({ length: 10 }, () => context(["read"]))
    await Promise.all(requests.map((request) => auth.apply(request)))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(
      requests.every((request) => request.headers.get("authorization") === "Bearer token1"),
    ).toBe(true)
    await auth.apply(context(["read"]))
    expect(fetch).toHaveBeenCalledTimes(1)
    await auth.apply(context(["write"]))
    expect(fetch).toHaveBeenCalledTimes(2)
    now.mockReturnValue(191_000)
    await auth.apply(context(["read"]))
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it("derives token URL and required scopes from metadata and retries after acquisition failure", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response("private detail", { status: 503 }))
      .mockResolvedValue(
        Response.json({ access_token: "new", token_type: "bearer", expires_in: 300 }),
      )
    const auth = OAuthClientCredentialsAuth({
      clientId: "id",
      clientSecret: "secret",
      authentication: "client_secret_post",
      fetch,
    })
    const request: AuthRequest = {
      ...context(["read"]),
      scheme: { type: "oauth2", clientCredentials: { tokenUrl: "/oauth/token", scopes: ["read"] } },
    }
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

it("leaves mutual TLS credentials to the configured Fetch transport", async () => {
  const secured = api([{ certificate: [] }], { certificate: { type: "mutualTLS" } })
  await createClient(secured, {
    credentials: { certificate: "transport-owned" },
    fetch: async (_url, init) => {
      expect(new Headers(init?.headers).has("authorization")).toBe(false)
      return Response.json({})
    },
  }).get()
})
