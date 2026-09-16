import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import ts from "typescript"
import { generationCases } from "./generation-cases.js"
import {
  classify,
  gateFails,
  reportRoot,
  root,
  validateRegistry,
  verifyFixture,
} from "./harness.js"
import type { KnownGap, Result } from "./model.js"
import { queryCases } from "./query-cases.js"
import { representationCases } from "./representation-cases.js"
import { requestBodyCases } from "./request-body-cases.js"
import { rewriteCases } from "./rewrite-cases.js"
import { typeCases } from "./type-cases.js"
import { responseCases, wireCases } from "./wire-cases.js"

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const supported = new Set(["--strict", "--list"])
  if (args.some((arg) => !supported.has(arg)))
    throw new Error(`Unknown arguments: ${args.join(" ")}`)
  const strict = args.includes("--strict")
  const cases = [
    ...generationCases,
    ...typeCases,
    ...wireCases,
    ...responseCases,
    ...queryCases,
    ...rewriteCases,
    ...representationCases,
    ...requestBodyCases,
  ]
  const gaps: KnownGap[] = JSON.parse(
    await readFile(join(root, "tests/conformance/known-gaps.json"), "utf8"),
  )
  validateRegistry(cases, gaps)
  if (args.includes("--list")) {
    for (const fixture of cases) console.log(`${fixture.id}\t${fixture.area}\t${fixture.title}`)
    return
  }
  const selected = process.env["ACCORD_CONFORMANCE_CASE"]
  const fixtures = selected ? cases.filter((fixture) => fixture.id === selected) : cases
  if (fixtures.length === 0) throw new Error(`No matching conformance fixture: ${selected}`)
  await rm(reportRoot, { recursive: true, force: true })
  await mkdir(reportRoot, { recursive: true })
  const results: Result[] = []
  for (const fixture of fixtures) {
    const start = performance.now()
    const failure = await verifyFixture(fixture)
    const status = classify(
      failure,
      gaps.find((gap) => gap.id === fixture.id),
    )
    const base = {
      id: fixture.id,
      title: fixture.title,
      area: fixture.area,
      reference: fixture.reference,
      status,
      durationMs: Math.round(performance.now() - start),
    }
    const result: Result = failure ? { ...base, failure } : base
    results.push(result)
    console.log(
      `${status.toUpperCase().padEnd(15)} ${fixture.id}${failure ? ` [${failure.phase}/${failure.signature}]` : ""}`,
    )
    if (status === "fail" && failure) console.error(failure.message)
  }
  const counts = {
    pass: results.filter((result) => result.status === "pass").length,
    knownGap: results.filter((result) => result.status === "known-gap").length,
    unexpectedPass: results.filter((result) => result.status === "unexpected-pass").length,
    fail: results.filter((result) => result.status === "fail").length,
  }
  const report = {
    schemaVersion: 1,
    complete: !selected,
    commit: process.env["GITHUB_SHA"] ?? null,
    node: process.version,
    typescript: ts.version,
    strict,
    counts,
    results,
  }
  const markdownCell = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", "<br>")
  const rows = results.map(
    (result) =>
      `| ${result.id} | ${result.status} | ${result.area} | ${markdownCell(result.failure?.signature ?? "—")} |`,
  )
  const markdown = [
    "# Accord conformance",
    "",
    `**${counts.pass} passing · ${counts.knownGap} known gaps · ${counts.fail} regressions · ${counts.unexpectedPass} unexpected passes.**`,
    "",
    "A green regression gate is not a claim of full conformance. Known gaps were executed, not skipped.",
    "An unexpected pass requires removing its baseline entry. Unrelated failures always fail the gate.",
    "",
    selected
      ? `Partial run: ${selected}. Not eligible for full-conformance enforcement.`
      : "Complete registered corpus.",
    "",
    "| Invariant | Result | Area | Failure signature |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n")
  const junit = `<testsuites><testsuite name="Accord conformance" tests="${results.length}" failures="${results.filter((result) => result.status !== "pass").length}">${results.map((result) => `<testcase classname="${xml(result.area)}" name="${xml(result.id)}" time="${result.durationMs / 1000}">${result.status === "pass" ? "" : `<failure type="${xml(result.status)}" message="${xml(result.failure?.signature ?? "Remove resolved known gap")}">${xml(result.failure?.message ?? "Unexpected pass")}</failure>`}</testcase>`).join("")}</testsuite></testsuites>\n`
  await writeFile(join(reportRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(join(reportRoot, "report.md"), markdown)
  // JUnit reports target failures honestly even when the regression-baseline command succeeds.
  await writeFile(join(reportRoot, "junit.xml"), junit)
  if (process.env["GITHUB_STEP_SUMMARY"])
    await appendFile(process.env["GITHUB_STEP_SUMMARY"], markdown)
  console.log(markdown.split("\n")[2])
  if (gateFails(results, strict)) process.exitCode = 1
}

main().catch((error: Error) => {
  console.error(error.stack ?? error.message)
  process.exitCode = 1
})
