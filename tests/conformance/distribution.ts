import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { endpoint } from "./fixture.js"
import { root } from "./harness.js"

const exec = promisify(execFile)

async function main(): Promise<void> {
  const temporary = await mkdtemp(join(tmpdir(), "accord-package-test-"))
  const reportDirectory = join(root, "artifacts", "distribution")
  await mkdir(reportDirectory, { recursive: true })
  const log: string[] = []
  const command = async (cwd: string, executable: string, args: string[]) => {
    log.push(`$ ${executable} ${args.join(" ")}`)
    const result = await exec(executable, args, {
      cwd,
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    })
    log.push(result.stdout, result.stderr)
    return result.stdout
  }
  try {
    const tarballs = join(temporary, "tarballs")
    const installed = join(temporary, "consumer")
    await mkdir(tarballs)
    await mkdir(installed)
    for (const name of ["client", "codegen", "react-query"]) {
      await command(join(root, "packages", name), "pnpm", ["pack", "--pack-destination", tarballs])
    }
    const files = await readdir(tarballs)
    const dependencies: Record<string, string> = {
      "@tanstack/react-query": "5.101.4",
      react: "19.2.8",
      typescript: "5.9.3",
      "@types/node": "26.2.0",
      "@types/react": "^19.2.0",
    }
    for (const name of ["client", "codegen", "react-query"]) {
      const file = files.find((item) => item.startsWith(`accord-${name}-`) && item.endsWith(".tgz"))
      assert(file, `Missing ${name} tarball`)
      dependencies[`@accord/${name}`] = `file:${join(tarballs, file)}`
    }
    await writeFile(
      join(installed, "package.json"),
      JSON.stringify({ name: "accord-install-smoke", private: true, type: "module", dependencies }),
    )
    // Outside the repository: workspace links, root imports, and source aliases cannot rescue broken packages.
    await command(installed, "pnpm", ["install", "--ignore-scripts", "--no-frozen-lockfile"])
    await writeFile(join(installed, "openapi.json"), JSON.stringify(endpoint()))
    const help = await command(installed, "pnpm", ["exec", "accord", "--help"])
    assert.match(help, /Usage: accord/)
    await command(installed, "pnpm", [
      "exec",
      "accord",
      "generate",
      "openapi.json",
      "--output",
      "generated.ts",
    ])
    await writeFile(join(installed, "config.mjs"), 'export default { namespace: "tag" }\n')
    await command(installed, "pnpm", [
      "exec",
      "accord",
      "generate",
      "openapi.json",
      "--config",
      "config.mjs",
      "--output",
      "configured.ts",
    ])
    await writeFile(
      join(installed, "consumer.ts"),
      `import assert from "node:assert/strict"
import { createClient } from "@accord/client"
import { apiQuery } from "@accord/react-query"
import { api } from "./generated.js"
const client = createClient(api, { baseUrl: "https://example.test/api", fetch: async input => {
  assert.equal(String(input), "https://example.test/api/probe")
  return new Response(null, { status: 204 })
} })
await client.probe.call()
assert.equal(apiQuery(api.probe.call, {}).queryKey[0], "accord")
for (const name of ["@accord/client", "@accord/codegen", "@accord/react-query"]) {
  assert(!import.meta.resolve(name).includes("/packages/"), "Must load tarballs, not workspace sources")
}
`,
    )
    await command(installed, "pnpm", [
      "exec",
      "tsc",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--skipLibCheck",
      "consumer.ts",
    ])
    await command(installed, "node", ["consumer.js"])
    await writeFile(
      join(reportDirectory, "report.json"),
      JSON.stringify(
        {
          passed: true,
          packages: files,
          checks: [
            "clean-install",
            "cli-help",
            "cli-generation",
            "config-import",
            "semantic-consumer-compile",
            "runtime-imports-and-request",
          ],
        },
        null,
        2,
      ),
    )
    console.log(
      "Distribution passed: all three packed packages installed outside the workspace and used by a compiled consumer",
    )
  } catch (error) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
    log.push(message)
    await writeFile(
      join(reportDirectory, "report.json"),
      JSON.stringify({ passed: false, error: message }, null, 2),
    )
    throw error
  } finally {
    await writeFile(join(reportDirectory, "commands.log"), log.join("\n"))
    await rm(temporary, { recursive: true, force: true })
  }
}

main().catch((error: Error) => {
  console.error(error.stack ?? error.message)
  process.exitCode = 1
})
