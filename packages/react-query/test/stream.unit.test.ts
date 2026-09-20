// @vitest-environment happy-dom
import { type ClientOptions, NetworkError } from "@accord/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createElement, type PropsWithChildren, StrictMode } from "react"
import { expect, it, vi } from "vitest"
import { api } from "../../../tests/generated/events.js"
import { AccordProvider, apiQuery, useApi } from "../src/index.js"

function setup() {
  const connections: {
    send: (text: string) => void
    cancel: ReturnType<typeof vi.fn>
    fail: () => void
    finish: () => void
  }[] = []
  const fetcher = vi.fn<typeof fetch>(async () => {
    let controller: ReadableStreamDefaultController<Uint8Array>
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value
      },
      cancel,
    })
    connections.push({
      cancel,
      send: (text) => controller.enqueue(new TextEncoder().encode(text)),
      fail: () => controller.error(new Error("Disconnected")),
      finish: () => controller.close(),
    })
    return new Response(body, { headers: { "content-type": "text/event-stream" } })
  })
  const options: ClientOptions = {
    baseUrl: "https://example.test",
    token: "secret",
    fetch: fetcher,
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) =>
    createElement(
      StrictMode,
      {},
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(AccordProvider, { options }, children),
      ),
    )
  return { connections, fetcher, queryClient, wrapper }
}

it("the unified hook delivers typed events, keeps callbacks fresh, and closes on input changes and unmount", async () => {
  const setupResult = setup()
  const { connections, fetcher, queryClient, wrapper } = setupResult
  const received = vi.fn()
  const replacement = vi.fn()
  const hook = renderHook(
    ({ channel, callback }) =>
      useApi(
        api.events.watchEvents,
        { channel },
        {
          onEvent: callback,
        },
      ),
    { wrapper, initialProps: { channel: "first", callback: received } },
  )
  try {
    await waitFor(() => expect(hook.result.current.connectionState).toBe("open"))
    // StrictMode's discarded connection must already be cancelled.
    expect(
      connections.slice(0, -1).every((connection) => connection.cancel.mock.calls.length === 1),
    ).toBe(true)
    const first = connections.at(-1)!
    await act(async () => first.send('event: changed\nid: 1\ndata: {"id":"a","amount":3}\n\n'))
    expect(hook.result.current.latestEvent).toEqual({
      event: "changed",
      id: "1",
      data: { id: "a", amount: 3 },
    })
    expect(received).toHaveBeenCalledOnce()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    const count = fetcher.mock.calls.length
    hook.rerender({ channel: "first", callback: replacement })
    await act(async () => first.send("event: notice\ndata: hello\n\n"))
    expect(replacement).toHaveBeenCalledOnce()
    expect(received).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls.length).toBe(count)
    hook.rerender({ channel: "second", callback: replacement })
    await waitFor(() => expect(fetcher.mock.calls.length).toBe(count + 1))
    await waitFor(() => expect(hook.result.current.connectionState).toBe("open"))
    expect(first.cancel).toHaveBeenCalledOnce()
    expect(hook.result.current.latestEvent).toBeUndefined()
  } finally {
    hook.unmount()
    queryClient.clear()
  }
  await waitFor(() =>
    expect(connections.every((connection) => connection.cancel.mock.calls.length === 1)).toBe(true),
  )
})

it("supports pause, resume and explicit close without automatic reconnection", async () => {
  const { connections, fetcher, queryClient, wrapper } = setup()
  const hook = renderHook(
    ({ enabled }) => useApi(api.events.watchEvents, { channel: "orders" }, { enabled }),
    {
      wrapper,
      initialProps: { enabled: false },
    },
  )
  try {
    expect(fetcher).not.toHaveBeenCalled()
    expect(hook.result.current.connectionState).toBe("closed")
    hook.rerender({ enabled: true })
    await waitFor(() => expect(hook.result.current.connectionState).toBe("open"))
    act(() => hook.result.current.close())
    await waitFor(() => expect(connections[0]?.cancel).toHaveBeenCalledOnce())
    expect(hook.result.current.connectionState).toBe("closed")
    hook.rerender({ enabled: true })
    expect(fetcher).toHaveBeenCalledOnce()
    hook.rerender({ enabled: false })
    hook.rerender({ enabled: true })
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    await act(async () => connections.at(-1)!.fail())
    await waitFor(() => expect(hook.result.current.connectionState).toBe("error"))
    expect(hook.result.current.error).toBeInstanceOf(NetworkError)
    hook.rerender({ enabled: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  } finally {
    hook.unmount()
    queryClient.clear()
  }
})

it("honors caller cancellation and reports clean EOF as closed", async () => {
  for (const abort of [true, false]) {
    const { connections, queryClient, wrapper } = setup()
    const controller = new AbortController()
    const hook = renderHook(
      () => useApi(api.events.watchEvents, { channel: "orders" }, { signal: controller.signal }),
      { wrapper },
    )
    try {
      await waitFor(() => expect(hook.result.current.connectionState).toBe("open"))
      await act(async () => {
        if (abort) controller.abort()
        else connections.at(-1)!.finish()
      })
      await waitFor(() => expect(hook.result.current.connectionState).toBe("closed"))
      expect(hook.result.current.error).toBeNull()
    } finally {
      hook.unmount()
      queryClient.clear()
    }
  }
})

it("rejects streaming query options at runtime as well as at the type boundary", () => {
  // @ts-expect-error exercising an untyped caller
  expect(() => apiQuery(api.events.watchEvents, { channel: "orders" })).toThrow("streaming")
})
