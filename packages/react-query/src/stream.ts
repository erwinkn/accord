import {
  type ArgumentsOf,
  createEndpointClient,
  type EndpointDefinition,
  isEventStream,
  type ResponseOf,
} from "@accord/client"
import { useCallback, useEffect, useRef, useState } from "react"
import type { BoundEndpoint } from "./index.js"

export interface StreamOptions<Event> {
  readonly enabled?: boolean
  readonly onEvent?: (event: Event) => void
}

export interface StreamResult<Event> {
  readonly latestEvent: Event | undefined
  readonly connectionState: "connecting" | "open" | "closed" | "error"
  readonly error: Error | null
  readonly close: () => void
}

type StreamArguments = readonly [
  input?: unknown,
  options?: ArgumentsOf<EndpointDefinition>[1] & StreamOptions<unknown>,
]

function openStream<E extends EndpointDefinition>(bound: BoundEndpoint<E>, args: ArgumentsOf<E>) {
  // SAFETY: the public hook has checked the endpoint's argument tuple; it only adds cancellation.
  const invoke = createEndpointClient(bound.endpoint, bound.context) as (
    ...args: ArgumentsOf<E>
  ) => Promise<ResponseOf<E>>
  return invoke(...args)
}

/** The hook owns one connection. Never put an iterator in TanStack's shared cache. */
export function useEventStream(
  bound: BoundEndpoint<EndpointDefinition>,
  args: StreamArguments,
  key: string | undefined,
): StreamResult<unknown> {
  const latest = useRef({ bound, args })
  const controller = useRef<AbortController | undefined>(undefined)
  const [state, setState] = useState<Omit<StreamResult<unknown>, "close">>({
    latestEvent: undefined,
    connectionState: "closed",
    error: null,
  })
  // Callbacks may change without reconnecting. Commit the latest arguments before opening a stream.
  useEffect(() => {
    latest.current = { bound, args }
  })
  const enabled = args[1]?.enabled !== false
  const callerSignal = args[1]?.signal
  useEffect(() => {
    if (key === undefined || !enabled) {
      setState({ latestEvent: undefined, connectionState: "closed", error: null })
      return
    }
    const abort = new AbortController()
    controller.current = abort
    let mounted = true
    const signal = callerSignal ? AbortSignal.any([callerSignal, abort.signal]) : abort.signal
    const closed = () => {
      if (mounted) setState((previous) => ({ ...previous, connectionState: "closed" }))
    }
    signal.addEventListener("abort", closed, { once: true })
    setState({
      latestEvent: undefined,
      connectionState: signal.aborted ? "closed" : "connecting",
      error: null,
    })
    async function consume() {
      const { bound: current, args: call } = latest.current
      try {
        signal.throwIfAborted()
        // SAFETY: the caller supplies a key only for query endpoints whose successful response is an SSE stream.
        const events = (await openStream(current, [
          call[0],
          { ...call[1], signal },
        ])) as AsyncIterable<unknown>
        if (!mounted || signal.aborted) return
        setState((previous) => ({ ...previous, connectionState: "open" }))
        for await (const event of events) {
          if (!mounted || signal.aborted) break
          setState((previous) => ({ ...previous, latestEvent: event }))
          latest.current.args[1]?.onEvent?.(event)
        }
        closed()
      } catch (error) {
        if (!mounted || signal.aborted) return
        setState((previous) => ({
          ...previous,
          connectionState: "error",
          error: error instanceof Error ? error : new Error("Stream failed", { cause: error }),
        }))
      }
    }
    void consume()
    return () => {
      mounted = false
      signal.removeEventListener("abort", closed)
      abort.abort()
      controller.current = undefined
    }
  }, [key, enabled, callerSignal])
  const close = useCallback(() => controller.current?.abort(), [])
  return { ...state, close }
}

export function hasStreamResponse(endpoint: EndpointDefinition): boolean {
  return Object.entries(endpoint.responses).some(
    ([status, response]) =>
      (status.startsWith("2") || status === "default") &&
      (Array.isArray(response) ? response : [response]).some((media) =>
        isEventStream(media.mediaType),
      ),
  )
}

export function isStreamResponse(endpoint: EndpointDefinition): boolean {
  return (
    endpoint.resultMode !== "status" &&
    hasStreamResponse(endpoint) &&
    Object.entries(endpoint.responses).every(
      ([status, response]) =>
        !(status.startsWith("2") || status === "default") ||
        (Array.isArray(response) ? response : [response]).every((media) =>
          isEventStream(media.mediaType),
        ),
    )
  )
}
