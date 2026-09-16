// @vitest-environment happy-dom
import { createClient } from "@accord/client"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createElement, type PropsWithChildren } from "react"
import { describe, expect, it, vi } from "vitest"
import { api } from "../../../tests/generated/users.js"
import {
  AccordProvider,
  apiMutation,
  apiQuery,
  apiQueryKey,
  apiQueryResponse,
  useApiMutation,
  useApiQuery,
} from "../src/index.js"

const user = { id: "7", name: "Ada" }
function setup() {
  const fetchMock = vi.fn<typeof fetch>(async (_url, init) =>
    Response.json(init?.method === "POST" ? { ...user, ...JSON.parse(String(init.body)) } : user, {
      status: init?.method === "POST" ? 201 : 200,
    }),
  )
  const options = { baseUrl: "https://example.test", fetch: fetchMock }
  const client = createClient(api, options)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AccordProvider, { options }, children),
    )
  return { fetchMock, options, client, queryClient, wrapper }
}

describe("React Query integration", () => {
  it("executes bound queries and distinguishes the full-response cache", async () => {
    const { client, queryClient } = setup()
    expect(await queryClient.fetchQuery(apiQuery(client.users.getUser, { userId: "7" }))).toEqual(
      user,
    )
    const full = await queryClient.fetchQuery(
      apiQueryResponse(client.users.getUser, { userId: "7" }),
    )
    expect(full.data).toEqual(user)
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
  })
  it("executes query and mutation hooks using provider context", async () => {
    const { wrapper } = setup()
    const query = renderHook(() => useApiQuery(api.users.getUser, { userId: "7" }), { wrapper })
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true))
    expect(query.result.current.data).toEqual(user)
    const mutation = renderHook(() => useApiMutation(api.users.createUser), { wrapper })
    await act(async () => {
      expect(await mutation.result.current.mutateAsync({ body: { name: "Alice" } })).toEqual({
        id: "7",
        name: "Alice",
      })
    })
  })
  it("supports TanStack enabled and select options through normal option composition", async () => {
    const { client, fetchMock, wrapper } = setup()
    const disabled = renderHook(
      () => useQuery({ ...apiQuery(client.users.getUser, { userId: "7" }), enabled: false }),
      { wrapper },
    )
    expect(disabled.result.current.fetchStatus).toBe("idle")
    expect(fetchMock).not.toHaveBeenCalled()
    const selected = renderHook(
      () =>
        useQuery({
          ...apiQuery(client.users.getUser, { userId: "7" }),
          select: (value) => value.name,
        }),
      { wrapper },
    )
    await waitFor(() => expect(selected.result.current.data).toBe("Ada"))
  })
  it("does not place credential values in cache keys", () => {
    const { client } = setup()
    const key = apiQueryKey(
      client.users.getUser,
      { userId: "7" },
      { headers: { authorization: "Bearer secret-value" } },
    )
    expect(JSON.stringify(key)).not.toContain("secret-value")
  })
  it("offers mutation options that work outside hooks", async () => {
    const { client, queryClient } = setup()
    const mutation = queryClient
      .getMutationCache()
      .build(queryClient, apiMutation(client.users.createUser))
    expect(await mutation.execute({ body: { name: "Alice" } })).toEqual({ id: "7", name: "Alice" })
  })
})

it("isolates token/provider contexts without exposing secrets and keeps SDK scope stable", () => {
  const first = createClient(api, { token: "first-secret" })
  const second = createClient(api, { token: "second-secret" })
  const firstKey = apiQueryKey(first.users.getUser, { userId: "7" })
  const secondKey = apiQueryKey(second.users.getUser, { userId: "7" })
  expect(firstKey).not.toEqual(secondKey)
  expect(JSON.stringify([firstKey, secondKey])).not.toMatch(/first-secret|second-secret/)
  const provider = { apply: async () => {} }
  const third = createClient(api, { auth: provider })
  const fourth = createClient(api, { auth: provider, cacheScope: "other-account" })
  expect(apiQueryKey(third.users.getUser, { userId: "7" })).not.toEqual(
    apiQueryKey(fourth.users.getUser, { userId: "7" }),
  )
})
