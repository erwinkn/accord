import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { api } from "./sdk/index.js"
import { MarketProvider, useMarket } from "./sdk/react-query.js"

/** Pass a document ID returned by the upload workflow in usage.ts. */
export function MarketExample(props: { baseUrl: string; token: string; documentId: string }) {
  const [queryClient] = useState(() => new QueryClient())
  // Keep connection options stable so React Query can reuse cached requests.
  const options = useMemo(
    () => ({ baseUrl: props.baseUrl, token: props.token }),
    [props.baseUrl, props.token],
  )
  return (
    <QueryClientProvider client={queryClient}>
      <MarketProvider options={options}>
        <DocumentCard documentId={props.documentId} />
      </MarketProvider>
    </QueryClientProvider>
  )
}

export function DocumentCard({ documentId }: { documentId: string }) {
  const document = useMarket(api.documents.getDocument, { documentId })
  if (document.isPending) return <p>Loading document…</p>
  if (document.isError) return <p role="alert">{document.error.message}</p>
  return (
    <p>
      {document.data.filename} ({document.data.size} bytes)
    </p>
  )
}
