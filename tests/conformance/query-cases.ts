import {
  consumer,
  document,
  endpoint,
  references,
  responseDocument,
  stringSchema,
} from "./fixture.js"
import type { Fixture } from "./model.js"

export const queryCases: Fixture[] = [
  {
    id: "query.auth-routing-and-redaction",
    title:
      "Shared auth metadata preserves alternatives, explicit URLs, overrides, and private query keys",
    area: "query",
    reference: references.accord,
    document: {
      ...document(
        {
          "/probe": {
            get: {
              operationId: "call",
              parameters: [
                { name: "token", in: "query", schema: stringSchema },
                { name: "X-Key", in: "header", schema: stringSchema },
                { name: "session", in: "cookie", schema: stringSchema },
              ],
              responses: { "204": { description: "OK" } },
            },
          },
          "/other": {
            get: {
              operationId: "otherCall",
              "x-sdk-name": "call",
              responses: { "204": { description: "OK" } },
            },
          },
          "/public": {
            get: {
              operationId: "publicCall",
              "x-sdk-name": "call",
              security: [],
              responses: { "204": { description: "OK" } },
            },
          },
          "/optional": {
            get: {
              operationId: "optionalCall",
              "x-sdk-name": "call",
              security: [{}, { bearer: [] }],
              responses: { "204": { description: "OK" } },
            },
          },
        },
        {
          securitySchemes: {
            bearer: { type: "http", scheme: "bearer" },
            queryKey: { type: "apiKey", in: "query", name: "token" },
            headerKey: { type: "apiKey", in: "header", name: "x-key" },
            basic: { type: "http", scheme: "basic" },
            unused: { type: "apiKey", in: "header", name: "x-unused-key" },
          },
        },
      ),
      servers: [{ url: "https://unused.example.test/wrong" }],
      security: [{ bearer: [], queryKey: [], headerKey: [] }, { basic: [] }],
    },
    consumer: {
      source: consumer(`export async function run() {
        assert.equal(api.probe.call.securitySchemes, api.other.call.securitySchemes)
        assert.equal(api.public.call.security, undefined)
        const anonymousKey = JSON.stringify(apiQueryKey(api.public.call, {}, { headers: { "x-unused-key": "unused-header-secret" } }))
        assert.equal(anonymousKey.includes("unused-header-secret"), false)
        const input = { token: "input-query-secret", xKey: "input-header-secret", session: "input-cookie-secret" }
        const key = JSON.stringify(apiQueryKey(api.probe.call, input))
        for (const secret of Object.values(input)) assert.equal(key.includes(secret), false)
        assert.notDeepEqual(apiQueryKey(api.probe.call, input), apiQueryKey(api.probe.call, { ...input, token: "another-secret" }))
        await withServer(async (baseUrl, requests) => {
          const credentials = { bearer: "access-token", queryKey: "query-secret", headerKey: "header-secret" }
          const client = createClient(api, { baseUrl, credentials })
          await client.probe.call({})
          assert.equal(requests[0]?.url, "/base/probe?token=query-secret")
          assert.equal(requests[0]?.headers.authorization, "Bearer access-token")
          assert.equal(requests[0]?.headers["x-key"], "header-secret")
          const scopedKey = JSON.stringify(apiQueryKey(client.probe.call, {}))
          for (const secret of Object.values(credentials)) assert.equal(scopedKey.includes(secret), false)
          await client.probe.call({}, { headers: { authorization: "Custom override" } })
          assert.equal(requests[1]?.headers.authorization, "Custom override")
          await client.public.call()
          await client.optional.call()
          for (const index of [2, 3]) {
            assert.equal(requests[index]?.headers.authorization, undefined)
            assert.equal(requests[index]?.headers["x-key"], undefined)
            assert.equal(requests[index]?.url.includes("token="), false)
          }
          await createClient(api, { baseUrl, credentials: { bearer: "incomplete" } }).probe.call({})
          assert.equal(requests[4]?.headers.authorization, undefined)
          await createClient(api, { baseUrl, credentials: { basic: { username: "u", password: "p" } } }).probe.call({})
          assert.equal(requests[5]?.headers.authorization, "Basic dTpw")
        })
      }`),
    },
  },

  {
    id: "query.options-execution",
    title: "Query option builders use the generated endpoint against the configured transport",
    area: "query",
    reference: references.accord,
    document: responseDocument(stringSchema, "text/plain"),
    consumer: {
      source: consumer(`export async function run() {
      const queryClient = new QueryClient()
      try {
        await withServer(async (baseUrl, requests) => {
          const options = { ...apiQuery(createClient(api, { baseUrl }).probe.call, {}), staleTime: Infinity }
          assert.equal(await queryClient.fetchQuery(options), "OK")
          assert.equal(await queryClient.fetchQuery(options), "OK")
          assert.equal(requests.length, 1, "ACCORD_QUERY_DEDUPLICATION")
        }, { status: 200, headers: { "content-type": "text/plain" }, body: "OK" })
      } finally { queryClient.clear() }
    }`),
    },
  },
  {
    id: "query.context-isolation",
    title: "Different server contexts never reuse one another's fresh cached results",
    area: "query",
    reference: references.query,
    document: responseDocument(stringSchema, "text/plain"),
    consumer: {
      source: consumer(`export async function run() {
      const queryClient = new QueryClient()
      try {
        await withServer(async baseA => {
          await withServer(async baseB => {
            const first = await queryClient.fetchQuery({ ...apiQuery(createClient(api, { baseUrl: baseA }).probe.call, {}), staleTime: Infinity })
            const second = await queryClient.fetchQuery({ ...apiQuery(createClient(api, { baseUrl: baseB }).probe.call, {}), staleTime: Infinity })
            assert.equal(first, "TENANT_A")
            assert.equal(second, "TENANT_B", "ACCORD_CACHE_SCOPE")
          }, { status: 200, headers: { "content-type": "text/plain" }, body: "TENANT_B" })
        }, { status: 200, headers: { "content-type": "text/plain" }, body: "TENANT_A" })
      } finally { queryClient.clear() }
    }`),
    },
  },
  {
    id: "query.key-canonicalization",
    title: "Object key insertion order and absent optional inputs do not split cache identity",
    area: "query",
    reference: references.query,
    document: endpoint({
      parameters: [
        { name: "a", in: "query", schema: stringSchema },
        { name: "b", in: "query", schema: stringSchema },
      ],
    }),
    consumer: {
      source: consumer(`export async function run() {
      assert.deepEqual(apiQueryKey(api.probe.call, { a: "a", b: "b" }), apiQueryKey(api.probe.call, { b: "b", a: "a" }), "ACCORD_CANONICAL_KEY")
      assert.notDeepEqual(apiQueryKey(api.probe.call, { a: "a" }), apiQueryKey(api.probe.call, { a: "b" }))
    }`),
    },
  },
  {
    id: "query.cancellation",
    title: "Query cancellation propagates an AbortSignal to the actual fetch implementation",
    area: "query",
    reference: references.accord,
    document: endpoint(),
    consumer: {
      source: consumer(`export async function run() {
      const queryClient = new QueryClient()
      let resolveStarted!: () => void
      const started = new Promise<void>(resolve => { resolveStarted = resolve })
      let observed: AbortSignal | null | undefined
      const fetcher: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
        observed = init?.signal
        observed?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
        resolveStarted()
      })
      try {
        const pending = queryClient.fetchQuery({ ...apiQuery(createClient(api, { fetch: fetcher }).probe.call, {}), retry: false })
        const handled = pending.catch(() => undefined)
        await started
        await queryClient.cancelQueries()
        await handled
        assert.equal(observed?.aborted, true, "ACCORD_QUERY_CANCELLATION")
      } finally { queryClient.clear() }
    }`),
    },
  },
]
