import { DecodeError, NetworkError, ValidationError } from "./errors.js"
import type { EndpointDefinition, SseEvent, SseEventPlan } from "./types.js"

/** Bound incomplete messages without collecting an unbounded response body. */
const MAX_EVENT_SIZE = 1024 * 1024

class EventParser {
  private line = ""
  private skipLf = false
  private size = 0
  private data: string[] = []
  private event = ""
  private id = ""
  private retry: number | undefined;

  *push(text: string): Generator<SseEvent, void, unknown> {
    for (const character of text) {
      if (this.skipLf) {
        this.skipLf = false
        if (character === "\n") continue
      }
      this.size += character.length
      if (this.size > MAX_EVENT_SIZE) throw new RangeError("SSE event exceeds 1 MiB of text")
      if (character !== "\n" && character !== "\r") {
        this.line += character
        continue
      }
      this.skipLf = character === "\r"
      const line = this.line
      this.line = ""
      if (!line) {
        const message = this.data.length
          ? { event: this.event || "message", data: this.data.join("\n"), id: this.id }
          : undefined
        this.data = []
        this.event = ""
        this.size = 0
        const retry = this.retry
        this.retry = undefined
        if (message) yield retry === undefined ? message : { ...message, retry }
        continue
      }
      const colon = line.indexOf(":")
      const field = colon < 0 ? line : line.slice(0, colon)
      let value = colon < 0 ? "" : line.slice(colon + 1)
      if (value.startsWith(" ")) value = value.slice(1)
      if (field === "data") this.data.push(value)
      else if (field === "event") this.event = value
      else if (field === "id" && !value.includes("\0")) this.id = value
      else if (field === "retry" && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)))
        this.retry = Number(value)
    }
  }
}

/** One consumer, incremental reads, no retries or event accumulation. */
export function decodeEventStream(
  response: Response,
  endpoint: EndpointDefinition,
  events: Readonly<Record<string, SseEventPlan>> | undefined,
  signal?: AbortSignal | null,
): AsyncIterable<SseEvent<unknown>> {
  const body = response.body
  if (!body) throw new DecodeError(response, endpoint, new TypeError("Missing SSE response body"))
  const stream = body
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  const abort = () => {
    // A custom fetch may not connect its response body to the supplied signal.
    // Cancellation also closes a response that has not yet been iterated.
    void (reader ? reader.cancel() : body.cancel()).catch(() => {})
  }
  signal?.addEventListener("abort", abort, { once: true })
  if (signal?.aborted) abort()

  async function* iterate(): AsyncGenerator<SseEvent<unknown>, void, unknown> {
    const parser = new EventParser()
    const decoder = new TextDecoder()
    try {
      reader = stream.getReader()
      while (true) {
        signal?.throwIfAborted()
        let chunk: ReadableStreamReadResult<Uint8Array>
        try {
          chunk = await reader.read()
        } catch (cause) {
          signal?.throwIfAborted()
          throw new NetworkError(endpoint, cause)
        }
        signal?.throwIfAborted()
        try {
          const text = decoder.decode(chunk.value, { stream: !chunk.done })
          for (const message of parser.push(text)) {
            const plan =
              events && (Object.hasOwn(events, message.event) ? events[message.event] : undefined)
            if (events && !plan) throw new TypeError(`Undeclared SSE event ${message.event}`)
            // JSON decoding is transport parsing; optional schemas validate the decoded value.
            const data: unknown =
              plan?.mediaType === "application/json" ? JSON.parse(message.data) : message.data
            if (plan?.schema) {
              const validation = await plan.schema["~standard"].validate(data)
              if (validation.issues)
                throw new ValidationError(validation.issues, response, endpoint)
            }
            signal?.throwIfAborted()
            yield { ...message, data }
          }
        } catch (cause) {
          signal?.throwIfAborted()
          if (cause instanceof ValidationError) throw cause
          throw new DecodeError(response, endpoint, cause)
        }
        // The SSE protocol discards an incomplete event at EOF.
        if (chunk.done) return
      }
    } finally {
      signal?.removeEventListener("abort", abort)
      // Preserve the original error if an already-failed response cannot be cancelled again.
      await reader?.cancel().catch(() => {})
      reader?.releaseLock()
    }
  }
  return iterate()
}
