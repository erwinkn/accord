import { ApiKeyAuth, createClient } from "@accord/client"
import { api } from "./sdk.js"
export const assets = createClient(api, {
  baseUrl: "https://assets.example.test/us/v1",
  auth: ApiKeyAuth("replace-with-your-api-key", { in: "header", name: "X-API-Key" }),
})
export async function upload(file: File) {
  const created = await assets.assets.upload({
    file,
    metadata: { name: file.name },
    tags: ["demo"],
  })
  return assets.assets.rename({ id: created.id, body: { id: created.id, name: "Renamed" } })
}
