/** A real loopback HTTP server, emitted with each consumer so failure artifacts are standalone. */
export const serverSource = `import { createServer } from "node:http"
import type { IncomingHttpHeaders } from "node:http"

export interface CapturedRequest {
  method: string
  url: string
  headers: IncomingHttpHeaders
  body: Buffer
}

export async function withServer(
  use: (baseUrl: string, requests: CapturedRequest[]) => Promise<void>,
  reply: { status?: number; headers?: Record<string, string>; body?: string | Uint8Array } = {},
): Promise<void> {
  const requests: CapturedRequest[] = []
  let serverError: Error | undefined
  const server = createServer(async (request, response) => {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      requests.push({ method: request.method ?? "", url: request.url ?? "", headers: request.headers,
        body: Buffer.concat(chunks) })
      response.writeHead(reply.status ?? 204, reply.headers ?? {})
      response.end(reply.body)
    } catch (error) {
      serverError = error instanceof Error ? error : new Error(String(error))
      response.destroy(serverError)
    }
  })
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.listen(0, "127.0.0.1", () => { server.off("error", reject); resolve() })
    })
    const address = server.address()
    if (!address || typeof address === "string") throw new Error("No loopback address")
    await use("http://127.0.0.1:" + address.port + "/base", requests)
    if (serverError) throw serverError
  } finally {
    server.closeAllConnections()
    if (server.listening) await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
}
`

/** Do not classify arbitrary exceptions or process crashes as expected contract failures. */
export const bootstrapSource = `import { AssertionError } from "node:assert"
import { writeFileSync } from "node:fs"
try {
  const consumer = await import("./consumer.js")
  if (typeof consumer.run === "function") await consumer.run()
  writeFileSync("execution.json", JSON.stringify({ ok: true }))
} catch (error) {
  const isAssertion = error instanceof AssertionError
  const message = error instanceof Error ? error.message : String(error)
  const match = isAssertion ? /\\bACCORD_[A-Z0-9_]+\\b/.exec(message) : null
  writeFileSync("execution.json", JSON.stringify({ ok: false,
    phase: isAssertion ? "assert" : "execute",
    signature: match?.[0] ?? (isAssertion ? "UNTAGGED_ASSERTION" : "UNEXPECTED_EXCEPTION"),
    message: error instanceof Error ? error.stack ?? message : message }))
  process.exitCode = 1
}
`
