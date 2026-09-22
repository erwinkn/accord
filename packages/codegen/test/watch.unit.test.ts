import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import { expect, it, vi } from "vitest"
import { type WatchNotice, watchGenerate } from "../src/watch.js"

const operation = (name: string, ref: string) => ({
  get: {
    operationId: `${name}Get`,
    responses: {
      200: { description: "ok", content: { "application/json": { schema: { $ref: ref } } } },
    },
  },
})

const document = (names: readonly string[], ref = "#/components/schemas/User") => ({
  openapi: "3.1.0",
  info: { title: "Watch", version: "1" },
  paths: Object.fromEntries(names.map((name) => [`/${name}`, operation(name, ref)])),
  components: { schemas: { User: { type: "object", properties: { id: { type: "string" } } } } },
})

const models = (properties: readonly string[]) => ({
  User: {
    type: "object",
    properties: Object.fromEntries(properties.map((name) => [name, { type: "string" }])),
  },
})

class Notices {
  readonly all: WatchNotice[] = []
  readonly record = (notice: WatchNotice) => {
    this.all.push(notice)
  }
  get generated() {
    return this.all.filter((notice) => notice.kind === "generated")
  }
  get failed() {
    return this.all.filter((notice) => notice.kind === "failed")
  }
  get unavailable() {
    return this.all.filter((notice) => notice.kind === "unavailable")
  }
}

const waitFor = <T>(callback: () => T) => vi.waitFor(callback, { timeout: 5000, interval: 25 })

it("regenerates when a file input or one of its external references changes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "accord-watch-file-"))
  const controller = new AbortController()
  const notices = new Notices()
  try {
    const root = join(directory, "openapi.json")
    const external = join(directory, "models.json")
    await writeFile(external, JSON.stringify(models(["id"])))
    await writeFile(root, JSON.stringify(document(["users"], "./models.json#/User")))
    const done = watchGenerate(root, {}, notices.record, {
      signal: controller.signal,
      debounceMs: 20,
    })

    await waitFor(() => expect(notices.generated).toHaveLength(1))
    const first = notices.generated[0]!
    expect(first.result.model.operations).toHaveLength(1)
    expect(first.result.sources).toHaveLength(2)
    expect(first.result.files["types/users.ts"]).not.toContain("email")

    // An external reference changes: the root file is untouched.
    await writeFile(external, JSON.stringify(models(["id", "email"])))
    await waitFor(() => expect(notices.generated).toHaveLength(2))
    expect(notices.generated[1]!.result.files["types/users.ts"]).toContain("email")

    // A broken root reports a failure and keeps watching.
    await writeFile(root, "{ not json")
    await waitFor(() => expect(notices.failed).toHaveLength(1))
    expect(notices.failed[0]!.error.message).toContain("Could not load")
    await writeFile(root, JSON.stringify(document(["users", "pets"], "./models.json#/User")))
    await waitFor(() => expect(notices.generated).toHaveLength(3))
    expect(notices.generated[2]!.result.model.operations).toHaveLength(2)

    // Writing an unrelated file in the same directory does not regenerate.
    await writeFile(join(directory, "notes.ts"), "// unrelated\n")
    await sleep(150)
    expect(notices.generated).toHaveLength(3)

    controller.abort()
    await done
  } finally {
    controller.abort()
    await rm(directory, { recursive: true, force: true })
  }
}, 10_000)

it("polls a URL, regenerates only on changes, and reports an outage once", async () => {
  let served = JSON.stringify(document(["users"]))
  let available = true
  const server = createServer((_request, response) => {
    if (!available) {
      response.destroy()
      return
    }
    response.setHeader("content-type", "application/json")
    response.end(served)
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  // SAFETY: a server listening on a TCP port reports an AddressInfo, never a pipe path or null.
  const { port } = server.address() as AddressInfo
  const controller = new AbortController()
  const notices = new Notices()
  try {
    const done = watchGenerate(`http://127.0.0.1:${port}/openapi.json`, {}, notices.record, {
      signal: controller.signal,
      pollIntervalMs: 50,
    })
    await waitFor(() => expect(notices.generated).toHaveLength(1))
    await sleep(200)
    expect(notices.generated).toHaveLength(1)

    served = JSON.stringify(document(["users", "pets"]))
    await waitFor(() => expect(notices.generated).toHaveLength(2))
    expect(notices.generated[1]!.result.model.operations).toHaveLength(2)

    available = false
    await waitFor(() => expect(notices.unavailable).toHaveLength(1))
    await sleep(200)
    expect(notices.unavailable).toHaveLength(1)

    available = true
    await sleep(200)
    expect(notices.generated).toHaveLength(2)
    served = JSON.stringify(document(["users", "pets", "orders"]))
    await waitFor(() => expect(notices.generated).toHaveLength(3))

    controller.abort()
    await done
  } finally {
    controller.abort()
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}, 10_000)
