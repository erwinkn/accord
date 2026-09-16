import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { responseDocument } from "./fixture.js"
import { root } from "./harness.js"

interface PackedManifest {
  readonly name: string
  readonly version: string
  readonly dependencies?: Readonly<Record<string, string>>
}

async function main(): Promise<void> {
  const temporary = await mkdtemp(join(tmpdir(), "accord-package-test-"))
  const reportDirectory = join(root, "artifacts", "distribution")
  await mkdir(reportDirectory, { recursive: true })
  const log: string[] = []
  const command = (cwd: string, executable: string, args: string[]): Promise<string> => {
    log.push(`$ ${executable} ${args.join(" ")}`)
    return new Promise((resolve, reject) => {
      execFile(
        executable,
        args,
        { cwd, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout, stderr) => {
          log.push(stdout, stderr)
          if (error) {
            console.error(stdout, stderr)
            reject(error)
          } else {
            resolve(stdout)
          }
        },
      )
    })
  }
  try {
    const tarballs = join(temporary, "tarballs")
    const installed = join(temporary, "consumer")
    await mkdir(tarballs)
    await mkdir(installed)
    for (const name of ["client", "codegen", "react-query", "zod"]) {
      await command(join(root, "packages", name), "pnpm", ["pack", "--pack-destination", tarballs])
    }
    const files = await readdir(tarballs)
    const packageTarball = (name: string): string => {
      const file = files.find((item) => item.startsWith(`accord-${name}-`) && item.endsWith(".tgz"))
      assert(file, `Missing ${name} tarball`)
      return `file:${join(tarballs, file)}`
    }
    const dependencies = {
      "@accord/client": packageTarball("client"),
      "@accord/codegen": packageTarball("codegen"),
      "@accord/react-query": packageTarball("react-query"),
      "@accord/zod": packageTarball("zod"),
      zod: "4.4.3",
      "@tanstack/react-query": "5.101.4",
      react: "19.2.8",
      typescript: "5.9.3",
      esbuild: "0.28.2",
      "@types/node": "26.2.0",
      "@types/react": "^19.2.0",
    }
    await writeFile(
      join(installed, "package.json"),
      JSON.stringify({
        name: "accord-install-smoke",
        private: true,
        type: "module",
        packageManager: "pnpm@11.22.0",
        dependencies,
      }),
    )
    const clientManifest: PackedManifest = JSON.parse(
      await command(installed, "tar", [
        "-xOf",
        dependencies["@accord/client"].slice(5),
        "package/package.json",
      ]),
    )
    const queryManifest: PackedManifest = JSON.parse(
      await command(installed, "tar", [
        "-xOf",
        dependencies["@accord/react-query"].slice(5),
        "package/package.json",
      ]),
    )
    assert.equal(clientManifest.name, "@accord/client")
    for (const name of ["client", "codegen"]) {
      const manifest: PackedManifest = JSON.parse(
        await command(installed, "tar", [
          "-xOf",
          packageTarball(name).slice(5),
          "package/package.json",
        ]),
      )
      for (const dependency of ["ajv", "ajv-formats", "zod", "@accord/zod"])
        assert.equal(
          manifest.dependencies?.[dependency],
          undefined,
          `Core ${name} must not depend on ${dependency}`,
        )
    }
    assert.equal(
      queryManifest.dependencies?.["@accord/client"],
      clientManifest.version,
      "Packed workspace dependency must reference the actual client release version",
    )
    // Resolve the unpublished sibling release to its real tarball. Do not add missing dependencies
    // or rewrite package contents; the manifest assertion above protects that publication contract.
    await writeFile(
      join(installed, "pnpm-workspace.yaml"),
      JSON.stringify({
        overrides: {
          [`@accord/client@${clientManifest.version}`]: dependencies["@accord/client"],
          [`@accord/codegen@${clientManifest.version}`]: dependencies["@accord/codegen"],
        },
      }),
    )
    // Outside the repository: workspace links, root imports, and source aliases cannot rescue broken packages.
    await command(installed, "pnpm", [
      "install",
      "--ignore-scripts",
      "--no-frozen-lockfile",
      "--store-dir",
      join(root, "node_modules/.cache/distribution-store"),
      "--cache-dir",
      join(root, "node_modules/.cache/distribution-cache"),
    ])
    await writeFile(
      join(installed, "openapi.json"),
      JSON.stringify(
        responseDocument({
          type: "object",
          required: ["message"],
          additionalProperties: false,
          properties: { message: { type: "string" } },
          patternProperties: { "^x-": { type: "string" } },
        }),
      ),
    )
    const help = await command(installed, "pnpm", ["exec", "accord", "--help"])
    assert.match(help, /Usage: accord/)
    await command(installed, "pnpm", [
      "exec",
      "accord",
      "generate",
      "openapi.json",
      "--output",
      "generated.ts",
      "--validators",
      "@accord/zod",
    ])
    const stdoutSdk = await command(installed, "pnpm", [
      "exec",
      "accord",
      "generate",
      "openapi.json",
      "--validators",
      "@accord/zod",
    ])
    await command(installed, "pnpm", [
      "exec",
      "accord",
      "generate",
      "openapi.json",
      "--validators",
      "@accord/zod",
      "--single-file",
      "--output",
      "single.ts",
    ])
    assert.equal(stdoutSdk, await readFile(join(installed, "single.ts"), "utf8"))
    assert.match(
      await readFile(join(installed, "generated.ts"), "utf8"),
      /generated\/endpoints\/probe\.js/,
    )
    for (const file of ["models.ts", "schemas.ts", "types/probe.ts", "endpoints/probe.ts"])
      assert((await readFile(join(installed, "generated", file), "utf8")).length > 0)
    assert(!(await readdir(installed)).some((name) => name.includes(".validators.")))
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
import { createClient, ValidationError } from "@accord/client"
import { apiQuery } from "@accord/react-query"
import { api } from "./generated.js"
const client = createClient(api, { baseUrl: "https://example.test/api", fetch: async input => {
  assert.equal(String(input), "https://example.test/api/probe")
  return Response.json({ message: "ok" })
} })
assert.deepEqual(await client.probe.call(), { message: "ok" })
await assert.rejects(createClient(api, {fetch:async () => Response.json({message:42})}).probe.call(), ValidationError)
assert.equal(apiQuery(api.probe.call, {}).queryKey[0], "accord")
for (const name of ["@accord/client", "@accord/codegen", "@accord/react-query", "@accord/zod"]) {
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
      "false",
      "--exactOptionalPropertyTypes",
      "--noUncheckedIndexedAccess",
      "consumer.ts",
    ])
    await command(installed, "node", ["consumer.js"])
    await writeFile(
      join(installed, "browser.ts"),
      'import { createClient } from "@accord/client"; import { api } from "./generated.js"; export const client = createClient(api)\n',
    )
    await command(installed, "pnpm", [
      "exec",
      "esbuild",
      "browser.ts",
      "--bundle",
      "--format=esm",
      "--platform=browser",
      "--target=es2022",
      "--outfile=browser.js",
    ])

    await writeFile(
      join(reportDirectory, "report.json"),
      JSON.stringify(
        {
          passed: true,
          packages: files,
          checks: [
            "packed-sibling-dependency-manifest",
            "clean-install",
            "cli-help",
            "cli-generation",
            "modular-sdk-with-native-schemas",
            "single-file-option-and-stdout",
            "config-import",
            "semantic-consumer-compile-with-declaration-checking",
            "native-zod-generation-and-execution",
            "browser-bundle",
            "runtime-imports-and-request",
          ],
        },
        null,
        2,
      ),
    )
    console.log(
      "Distribution passed: all four packed packages installed outside the workspace and used by a compiled consumer",
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
