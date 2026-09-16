import { createClient } from "@accord/client"
import { apiQuery } from "@accord/react-query"
import { api, Get200Schema } from "./sdk.js"

export const tasks = createClient(api, {
  baseUrl: "https://tasks.example.test/v1",
  token: "replace-with-your-access-token",
  cacheScope: "team-42",
})
export async function workflow() {
  const created = await tasks.tasks.create({ title: "Review the SDK", status: "open" })
  await tasks.tasks.update({ id: created.id, body: { status: "done" } })
  const full = await tasks.tasks.get.withResponse({ id: created.id })
  return { task: full.data, requestId: full.headers.get("x-request-id") }
}
// Use with useQuery, queryClient.fetchQuery, prefetchQuery, etc.
export const openTasks = {
  ...apiQuery(tasks.tasks.list, { status: "open", limit: 20 }),
  staleTime: 30_000,
}
// A generated Standard Schema can also validate data outside the HTTP client.
export const taskSchema = Get200Schema
