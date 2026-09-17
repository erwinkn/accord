import { createServer } from "vite"
import { startApplication } from "./dist/src/server.js"

// Nest runs its compiled decorators; Vite serves React and proxies the API on the same origin.
const api = await startApplication()
let web
try {
  web = await createServer()
  await web.listen()
  web.printUrls()
} catch (error) {
  await web?.close()
  await api.close()
  throw error
}
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  await Promise.all([web.close(), api.close()])
}
process.once("SIGINT", stop)
process.once("SIGTERM", stop)
