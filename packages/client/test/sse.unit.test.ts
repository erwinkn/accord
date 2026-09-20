import { expect, it, vi } from "vitest"
import { z } from "zod"
import { api as streamingApi } from "../../../tests/generated/events.js"
import {
  createClient,
  DecodeError,
  defineEndpoint,
  HttpError,
  NetworkError,
  type RequestOptions,
  type SseEvent,
  type SseEventPlan,
  ValidationError,
} from "../src/index.js"

type Contract = {
  args: [input?: {}, options?: RequestOptions]
  input: {}
  response: AsyncIterable<SseEvent<unknown>>
  error: { message: string }
  responses: unknown
  fullResponse: { status: 200; data: AsyncIterable<SseEvent<unknown>>; headers: Headers }
}
function endpoint(events?: Readonly<Record<string, SseEventPlan>>) {
  return defineEndpoint<Contract, "query">({
    id: "watch",
    kind: "query",
    method: "GET",
    path: "/events",
    responses: {
      200: events ? { mediaType: "text/event-stream", events } : { mediaType: "text/event-stream" },
      401: { mediaType: "application/json" },
    },
  })
}
function connection(events?: Readonly<Record<string, SseEventPlan>>) {
  let controller: ReadableStreamDefaultController<Uint8Array>
  const cancel = vi.fn()
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value
    },
    cancel,
  })
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response(body, {
        headers: { "content-type": "text/event-stream; charset=utf-8" },
      }),
  )
  const client = createClient(
    { watch: endpoint(events) },
    {
      baseUrl: "https://example.test",
      token: "secret",
      fetch: fetcher,
    },
  )
  return {
    client,
    cancel,
    fetcher,
    body,
    send: (text: string) => controller.enqueue(new TextEncoder().encode(text)),
    finish: () => controller.close(),
    fail: (error: Error) => controller.error(error),
  }
}
async function collect<T>(events: AsyncIterable<T>) {
  const values: T[] = []
  for await (const event of events) values.push(event)
  return values
}

it("opens without buffering the body and uses existing auth and request headers", async () => {
  const stream = connection({ update: { mediaType: "application/json" } })
  const events = await stream.client.watch({}, { headers: { "last-event-id": "42" } })
  const headers = new Headers(stream.fetcher.mock.calls[0]?.[1]?.headers)
  expect(headers.get("authorization")).toBe("Bearer secret")
  expect(headers.get("last-event-id")).toBe("42")
  const iterator = events[Symbol.asyncIterator]()
  const first = iterator.next()
  stream.send('id: 43\nevent: update\ndata: {"amount":10}\n\n')
  expect((await first).value).toEqual({ id: "43", event: "update", data: { amount: 10 } })
  await iterator.return?.()
  expect(stream.cancel).toHaveBeenCalledOnce()
  expect(stream.body.locked).toBe(false)
})

it("supports generated POST streams with typed inputs, full responses and no replay", async () => {
  const fetcher = vi.fn<typeof fetch>(
    async () =>
      new Response("data: 0\n\ndata: 2\n\n", {
        headers: { "content-type": "text/event-stream", "x-request-id": "post-stream" },
      }),
  )
  const client = createClient(streamingApi, { baseUrl: "https://example.test", fetch: fetcher })
  const result = await client.jobs.runJob.withResponse({ prompt: "work" })
  expect(fetcher.mock.calls[0]?.[1]?.method).toBe("POST")
  expect(fetcher.mock.calls[0]?.[1]?.body).toBe('{"prompt":"work"}')
  expect(result.status).toBe(200)
  expect(result.headers.get("x-request-id")).toBe("post-stream")
  expect(await collect(result.data)).toEqual([
    { event: "message", id: "", data: 0 },
    { event: "message", id: "", data: 2 },
  ])
  expect(fetcher).toHaveBeenCalledOnce()
})

it("handles BOM, CR/LF boundaries, multiline data, empty data, sticky IDs and comments", async () => {
  const stream = connection()
  const events = await stream.client.watch()
  for (const chunk of [
    "\ufeff: keepalive\r",
    "\nid: one\r\nevent: named\r\ndata: first\r",
    "\ndata: second\r\nretry: 1500\r\n\r",
    "\ndata:\n\nid: invalid\0id\ndata: third\n\n",
    "id:\nretry: -1\ndata: reset\n\n",
    "data: discarded at EOF",
  ])
    stream.send(chunk)
  stream.finish()
  expect(await collect(events)).toEqual([
    { id: "one", event: "named", data: "first\nsecond", retry: 1500 },
    { id: "one", event: "message", data: "" },
    { id: "one", event: "message", data: "third" },
    { id: "", event: "message", data: "reset" },
  ])
  expect(stream.body.locked).toBe(false)
})

it("break closes the connection", async () => {
  const stream = connection()
  const events = await stream.client.watch()
  stream.send("data: first\n\ndata: unread\n\n")
  for await (const event of events) {
    expect(event.data).toBe("first")
    break
  }
  expect(stream.cancel).toHaveBeenCalledOnce()
})

it.each([false, true])(
  "abort cancels the body, including before iteration: %s",
  async (started) => {
    const stream = connection()
    const controller = new AbortController()
    const events = await stream.client.watch({}, { signal: controller.signal })
    const iterator = events[Symbol.asyncIterator]()
    const pending = started ? iterator.next() : undefined
    controller.abort()
    await expect(pending ?? iterator.next()).rejects.toMatchObject({ name: "AbortError" })
    expect(stream.cancel).toHaveBeenCalledOnce()
    expect(stream.body.locked).toBe(false)
  },
)

it("rejects HTTP failures before returning an iterable", async () => {
  const client = createClient(
    { watch: endpoint() },
    {
      baseUrl: "https://example.test",
      fetch: async () => Response.json({ message: "No token" }, { status: 401 }),
    },
  )
  await expect(client.watch()).rejects.toMatchObject({ status: 401, body: { message: "No token" } })
  await expect(client.watch()).rejects.toBeInstanceOf(HttpError)
})

it("rejects a wrong handshake content type and cancels its body", async () => {
  const cancel = vi.fn()
  const client = createClient(
    { watch: endpoint() },
    {
      baseUrl: "https://example.test",
      fetch: async () =>
        new Response(new ReadableStream({ cancel }), {
          headers: { "content-type": "application/json" },
        }),
    },
  )
  await expect(client.watch()).rejects.toBeInstanceOf(DecodeError)
  expect(cancel).toHaveBeenCalledOnce()
})

it.each([
  ["malformed JSON", "event: change\ndata: {broken}\n\n"],
  ["undeclared event", "event: other\ndata: {}\n\n"],
  ["oversized event", `data: ${"x".repeat(1024 * 1024)}\n\n`],
])("reports %s as a decoding failure and closes the stream", async (_label, text) => {
  const stream = connection({ change: { mediaType: "application/json" } })
  const events = await stream.client.watch()
  stream.send(text)
  await expect(collect(events)).rejects.toBeInstanceOf(DecodeError)
  expect(stream.cancel).toHaveBeenCalledOnce()
})

it("validates individual event payloads only when a schema was generated", async () => {
  const schema = z.object({ amount: z.number() })
  for (const validate of [true, false]) {
    const stream = connection({
      change: validate
        ? { mediaType: "application/json", schema }
        : { mediaType: "application/json" },
    })
    const events = await stream.client.watch()
    stream.send('event: change\ndata: {"amount":"wrong"}\n\n')
    stream.finish()
    if (validate) await expect(collect(events)).rejects.toBeInstanceOf(ValidationError)
    else expect((await collect(events))[0]?.data).toEqual({ amount: "wrong" })
  }
})

it("surfaces failed reads as network errors and treats a declared error event as data", async () => {
  const stream = connection({ error: { mediaType: "text/plain" } })
  const iterator = (await stream.client.watch())[Symbol.asyncIterator]()
  stream.send("event: error\ndata: domain warning\n\n")
  expect((await iterator.next()).value?.data).toBe("domain warning")
  const pending = iterator.next()
  stream.fail(new Error("Disconnected"))
  await expect(pending).rejects.toBeInstanceOf(NetworkError)
  expect(stream.body.locked).toBe(false)
})
