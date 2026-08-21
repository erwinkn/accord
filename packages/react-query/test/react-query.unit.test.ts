// @vitest-environment happy-dom

import type { EndpointDescriptor } from "@accord/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createElement, type PropsWithChildren } from "react"
import { describe, expect, it, vi } from "vitest"
import {
  apiMutation,
  apiMutationKey,
  apiQuery,
  apiQueryKey,
  useApiMutation,
  useApiQuery,
} from "../src/index.js"

type User = { id: string; name: string }
type GetUserTypes = {
  path: { userId: string }
  query: { include?: readonly string[] }
  headers: {}
  cookies: {}
  body: never
  bodyRequired: false
  response: User
  error: { message: string }
  responses: { 200: User; 404: { message: string } }
}
type CreateUserTypes = {
  path: {}
  query: {}
  headers: {}
  cookies: {}
  body: { name: string }
  bodyRequired: true
  response: User
  error: { message: string }
  responses: { 201: User; 400: { message: string } }
}

const getUser = {
  kind: "endpoint",
  method: "GET",
  path: "/users/{userId}",
  operationId: "getUser",
  operationKind: "query",
  bodyMode: "merge",
  parameters: [
    {
      name: "userId",
      in: "path",
      required: true,
      style: "simple",
      explode: false,
      allowReserved: false,
    },
    {
      name: "include",
      in: "query",
      required: false,
      style: "form",
      explode: true,
      allowReserved: false,
    },
  ],
  responses: [{ status: 200, contentTypes: ["application/json"] }],
} as EndpointDescriptor<GetUserTypes, "merge", "query">

const createUser = {
  kind: "endpoint",
  method: "POST",
  path: "/users",
  operationId: "createUser",
  operationKind: "mutation",
  bodyMode: "merge",
  parameters: [],
  requestBody: {
    required: true,
    contentType: "application/json",
    contentTypes: ["application/json"],
    fields: ["name"],
  },
  responses: [{ status: 201, contentTypes: ["application/json"] }],
} as EndpointDescriptor<CreateUserTypes, "merge", "mutation">

describe("React Query adapter", () => {
  it("builds stable endpoint-scoped query and mutation keys", () => {
    expect(apiQueryKey(getUser, { userId: "1", include: ["posts", "teams"] })).toEqual([
      "accord",
      "GET",
      "/users/{userId}",
      "getUser",
      { include: ["posts", "teams"], userId: "1" },
    ])
    expect(apiQueryKey(getUser, { include: ["posts"], userId: "1" })).toEqual(
      apiQueryKey(getUser, { userId: "1", include: ["posts"] }),
    )
    expect(apiMutationKey(createUser)).toEqual([
      "accord",
      "POST",
      "/users",
      "createUser",
    ])
  })

  it("does not collide when unrelated APIs reuse an operationId", () => {
    const secondEndpoint = {
      ...getUser,
      path: "/accounts/{userId}",
    } as EndpointDescriptor<GetUserTypes, "merge", "query">

    expect(apiQueryKey(secondEndpoint, { userId: "1" })).not.toEqual(
      apiQueryKey(getUser, { userId: "1" }),
    )
  })

  it("works with QueryClient prefetch and cache APIs", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (request) => {
      const url = new URL(String(request))
      return new Response(JSON.stringify({ id: url.pathname.split("/").at(-1), name: "Erwin" }), {
        headers: { "content-type": "application/json" },
      })
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const options = apiQuery(
      getUser,
      { userId: "42" },
      {
        clientOptions: { baseUrl: "https://example.test", fetch: fetchMock },
      },
    )

    await client.prefetchQuery(options)
    expect(client.getQueryData(options.queryKey)).toEqual({ id: "42", name: "Erwin" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("propagates TanStack Query cancellation to fetch", async () => {
    let observedSignal: AbortSignal | undefined
    const fetchMock = vi.fn<typeof fetch>(async (_request, init) => {
      observedSignal = init?.signal ?? undefined
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true })
      })
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const options = apiQuery(
      getUser,
      { userId: "slow" },
      {
        clientOptions: { baseUrl: "https://example.test", fetch: fetchMock },
      },
    )

    const pending = client.fetchQuery(options)
    await waitFor(() => expect(observedSignal).toBeDefined())
    await client.cancelQueries({ queryKey: options.queryKey })
    await expect(pending).rejects.toBeDefined()
    expect(observedSignal?.aborted).toBe(true)
  })

  it("executes explicit query and mutation hooks", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (request, init) => {
      const url = new URL(String(request))
      if (init?.method === "POST") {
        const input = JSON.parse(String(init.body)) as { name: string }
        return new Response(JSON.stringify({ id: "created", ...input }), {
          status: 201,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ id: url.pathname.split("/").at(-1), name: "Erwin" }), {
        headers: { "content-type": "application/json" },
      })
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client }, children)
    const clientOptions = { baseUrl: "https://example.test", fetch: fetchMock }

    const query = renderHook(() => useApiQuery(getUser, { userId: "7" }, { clientOptions }), {
      wrapper,
    })
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true))
    expect(query.result.current.data).toEqual({ id: "7", name: "Erwin" })

    const mutation = renderHook(() => useApiMutation(createUser, { clientOptions }), { wrapper })
    let created: User | undefined
    await act(async () => {
      created = await mutation.result.current.mutateAsync({ name: "Alice" })
    })
    expect(created).toEqual({ id: "created", name: "Alice" })
    await waitFor(() => {
      expect(mutation.result.current.data).toEqual({ id: "created", name: "Alice" })
    })
  })

  it("passes disabled query options through without executing", () => {
    const fetchMock = vi.fn<typeof fetch>()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client }, children)
    const result = renderHook(
      () =>
        useApiQuery(
          getUser,
          { userId: "disabled" },
          {
            enabled: false,
            clientOptions: { baseUrl: "https://example.test", fetch: fetchMock },
          },
        ),
      { wrapper },
    )
    expect(result.result.current.fetchStatus).toBe("idle")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("exposes reusable mutation options", async () => {
    const options = apiMutation(createUser, {
      clientOptions: {
        baseUrl: "https://example.test",
        fetch: async () =>
          new Response(JSON.stringify({ id: "1", name: "Alice" }), {
            status: 201,
            headers: { "content-type": "application/json" },
          }),
      },
    })
    expect(options.mutationKey).toEqual(["accord", "POST", "/users", "createUser"])
    await expect(options.mutationFn?.({ name: "Alice" })).resolves.toEqual({
      id: "1",
      name: "Alice",
    })
  })
})
