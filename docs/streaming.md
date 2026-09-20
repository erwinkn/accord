# Server-sent events

Streaming describes the response, independently of whether an endpoint is a query or mutation. Accord uses Fetch and an async generator, so streams support the same authentication, request bodies, headers and middleware as ordinary calls.

## Describe the events

In OpenAPI 3.0/3.1, declare a `text/event-stream` response and add the operation-level `x-accord-sse` extension. Each entry describes the decoded **data of one event**; the SSE framing is handled by the client.

```yaml
get:
  operationId: watchEvents
  x-accord-sse:
    events:
      changed:
        mediaType: application/json
        schema:
          type: object
          additionalProperties: false
          required: [id, amount]
          properties:
            id: { type: string }
            amount: { type: number }
      notice:
        mediaType: text/plain
        schema: { type: string }
  responses:
    '200':
      description: Live changes
      content:
        text/event-stream:
          schema: { type: string }
```

This generates `AsyncIterable<SseEvent<Change, "changed"> | SseEvent<string, "notice">>` (the actual object type's name follows ordinary naming rules). Each event has `event`, `data`, `id`, and optional `retry` in milliseconds. Unnamed SSE messages use the name `"message"`; declare that entry for a stream without explicit `event:` fields. `id` follows SSE's last-event-ID rules and starts as an empty string.

The generated endpoint remains declarative:

```ts
responses: {
  200: {
    mediaType: "text/event-stream",
    events: {
      changed: { mediaType: "application/json", schema: WatchEventsChangedSchema },
      notice: { mediaType: "text/plain", schema: WatchEventsNoticeSchema },
    },
  },
}
```

Schema entries appear only when a validation adapter is enabled. The adapter generates normal schemas for event payloads; no library validates an iterable or a complete buffered response. Read/write projections and referenced DTOs use the same semantic model as ordinary responses.

Without `x-accord-sse`, the client yields `SseEvent<string>` and preserves arbitrary event names. It does not guess whether text is JSON. With an explicit event map, an undeclared name is a `DecodeError`; this preserves the generated union. Event payloads currently support `application/json` and `text/plain` only; text remains a string. Unsupported contracts fail generation. OpenAPI 3.2 streaming keywords are not implemented by this extension.

## Consume and cancel

```ts
const abort = new AbortController()
const events = await client.offerings.watchOffering(
  { offeringId },
  { signal: abort.signal },
)
try {
  for await (const event of events) {
    if (event.event === "subscription.created") {
      console.log(event.data.amount) // payload narrowed by event name
      break
    }
  }
} finally {
  abort.abort()
}
```

The initial promise rejects HTTP/handshake failures before returning the iterable. Iteration can throw `NetworkError`, `DecodeError`, or `ValidationError`. A named event called `"error"` is ordinary data if declared; it is distinct from a failed connection.

Breaking, throwing from the loop, or reaching EOF releases the reader and closes the connection. An abort signal also interrupts a pending read, including when iteration has not started. Each returned iterable is single-use: consume it or abort it, rather than leaving an opened response unused. `.withResponse()` exposes status, headers and the stream in `data`; the underlying Fetch body belongs to that stream and must not also be read separately.

The parser handles UTF-8 split across chunks, LF/CR/CRLF, comments, multiline data and IDs. It discards an unterminated event at EOF, as the SSE protocol requires. It limits each event block to 1 MiB of decoded text (JavaScript code units); oversized blocks fail decoding. It reads on consumer demand and retains no event history.

## React

```tsx
const live = useMarket(api.offerings.watchOffering, { offeringId }, {
  enabled: true,
  onEvent(event) {
    if (event.event === "subscription.created") {
      void queryClient.invalidateQueries({ queryKey: ["market", "api", "v1", "offerings"] })
    }
  },
})
// live.connectionState: "connecting" | "open" | "closed" | "error"
// live.latestEvent: the typed event union | undefined
// live.error: Error | null
// live.close(): explicitly disconnect
```

Use the usual SDK provider and `QueryClientProvider`. Each hook owns one connection; connections are not shared across components. Equivalent input/header objects and changing callbacks do not reconnect. Changing the request identity, disabling the hook, changing the signal, or unmounting cancels the previous connection. `onEvent` is synchronous and runs for every event; do not rely on renders or `latestEvent` to observe every event in a rapid burst. The hook keeps no history and performs no automatic cache updates.

Finite-query helpers (`marketQuery`, `marketQueryResponse`, `useApiQuery`) reject streams to avoid caching an exhausted iterator. Query endpoints mixing streamed and finite successes, or returning status-wrapped streams, should be consumed directly through the SDK. Streaming mutations remain mutations: `mutateAsync(input)` returns the iterable, which the caller owns. Use the direct SDK or `marketMutationCall` when a POST stream needs per-call cancellation options.

There is **no automatic reconnection or replay**. Clean EOF closes the hook; failures set its error state. To reconnect, toggle `enabled` off and on, or issue another SDK call. A server with replay support can accept `headers: { "last-event-id": lastId }`; Accord preserves IDs and exposes `retry` but does not implement replay, deduplication, or delivery guarantees. Never retry a side-effecting POST without the API's own idempotency contract.

The [Nest live feed](../examples/nest-market/src/offerings/offerings.controller.ts) emits connected/heartbeat events and actual offering, subscription and document changes. It has no event log, so it deliberately does not offer replay. The [React component](../examples/nest-market/web/live-events.tsx) keeps the latest 20 activity items and offers pause/resume.
