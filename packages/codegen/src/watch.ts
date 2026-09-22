import { createHash } from "node:crypto"
import { type FSWatcher, watch as watchDirectory } from "node:fs"
import { basename, dirname } from "node:path"
import { performance } from "node:perf_hooks"
import { setTimeout as sleep } from "node:timers/promises"
import { fileURLToPath } from "node:url"
import { type GenerateResult, generate } from "./generate.js"
import { parseDocument, readDocumentSource, sourceUri } from "./loader.js"
import type { AccordCodegenConfig } from "./types.js"

export type WatchNotice =
  /** The document was read and compiled; `result` is ready to be written. */
  | { readonly kind: "generated"; readonly result: GenerateResult; readonly elapsedMs: number }
  /** Loading or compiling failed. Watching continues with the previous inputs. */
  | { readonly kind: "failed"; readonly error: Error; readonly elapsedMs: number }
  /** A polled URL stopped responding. Reported once per outage; recovery reports `generated`. */
  | { readonly kind: "unavailable"; readonly error: Error }

export interface WatchOptions {
  /** Interval between fetches of an HTTP(S) document. Defaults to 1000 ms. */
  readonly pollIntervalMs?: number
  /** Quiet period after a file system event before regenerating. Defaults to 100 ms. */
  readonly debounceMs?: number
  /** Stops watching; the returned promise then resolves. */
  readonly signal?: AbortSignal
}

type Notify = (notice: WatchNotice) => Promise<void> | void

const digest = (source: string) => createHash("sha256").update(source).digest("hex")
const isRemote = (uri: string) => /^https?:/.test(uri)

/**
 * Regenerates whenever the OpenAPI input changes, until `options.signal` aborts.
 *
 * File inputs are watched together with every external document they reference,
 * through their parent directories so editors that save by rename are followed.
 * HTTP(S) inputs are polled and regenerated only when the served text changes.
 * Generation failures are reported and never stop the watch.
 */
export async function watchGenerate(
  input: string,
  config: AccordCodegenConfig,
  notify: Notify,
  options: WatchOptions = {},
): Promise<void> {
  const uri = sourceUri(input)
  const signal = options.signal
  const generateConfig: AccordCodegenConfig = { ...config, sourceUrl: uri }

  let running = false
  let rerun = false
  let sources: readonly string[] = [uri]
  let watchers = new Map<string, FSWatcher>()
  const watchedNames = new Map<string, Set<string>>()
  let timer: NodeJS.Timeout | undefined

  async function regenerate(source: string): Promise<void> {
    if (running) {
      rerun = true
      return
    }
    running = true
    const started = performance.now()
    try {
      const result = await generate(parseDocument(source, uri), generateConfig)
      sources = result.sources
      if (!isRemote(uri)) syncWatchers()
      await notify({ kind: "generated", result, elapsedMs: performance.now() - started })
    } catch (cause) {
      await notify({
        kind: "failed",
        error: cause instanceof Error ? cause : new Error(String(cause)),
        elapsedMs: performance.now() - started,
      })
    } finally {
      running = false
    }
    // An input changed while compiling: read it again so the last edit always wins.
    if (rerun && !signal?.aborted) {
      rerun = false
      await regenerateFromInput()
    }
  }

  async function regenerateFromInput(): Promise<void> {
    const started = performance.now()
    let source: string
    try {
      source = await readDocumentSource(uri)
    } catch (cause) {
      await notify({
        kind: "failed",
        error: cause instanceof Error ? cause : new Error(String(cause)),
        elapsedMs: performance.now() - started,
      })
      return
    }
    await regenerate(source)
  }

  function schedule(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      void regenerateFromInput()
    }, options.debounceMs ?? 100)
  }

  /** Watches the directory of each file source; only events for known file names count. */
  function syncWatchers(): void {
    watchedNames.clear()
    for (const source of sources) {
      if (!source.startsWith("file:")) continue
      const path = fileURLToPath(source)
      const names = watchedNames.get(dirname(path)) ?? new Set<string>()
      names.add(basename(path))
      watchedNames.set(dirname(path), names)
    }
    const next = new Map<string, FSWatcher>()
    for (const directory of watchedNames.keys()) {
      const existing = watchers.get(directory)
      if (existing) {
        next.set(directory, existing)
        watchers.delete(directory)
        continue
      }
      const watcher = watchDirectory(directory, { persistent: true }, (_event, filename) => {
        // Some platforms omit the file name; regenerate rather than miss an edit.
        if (filename !== null && !watchedNames.get(directory)?.has(filename.toString())) return
        schedule()
      })
      watcher.on("error", () => {
        watcher.close()
        watchers.delete(directory)
      })
      next.set(directory, watcher)
    }
    for (const watcher of watchers.values()) watcher.close()
    watchers = next
  }

  if (isRemote(uri)) {
    let previous: string | undefined
    let outage = false
    while (!signal?.aborted) {
      let source: string | undefined
      try {
        source = await readDocumentSource(uri)
      } catch (cause) {
        if (!outage)
          await notify({
            kind: "unavailable",
            error: cause instanceof Error ? cause : new Error(String(cause)),
          })
        outage = true
      }
      if (source !== undefined) {
        outage = false
        const current = digest(source)
        if (current !== previous) {
          previous = current
          await regenerate(source)
        }
      }
      try {
        await sleep(options.pollIntervalMs ?? 1000, undefined, { signal })
      } catch {
        break
      }
    }
    return
  }

  syncWatchers()
  await regenerateFromInput()
  await new Promise<void>((resolve) => {
    if (!signal) return
    if (signal.aborted) resolve()
    else signal.addEventListener("abort", () => resolve(), { once: true })
  })
  if (timer) clearTimeout(timer)
  for (const watcher of watchers.values()) watcher.close()
}
