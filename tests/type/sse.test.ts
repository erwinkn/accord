import { createClient, type SseEvent } from "@accord/client"
import { apiQuery, apiQueryResponse, useApi, useApiQuery } from "@accord/react-query"
import { api, type Change } from "../generated/events.js"

const client = createClient(api)
const response: Promise<AsyncIterable<SseEvent<Change, "changed"> | SseEvent<string, "notice">>> =
  client.events.watchEvents({ channel: "orders" })
void response
// @ts-expect-error a path parameter is required
client.events.watchEvents()
// @ts-expect-error the event channel is a string
client.events.watchEvents({ channel: 5 })

const stream = useApi(
  api.events.watchEvents,
  { channel: "orders" },
  {
    headers: { "last-event-id": "42" },
    onEvent(event) {
      if (event.event === "changed") {
        const amount: number = event.data.amount
        void amount
        // @ts-expect-error this event carries an object, not a string
        event.data.toUpperCase()
      } else {
        const text: string = event.data
        void text
        // @ts-expect-error notice data has no amount field
        event.data.amount
      }
    },
  },
)
stream.close()
const state: "connecting" | "open" | "closed" | "error" = stream.connectionState
void state
// @ts-expect-error streaming queries do not expose finite query results
stream.data
// @ts-expect-error required stream input remains required
useApi(api.events.watchEvents)
// @ts-expect-error path types remain enforced
useApi(api.events.watchEvents, { channel: 5 })
// @ts-expect-error extra input keys are rejected
useApi(api.events.watchEvents, { channel: "orders", extra: true })
const invalid = { channel: "orders", extra: true }
// @ts-expect-error extra keys are also rejected outside object literals
useApi(api.events.watchEvents, invalid)
// @ts-expect-error media selectors must use lowercase content-type
useApi(
  api.events.watchEvents,
  { channel: "orders" },
  { headers: { "Content-Type": "application/json" } },
)
declare const opaqueHeaders: Readonly<Record<string, string>>
// @ts-expect-error opaque headers cannot establish a safe media/input relationship
useApi(api.events.watchEvents, { channel: "orders" }, { headers: opaqueHeaders })
// @ts-expect-error callback receives the named-event union
useApi(api.events.watchEvents, { channel: "orders" }, { onEvent: (event: number) => void event })
// @ts-expect-error streams must not be cached as finite query data
apiQuery(api.events.watchEvents, { channel: "orders" })
// @ts-expect-error full responses containing streams must not be cached either
apiQueryResponse(api.events.watchEvents, { channel: "orders" })
// @ts-expect-error the legacy query hook only accepts finite responses
useApiQuery(api.events.watchEvents, { channel: "orders" })
// @ts-expect-error a status envelope containing a stream cannot be cached as finite query data
apiQuery(api.optionalStream.optionalStream)
// @ts-expect-error mixed finite/streaming results are consumed explicitly through the SDK
useApi(api.optionalStream.optionalStream)

async function consumeMixedResponse() {
  const mixed = await client.optionalStream.optionalStream()
  if (mixed.status === 200) {
    for await (const event of mixed.data) {
      const text: string = event.data
      void text
    }
  } else {
    const jobId: string = mixed.data.jobId
    void jobId
  }
}
void consumeMixedResponse

useApi(client.events.watchEvents, { channel: "orders" }, { enabled: false })
const raw = useApi(api.raw.watchRaw)
const data: string | undefined = raw.latestEvent?.data
void data
const mutation = useApi(api.jobs.runJob)
const generated: Promise<AsyncIterable<SseEvent<number, "message">>> = mutation.mutateAsync({
  prompt: "work",
})
void generated
// @ts-expect-error a streaming mutation still takes its input at mutate time
useApi(api.jobs.runJob, { prompt: "work" })
