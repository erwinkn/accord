import { consumer, endpoint, references, responseDocument, stringSchema } from "./fixture.js"
import type { Fixture } from "./model.js"

export const queryCases: Fixture[] = [
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
