import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { promisify } from "node:util"
import { AccordCodegenError, generateFromFile } from "@accord/codegen"
import ts from "typescript"
import type { Consumer, Failure, Fixture, KnownGap, Result } from "./model.js"
import { ContractFailure } from "./model.js"
import { bootstrapSource, serverSource } from "./server-source.js"

const exec = promisify(execFile)
export const root = resolve(import.meta.dirname, "../..")
export const workRoot = join(root, ".accord-test-work")
export const reportRoot = join(root, "artifacts", "conformance")

export const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmitOnError: true,
  types: ["node"],
}

// Reuse immutable dependency ASTs, never generated files. Each program still performs semantic checks.
const dependencySources = new Map<string, ts.SourceFile>()
export function compile(rootNames: string[], checkDeclarations = false): readonly ts.Diagnostic[] {
  const options = { ...compilerOptions, skipLibCheck: !checkDeclarations }
  const host = ts.createCompilerHost(options)
  const load = host.getSourceFile.bind(host)
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const cacheable = fileName.includes("/node_modules/") || fileName.includes("/packages/")
    const cached = cacheable ? dependencySources.get(fileName) : undefined
    if (cached) return cached
    const source = load(fileName, languageVersion, onError, shouldCreateNewSourceFile)
    if (cacheable && source) dependencySources.set(fileName, source)
    return source
  }
  const program = ts.createProgram({ rootNames, options, host })
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length === 0) program.emit()
  return diagnostics
}

export function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnostics(diagnostics, {
    getCurrentDirectory: () => root,
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => "\n",
  })
}

function diagnosticMarker(diagnostic: ts.Diagnostic): string | undefined {
  if (!diagnostic.file || diagnostic.start === undefined) return undefined
  const line = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line
  return diagnostic.file.text.split("\n")[line - 1]?.trim()
}

/** Reject unrelated errors: an unresolved import cannot satisfy a negative type assertion. */
export function checkDiagnostics(
  diagnostics: readonly ts.Diagnostic[],
  consumer: Consumer,
  consumerPath: string,
): void {
  if (
    consumer.checkDeclarations &&
    diagnostics.length > 0 &&
    diagnostics.every((item) => item.file?.isDeclarationFile)
  ) {
    const signature = diagnostics
      .map(
        (item) =>
          `TS${item.code}:${relative(root, item.file!.fileName)}:${ts.flattenDiagnosticMessageText(item.messageText, " ")}`,
      )
      .sort()
      .join("|")
    throw new ContractFailure("compile", signature, formatDiagnostics(diagnostics))
  }
  const expected = consumer.diagnostics ?? []
  const counts = new Map<string, number>()
  const markers = consumer.source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("// @negative "))
  if (markers.length !== expected.length || new Set(markers).size !== markers.length) {
    throw new ContractFailure(
      "harness",
      "INVALID_TYPE_MARKERS",
      "Every negative marker needs one expectation",
    )
  }
  for (const expectation of expected) {
    if (!markers.includes(`// @negative ${expectation.marker}`)) {
      throw new ContractFailure(
        "harness",
        "INVALID_TYPE_MARKERS",
        `Missing marker: ${expectation.marker}`,
      )
    }
  }
  for (const diagnostic of diagnostics) {
    const marker = diagnosticMarker(diagnostic)
    const expectation = expected.find((item) => marker === `// @negative ${item.marker}`)
    if (
      diagnostic.file?.fileName === consumerPath &&
      expectation?.codes.includes(diagnostic.code)
    ) {
      counts.set(expectation.marker, (counts.get(expectation.marker) ?? 0) + 1)
      continue
    }
    const contract = /^\/\/ @contract (ACCORD_[A-Z0-9_]+)$/.exec(marker ?? "")?.[1]
    // Only a single, intentionally tagged equality/assignability failure can be a known type gap.
    if (diagnostics.length === 1 && diagnostic.file?.fileName === consumerPath && contract) {
      throw new ContractFailure(
        "compile",
        `${contract}:TS${diagnostic.code}`,
        formatDiagnostics(diagnostics),
      )
    }
    throw new ContractFailure("compile", "UNEXPECTED_DIAGNOSTIC", formatDiagnostics(diagnostics))
  }
  for (const expectation of expected) {
    if (counts.get(expectation.marker) !== 1) {
      throw new ContractFailure(
        "assert",
        `NEGATIVE_${expectation.marker}`,
        "Expected exactly one matching TypeScript diagnostic",
      )
    }
  }
}

interface ExecutionResult {
  readonly ok: boolean
  readonly phase?: "assert" | "execute"
  readonly signature?: string
  readonly message?: string
}

export async function execute(directory: string, timeout = 15_000): Promise<void> {
  await rm(join(directory, "execution.json"), { force: true })
  await writeFile(join(directory, "bootstrap.mjs"), bootstrapSource)
  // The subprocess bounds hangs, isolates globals and module state, and uses real built JS.
  let failed = false
  try {
    await exec(process.execPath, ["bootstrap.mjs"], {
      cwd: directory,
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: "1" },
    })
  } catch {
    failed = true
  }
  let result: ExecutionResult
  try {
    result = JSON.parse(await readFile(join(directory, "execution.json"), "utf8"))
  } catch {
    throw new ContractFailure(
      "execute",
      "PROCESS_FAILURE",
      "Consumer crashed, timed out, or did not produce an execution result",
    )
  }
  if (result.ok && !failed) return
  if (!result.ok && result.phase && result.signature && result.message) {
    throw new ContractFailure(result.phase, result.signature, result.message)
  }
  throw new ContractFailure(
    "harness",
    "INVALID_EXECUTION_RESULT",
    "Process status and execution result disagree",
  )
}

export async function newWorkspace(prefix: string): Promise<string> {
  await mkdir(workRoot, { recursive: true })
  const directory = await mkdtemp(join(workRoot, `${prefix}-`))
  await writeFile(join(directory, "package.json"), '{"private":true,"type":"module"}\n')
  return directory
}

export function safeFixturePath(directory: string, file: string): string {
  const destination = resolve(directory, file)
  const rel = relative(directory, destination)
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    throw new ContractFailure(
      "harness",
      "UNSAFE_FIXTURE_PATH",
      `Fixture path escapes workspace: ${file}`,
    )
  }
  if (
    [
      "package.json",
      "consumer.ts",
      "generated.ts",
      "server.ts",
      "bootstrap.mjs",
      "execution.json",
    ].includes(rel)
  ) {
    throw new ContractFailure("harness", "RESERVED_FIXTURE_PATH", `Reserved fixture path: ${file}`)
  }
  return destination
}

export async function verifyFixture(fixture: Fixture): Promise<Failure | undefined> {
  const directory = await newWorkspace(fixture.id)
  let failure: Failure | undefined
  try {
    await writeFile(join(directory, "openapi.json"), JSON.stringify(fixture.document, null, 2))
    for (const [file, source] of Object.entries(fixture.files ?? {})) {
      const destination = safeFixturePath(directory, file)
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, source)
    }
    let generated: Awaited<ReturnType<typeof generateFromFile>>
    try {
      generated = await generateFromFile(join(directory, "openapi.json"), fixture.config)
    } catch (error) {
      if (error instanceof AccordCodegenError) {
        if (fixture.rejection && error.diagnostics.some((item) => item.code === fixture.rejection))
          return
        throw new ContractFailure(
          "generate",
          error.diagnostics
            .map((item) => item.code)
            .sort()
            .join(","),
          error.message,
        )
      }
      throw error
    }
    if (fixture.rejection) {
      throw new ContractFailure(
        "assert",
        "MISSING_REJECTION",
        `Accepted invalid document; expected ${fixture.rejection}`,
      )
    }
    await writeFile(join(directory, "generated.ts"), generated.source)
    await writeFile(
      join(directory, "endpoint-plans.json"),
      JSON.stringify(
        generated.model.operations.map((operation) => operation.plan),
        null,
        2,
      ),
    )
    await writeFile(join(directory, "server.ts"), serverSource)
    const consumer = fixture.consumer ?? { source: 'import "./generated.js"\n' }
    const consumerPath = join(directory, "consumer.ts")
    await writeFile(consumerPath, consumer.source)
    const diagnostics = compile([consumerPath], consumer.checkDeclarations)
    await writeFile(join(directory, "diagnostics.txt"), formatDiagnostics(diagnostics))
    checkDiagnostics(diagnostics, consumer, consumerPath)
    if (!consumer.diagnostics?.length) await execute(directory)
  } catch (error) {
    failure =
      error instanceof ContractFailure
        ? { phase: error.phase, signature: error.signature, message: error.message }
        : {
            phase: "harness",
            signature: "UNEXPECTED_EXCEPTION",
            message: error instanceof Error ? (error.stack ?? error.message) : String(error),
          }
    const failureDirectory = join(reportRoot, "failures", fixture.id)
    await rm(failureDirectory, { recursive: true, force: true })
    await mkdir(failureDirectory, { recursive: true })
    // Synthetic specs only. Preserve sources and diagnostics, not node_modules or environment variables.
    const { cp } = await import("node:fs/promises")
    await cp(directory, failureDirectory, { recursive: true })
    await writeFile(
      join(reportRoot, "failures", fixture.id, "failure.json"),
      JSON.stringify(failure, null, 2),
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
  return failure
}

export function classify(
  failure: Failure | undefined,
  gap: KnownGap | undefined,
): Result["status"] {
  if (!failure) return gap ? "unexpected-pass" : "pass"
  if (gap && failure.phase === gap.phase && failure.signature === gap.signature) return "known-gap"
  return "fail"
}

export function gateFails(results: readonly Result[], strict: boolean): boolean {
  return results.some(
    (result) =>
      result.status === "fail" ||
      result.status === "unexpected-pass" ||
      (strict && result.status === "known-gap"),
  )
}

export function validateRegistry(fixtures: readonly Fixture[], gaps: readonly KnownGap[]): void {
  const ids = fixtures.map((fixture) => fixture.id)
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate conformance fixture ID")
  if (new Set(gaps.map((gap) => gap.id)).size !== gaps.length)
    throw new Error("Duplicate known-gap ID")
  for (const fixture of fixtures) {
    if (!/^[a-z][a-z0-9.-]+$/.test(fixture.id)) throw new Error(`Unsafe fixture ID: ${fixture.id}`)
    if (!fixture.title || !fixture.reference)
      throw new Error(`Missing contract metadata: ${fixture.id}`)
    if (fixture.rejection && fixture.consumer)
      throw new Error(`Rejection fixture has a consumer: ${fixture.id}`)
  }
  for (const gap of gaps) {
    if (!ids.includes(gap.id)) throw new Error(`Orphan known gap: ${gap.id}`)
    if (!gap.reason || !gap.signature || !gap.since)
      throw new Error(`Incomplete known gap: ${gap.id}`)
    if (
      gap.phase === "harness" ||
      gap.phase === "execute" ||
      gap.signature === "UNEXPECTED_EXCEPTION" ||
      [
        "UNEXPECTED_DIAGNOSTIC",
        "PROCESS_FAILURE",
        "INVALID_EXECUTION_RESULT",
        "UNTAGGED_ASSERTION",
      ].includes(gap.signature)
    ) {
      throw new Error(`Harness/infrastructure failures must never be baselined: ${gap.id}`)
    }
  }
}
