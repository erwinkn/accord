import { createClient } from "@accord/client"
import { api } from "./sdk.js"
export const imports = createClient(api, { baseUrl: "https://imports.example.test/v2" })
export async function uploadCsv(csv: string) {
  const result = await imports.imports.create(
    { body: csv },
    { headers: { "content-type": "text/csv", "x-request-id": "import-42" } },
  )
  if (result.status === 202) return { queued: result.data.jobId }
  return { completed: result.data.imported }
}
export async function downloadReport(jobId: string) {
  const bytes: ArrayBuffer = await imports.imports.report.download({ jobId })
  return new Blob([bytes], { type: "application/octet-stream" })
}
