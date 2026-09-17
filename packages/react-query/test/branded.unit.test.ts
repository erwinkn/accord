// @vitest-environment happy-dom
import { type ClientOptions, createClient } from "@accord/client"
import { createQueryHooks } from "@accord/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createElement, type PropsWithChildren } from "react"
import { expect, it, vi } from "vitest"
import { type DocumentDto, api as marketApi } from "../../../examples/nest-market/sdk/index.js"
import {
  MarketProvider,
  marketQueryKey,
  useMarket,
  useMarketMutation,
} from "../../../examples/nest-market/sdk/react-query.js"
import { api } from "../../../tests/generated/users.js"

const document: DocumentDto = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  offeringId: "3fa85f64-5717-4562-b3fc-2c963f66afa7",
  filename: "terms.pdf",
  category: "terms",
  size: 42,
}
const billing = createQueryHooks()

it("executes generated hooks with isolated SDK providers, inferred mutations and branded cache keys", async () => {
  const marketFetch = vi.fn<typeof fetch>(async (_url, init) =>
    init?.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json(document),
  )
  const billingFetch = vi.fn<typeof fetch>(async () => Response.json({ id: "7", name: "Ada" }))
  const marketOptions: ClientOptions = {
    baseUrl: "https://market.test",
    token: "market-secret",
    fetch: marketFetch,
  }
  const billingOptions: ClientOptions = {
    baseUrl: "https://billing.test",
    token: "billing-secret",
    fetch: billingFetch,
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MarketProvider,
        { options: marketOptions },
        createElement(billing.Provider, { options: billingOptions }, children),
      ),
    )
  const hook = renderHook(
    () => ({
      document: useMarket(
        marketApi.documents.getDocument,
        { documentId: document.id },
        {
          headers: { "x-request-id": "branded" },
        },
      ),
      user: billing.useQuery(api.users.getUser, { userId: "7" }),
      remove: useMarketMutation(marketApi.documents.deleteDocument),
    }),
    { wrapper },
  )
  try {
    await waitFor(() => expect(hook.result.current.document.isSuccess).toBe(true))
    await waitFor(() => expect(hook.result.current.user.isSuccess).toBe(true))
    expect(hook.result.current.document.data).toEqual(document)
    expect(hook.result.current.user.data?.name).toBe("Ada")
    expect(String(marketFetch.mock.calls[0]?.[0])).toBe(
      `https://market.test/api/v1/documents/${document.id}`,
    )
    expect(String(billingFetch.mock.calls[0]?.[0])).toBe("https://billing.test/users/7")
    const marketHeaders = new Headers(marketFetch.mock.calls[0]?.[1]?.headers)
    expect(marketHeaders.get("authorization")).toBe("Bearer market-secret")
    expect(marketHeaders.get("x-request-id")).toBe("branded")
    expect(new Headers(billingFetch.mock.calls[0]?.[1]?.headers).get("authorization")).toBe(
      "Bearer billing-secret",
    )
    const key = marketQueryKey(
      createClient(marketApi, marketOptions).documents.getDocument,
      { documentId: document.id },
      { headers: { "x-request-id": "branded" } },
    )
    expect(key.slice(0, 5)).toEqual(["market", "api", "v1", "documents", "{documentId}"])
    expect(queryClient.getQueryData(key)).toEqual(document)
    expect(
      JSON.stringify(
        queryClient
          .getQueryCache()
          .getAll()
          .map((item) => item.queryKey),
      ),
    ).not.toMatch(/market-secret|billing-secret/)
    await act(async () => {
      await hook.result.current.remove.mutateAsync({ documentId: document.id })
    })
    expect(marketFetch.mock.calls.at(-1)?.[1]?.method).toBe("DELETE")
  } finally {
    hook.unmount()
    queryClient.clear()
  }
})

it("lets a bound client override the generated provider's connection", async () => {
  const providerFetch = vi.fn<typeof fetch>()
  const boundFetch = vi.fn<typeof fetch>(async () => Response.json(document))
  const client = createClient(marketApi, { baseUrl: "https://bound.test", fetch: boundFetch })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MarketProvider,
        { options: { baseUrl: "https://provider.test", fetch: providerFetch } },
        children,
      ),
    )
  const hook = renderHook(
    () => useMarket(client.documents.getDocument, { documentId: document.id }),
    { wrapper },
  )
  try {
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(providerFetch).not.toHaveBeenCalled()
    expect(String(boundFetch.mock.calls[0]?.[0])).toBe(
      `https://bound.test/api/v1/documents/${document.id}`,
    )
  } finally {
    hook.unmount()
    queryClient.clear()
  }
})
