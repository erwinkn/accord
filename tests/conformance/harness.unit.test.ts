import { rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { endpoint, references } from "./fixture.js"
import {
  checkDiagnostics,
  classify,
  compile,
  execute,
  gateFails,
  newWorkspace,
  safeFixturePath,
  validateRegistry,
} from "./harness.js"
import type { Fixture, KnownGap, Result } from "./model.js"

const fixture: Fixture = {
  id: "self.example",
  title: "Example",
  area: "types",
  reference: references.accord,
  document: endpoint(),
}
const gap: KnownGap = {
  id: fixture.id,
  phase: "assert",
  signature: "ACCORD_EXAMPLE",
  reason: "Deliberate self-test",
  since: "self-test",
}

function result(status: Result["status"]): Result {
  return {
    id: fixture.id,
    title: fixture.title,
    area: fixture.area,
    reference: fixture.reference,
    durationMs: 0,
    status,
  }
}

describe("conformance infrastructure is fail-closed", () => {
  it("only acknowledges an exact failure phase and signature", () => {
    expect(
      classify({ phase: "assert", signature: "ACCORD_EXAMPLE", message: "Expected" }, gap),
    ).toBe("known-gap")
    expect(
      classify({ phase: "execute", signature: "ACCORD_EXAMPLE", message: "Different phase" }, gap),
    ).toBe("fail")
    expect(
      classify(
        { phase: "assert", signature: "ACCORD_DIFFERENT", message: "Different invariant" },
        gap,
      ),
    ).toBe("fail")
    expect(
      classify(
        { phase: "harness", signature: "UNEXPECTED_EXCEPTION", message: "Import failed" },
        gap,
      ),
    ).toBe("fail")
  })

  it("fails on unexpected improvements until the obsolete baseline is removed", () => {
    expect(classify(undefined, gap)).toBe("unexpected-pass")
    expect(gateFails([result("unexpected-pass")], false)).toBe(true)
    expect(gateFails([result("known-gap")], false)).toBe(false)
    expect(gateFails([result("known-gap")], true)).toBe(true)
    expect(gateFails([result("fail")], false)).toBe(true)
  })

  it("rejects duplicate cases, orphan baselines, and unclassified setup failures", () => {
    expect(() => validateRegistry([fixture, fixture], [])).toThrow(/Duplicate/)
    expect(() => validateRegistry([], [gap])).toThrow(/Orphan/)
    expect(() => validateRegistry([fixture], [{ ...gap, phase: "harness" }])).toThrow(/never/)
    expect(() => validateRegistry([fixture], [{ ...gap, signature: "PROCESS_FAILURE" }])).toThrow(
      /never/,
    )
  })

  it("requires negative expectations to identify exactly one real diagnostic", async () => {
    const directory = await newWorkspace("self-types")
    try {
      const file = join(directory, "consumer.ts")
      const source = "// @negative WRONG_TYPE\nconst name: string = 123\nexport {}\n"
      await writeFile(file, source)
      const diagnostics = compile([file])
      const consumer = { source, diagnostics: [{ marker: "WRONG_TYPE", codes: [2322] }] }
      expect(() => checkDiagnostics(diagnostics, consumer, file)).not.toThrow()
      expect(() => checkDiagnostics([], consumer, file)).toThrow(/exactly one/)
      expect(() =>
        checkDiagnostics(
          diagnostics,
          { source, diagnostics: [{ marker: "WRONG_TYPE", codes: [2345] }] },
          file,
        ),
      ).toThrow()
      expect(() => checkDiagnostics(diagnostics, { source: "export {}" }, file)).toThrow()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("distinguishes a tagged runtime assertion from an unrelated exception", async () => {
    const directory = await newWorkspace("self-execution")
    try {
      await writeFile(
        join(directory, "consumer.js"),
        'import assert from "node:assert/strict"; export function run() { assert.equal(1, 2, "ACCORD_SENTINEL") }',
      )
      await expect(execute(directory)).rejects.toMatchObject({
        phase: "assert",
        signature: "ACCORD_SENTINEL",
      })
      await writeFile(
        join(directory, "consumer.js"),
        'export function run() { throw new Error("ACCORD_SENTINEL") }',
      )
      await expect(execute(directory)).rejects.toMatchObject({
        phase: "execute",
        signature: "UNEXPECTED_EXCEPTION",
      })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("kills hung consumers and cannot reuse a stale success or failure record", async () => {
    const directory = await newWorkspace("self-timeout")
    try {
      await writeFile(join(directory, "execution.json"), '{"ok":true}')
      await writeFile(join(directory, "consumer.js"), "export function run() { while (true) {} }")
      await expect(execute(directory, 200)).rejects.toMatchObject({
        phase: "execute",
        signature: "PROCESS_FAILURE",
      })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects traversal and reserved fixture files", () => {
    expect(() => safeFixturePath("/tmp/fixture", "../outside.json")).toThrow(/escapes/)
    expect(() => safeFixturePath("/tmp/fixture", "/etc/file")).toThrow(/escapes/)
    expect(() => safeFixturePath("/tmp/fixture", "generated.ts")).toThrow(/Reserved/)
    expect(safeFixturePath("/tmp/fixture", "components/body.json")).toBe(
      "/tmp/fixture/components/body.json",
    )
  })
})
