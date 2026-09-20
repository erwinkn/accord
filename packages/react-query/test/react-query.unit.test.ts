// @vitest-environment happy-dom
import { createClient, defineApi, HttpError } from "@accord/client"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createElement, type PropsWithChildren } from "react"
import { describe, expect, it, vi } from "vitest"
import { api } from "../../../tests/generated/users.js"
import {
  AccordProvider,
  apiMutation,
  apiMutationKey,
  apiQuery,
  apiQueryKey,
  apiQueryResponse,
  useApi,
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
  it("keeps unified mutations idle until invoked, without creating a query cache entry", async () => {
    const { wrapper, fetchMock, queryClient } = setup()
    const hook = renderHook(() => useApi(api.users.createUser), { wrapper })
    try {
      expect(hook.result.current.isIdle).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      await act(async () => {
        expect(await hook.result.current.mutateAsync({ body: { name: "Alice" } })).toEqual({
          id: "7",
          name: "Alice",
        })
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST")
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    } finally {
      hook.unmount()
      queryClient.clear()
    }
  })
  it("updates unified bound queries when inputs change and shares normal query cache keys", async () => {
    const { wrapper, client, fetchMock, queryClient } = setup()
    const hook = renderHook(({ userId }) => useApi(client.users.getUser, { userId }), {
      wrapper,
      initialProps: { userId: "7" },
    })
    try {
      await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
      expect(hook.result.current.data).toEqual(user)
      hook.rerender({ userId: "8" })
      await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
      expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe("https://example.test/users/8")
      expect(queryClient.getQueryData(apiQueryKey(client.users.getUser, { userId: "8" }))).toEqual(
        user,
      )
      expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    } finally {
      hook.unmount()
      queryClient.clear()
    }
  })
  it("dispatches unified hooks by endpoint kind, including queries transported with POST", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(user))
    const endpoint = { ...api.users.getUser, method: "POST" as const }
    const context = { baseUrl: "https://example.test", fetch: fetchMock }
    const { wrapper, queryClient } = setup()
    const hook = renderHook(() => useApi({ endpoint, context }, { userId: "7" }), { wrapper })
    try {
      await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
      expect(hook.result.current.data).toEqual(user)
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST")
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    } finally {
      hook.unmount()
      queryClient.clear()
    }
  })
  it("preserves hook order and unsubscribes queries if a JavaScript caller changes endpoint kind", async () => {
    const { wrapper, fetchMock, queryClient } = setup()
    const hook = renderHook(({ endpoint }) => useApi(endpoint), {
      wrapper,
      initialProps: { endpoint: api.users.listUsers },
    })
    try {
      await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
      const calls = fetchMock.mock.calls.length
      // @ts-expect-error Exercise an untyped caller changing the endpoint kind between renders.
      hook.rerender({ endpoint: api.users.createUser })
      expect(hook.result.current).toHaveProperty("isIdle", true)
      expect(fetchMock).toHaveBeenCalledTimes(calls)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
      expect(queryClient.getQueryCache().getAll()[0]?.getObserversCount()).toBe(0)
      hook.rerender({ endpoint: api.users.listUsers })
      await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
      expect(queryClient.getQueryCache().getAll()[0]?.getObserversCount()).toBe(1)
    } finally {
      hook.unmount()
      queryClient.clear()
    }
  })
  it("exposes HTTP errors through unified query and mutation results", async () => {
    const client = createClient(api, {
      baseUrl: "https://example.test",
      fetch: async (_url, init) =>
        Response.json(
          { code: "rejected", message: "Request rejected" },
          { status: init?.method === "POST" ? 400 : 404 },
        ),
    })
    const { wrapper, queryClient } = setup()
    const hook = renderHook(
      () => ({
        query: useApi(client.users.getUser, { userId: "missing" }),
        mutation: useApi(client.users.createUser),
      }),
      { wrapper },
    )
    try {
      await waitFor(() => expect(hook.result.current.query.isError).toBe(true))
      expect(hook.result.current.query.error).toBeInstanceOf(HttpError)
      expect(hook.result.current.query.error).toMatchObject({
        status: 404,
        body: { code: "rejected" },
      })
      await act(async () => {
        await expect(
          hook.result.current.mutation.mutateAsync({ body: { name: "Alice" } }),
        ).rejects.toMatchObject({ status: 400, body: { code: "rejected" } })
      })
      await waitFor(() => expect(hook.result.current.mutation.isError).toBe(true))
      expect(hook.result.current.mutation.error).toBeInstanceOf(HttpError)
    } finally {
      hook.unmount()
      queryClient.clear()
    }
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

it("uses API-level identities for both detached endpoints and bound clients", () => {
  const original = apiQueryKey(api.users.getUser, { userId: "7" })
  const first = defineApi("first-api", api)
  const duplicate = defineApi("first-api", api)
  const second = defineApi("second-api", api)
  const firstKey = apiQueryKey(first.users.getUser, { userId: "7" })
  expect(firstKey.slice(0, 3)).toEqual(["first-api", "users", "{userId}"])
  expect(firstKey).toEqual(apiQueryKey(duplicate.users.getUser, { userId: "7" }))
  expect(firstKey).not.toEqual(apiQueryKey(second.users.getUser, { userId: "7" }))
  expect(firstKey).toEqual(apiQueryKey(createClient(first).users.getUser, { userId: "7" }))
  expect(apiQueryKey(api.users.getUser, { userId: "7" })).toEqual(original)
})

it("supports invalidating nested routes, a whole group or the entire SDK with readable prefixes", async () => {
  const sdk = defineApi("harbor", {
    ...api,
    documents: { ...api.users.getUser, path: "/users/{userId}/documents" },
    offerings: { ...api.users.listUsers, path: "/offerings" },
  })
  const other = defineApi("other-api", api)
  const client = new QueryClient()
  const userKeys = [
    apiQueryKey(sdk.users.getUser, { userId: "7" }),
    apiQueryKey(sdk.users.getUser, { userId: "8" }),
    apiQueryResponse(sdk.users.getUser, { userId: "7" }).queryKey,
    apiQueryKey(sdk.documents, { userId: "7" }),
  ]
  const listKey = apiQueryKey(sdk.users.listUsers, { limit: 20 })
  const offeringsKey = apiQueryKey(sdk.offerings)
  const otherKey = apiQueryKey(other.users.getUser, { userId: "7" })
  for (const key of [...userKeys, listKey, offeringsKey, otherKey])
    client.setQueryData(key, "cached")

  await client.invalidateQueries({
    queryKey: ["harbor", "users", "{userId}"],
    refetchType: "none",
  })
  for (const key of userKeys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  expect(client.getQueryState(listKey)?.isInvalidated).toBe(false)
  expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false)

  await client.invalidateQueries({ queryKey: ["harbor", "users"], refetchType: "none" })
  expect(client.getQueryState(listKey)?.isInvalidated).toBe(true)
  expect(client.getQueryState(offeringsKey)?.isInvalidated).toBe(false)
  await client.invalidateQueries({ queryKey: ["harbor"], refetchType: "none" })
  expect(client.getQueryState(offeringsKey)?.isInvalidated).toBe(true)
  expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false)

  // Mutations use the same prefix convention for TanStack's scoped defaults.
  client.setMutationDefaults(["harbor", "users"], { retry: 2 })
  expect(client.getMutationDefaults(apiMutationKey(sdk.users.createUser)).retry).toBe(2)
  expect(client.getMutationDefaults(apiMutationKey(other.users.createUser)).retry).toBeUndefined()
  client.clear()
})

it("keeps method, inputs, result mode and client context distinct without operation IDs", () => {
  const sdk = defineApi("harbor", {
    get: api.users.getUser,
    post: { ...api.users.getUser, method: "POST" as const },
    alias: { ...api.users.getUser, id: "readUser" },
  })
  const server = createClient(sdk, { baseUrl: "https://example.test" })
  const account = createClient(sdk, { cacheScope: "team-2" })
  const keys = [
    apiQueryKey(sdk.get, { userId: "7" }),
    apiQueryKey(sdk.post, { userId: "7" }),
    apiQueryKey(sdk.get, { userId: "8" }),
    apiQueryKey(sdk.get, { userId: "7" }, { headers: { accept: "text/plain" } }),
    apiQueryResponse(sdk.get, { userId: "7" }).queryKey,
    apiQueryKey(server.get, { userId: "7" }),
    apiQueryKey(account.get, { userId: "7" }),
  ]
  for (const key of keys) expect(key.slice(0, 3)).toEqual(["harbor", "users", "{userId}"])
  expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  expect(apiQueryKey(sdk.alias, { userId: "7" })).toEqual(keys[0])
})

it("preserves empty path segments and keeps request metadata out of path-prefix matching", () => {
  const sdk = defineApi("harbor", {
    root: { ...api.users.listUsers, path: "/" },
    list: api.users.listUsers,
    trailing: { ...api.users.listUsers, path: "/users/" },
    empty: { ...api.users.listUsers, path: "/users//documents" },
    nested: { ...api.users.listUsers, path: "/users/documents" },
    methodName: { ...api.users.listUsers, path: "/users/GET" },
  })
  const client = new QueryClient()
  const keys = Object.values(sdk).map((endpoint) => apiQueryKey(endpoint))
  expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  for (const key of keys) client.setQueryData(key, "cached")
  const matches = client.getQueryCache().findAll({ queryKey: ["harbor", "users", "GET"] })
  expect(matches).toHaveLength(1)
  expect(matches[0]?.queryKey).toEqual(apiQueryKey(sdk.methodName))
  client.clear()
})
