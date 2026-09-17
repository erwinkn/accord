import { createClient } from "@accord/client"
import { QueryClient } from "@tanstack/react-query"
import { api } from "../sdk/index.js"

// This intentionally public credential belongs to the in-memory demo, not a real account.
export const marketOptions = { baseUrl: window.location.origin, token: "accord-demo-token" }
export const marketClient = createClient(api, marketOptions)
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
})

export function money(amount: string, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function saveFile(data: BlobPart, filename: string, type = "application/octet-stream") {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
