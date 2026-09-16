import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { zodAdapter } from "@accord/zod"
import { expect, it } from "vitest"
import { generate, writeGeneratedFile, writeGeneratedSdk } from "../src/generate.js"

const document = (names: readonly string[]) => ({
  openapi: "3.1.0",
  info: { title: "Modules", version: "1" },
  paths: Object.fromEntries(
    names.map((name) => [
      `/${name}`,
      {
        get: {
          operationId: `${name}Get`,
          responses: {
            200: {
              description: "ok",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
        },
      },
    ]),
  ),
})

it("regenerates a directory, removing obsolete modules and validators while preserving other files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "accord-regenerate-"))
  try {
    const before = await generate(document(["users", "pets", "orders"]), {
      validators: zodAdapter(),
    })
    await writeGeneratedSdk(directory, before)
    for (const [path, source] of Object.entries(before.files))
      expect(await readFile(join(directory, path), "utf8")).toBe(source)
    await writeFile(join(directory, "notes.ts"), "// handwritten\n")
    await writeFile(join(directory, "types/orders.ts"), "// edited obsolete module\n")
    const after = await generate(document(["users"]))
    await writeGeneratedSdk(directory, after)
    await expect(readFile(join(directory, "endpoints/pets.ts"))).rejects.toMatchObject({
      code: "ENOENT",
    })
    await expect(readFile(join(directory, "types/pets.ts"))).rejects.toMatchObject({
      code: "ENOENT",
    })
    await expect(readFile(join(directory, "schemas.ts"))).rejects.toMatchObject({ code: "ENOENT" })
    expect(await readFile(join(directory, "notes.ts"), "utf8")).toBe("// handwritten\n")
    expect(await readFile(join(directory, "types/orders.ts"), "utf8")).toBe(
      "// edited obsolete module\n",
    )
    expect(await readFile(join(directory, "index.ts"), "utf8")).toBe(after.files["index.ts"])
    const manifest = await readFile(join(directory, ".accord-manifest.json"), "utf8")
    await writeGeneratedSdk(directory, after)
    expect(await readFile(join(directory, ".accord-manifest.json"), "utf8")).toBe(manifest)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

it("isolates adjacent SDKs and still supports explicitly writing a single file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "accord-adjacent-"))
  try {
    const result = await generate(document(["users"]))
    await writeGeneratedSdk(join(directory, "first.ts"), result)
    await writeGeneratedSdk(join(directory, "second.ts"), result)
    await writeGeneratedFile(join(directory, "single.ts"), result.source)
    expect(await readFile(join(directory, "first.ts"), "utf8")).toContain(
      "./first/endpoints/users.js",
    )
    expect(await readFile(join(directory, "second.ts"), "utf8")).toContain(
      "./second/endpoints/users.js",
    )
    expect(await readFile(join(directory, "single.ts"), "utf8")).toBe(result.source)
    expect(await readdir(directory)).toEqual([
      "first",
      "first.ts",
      "second",
      "second.ts",
      "single.ts",
    ])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

it("rejects traversal in module paths or cleanup manifests and refuses symlinked output modules", async () => {
  const directory = await mkdtemp(join(tmpdir(), "accord-safe-output-"))
  try {
    const result = await generate(document(["users"]))
    await expect(
      writeGeneratedSdk(directory, { ...result, files: { ...result.files, "../escape.ts": "" } }),
    ).rejects.toThrow("Invalid generated SDK path")
    await writeFile(
      join(directory, ".accord-manifest.json"),
      JSON.stringify({ version: 1, files: { "../escape.ts": "0".repeat(64) } }),
    )
    await expect(writeGeneratedSdk(directory, result)).rejects.toThrow(
      "Invalid Accord output manifest entry",
    )
    await rm(join(directory, ".accord-manifest.json"))
    await mkdir(join(directory, "handwritten"))
    await symlink(join(directory, "handwritten"), join(directory, "endpoints"))
    await expect(writeGeneratedSdk(directory, result)).rejects.toThrow("symlink")
    expect(await readdir(join(directory, "handwritten"))).toEqual([])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

it("uses portable unique module names and keeps reserved namespace names as object keys", async () => {
  const { files } = await generate(document(["con", "default", "CON-api", "models", "shared"]))
  const paths = Object.keys(files)
  expect(new Set(paths.map((path) => path.toLowerCase())).size).toBe(paths.length)
  expect(paths).toContain("endpoints/conApi.ts")
  expect(paths).toContain("types/models.ts")
  expect(paths).not.toContain("models.ts")
  expect(files["types/models.ts"]).toContain("Contract")
  expect(paths).not.toContain("types/shared.ts")
  expect(files["types/sharedApi.ts"]).toContain("Contract")
  expect(files["index.ts"]).toContain('"models": modelsEndpoints')
  expect(files["index.ts"]).toContain('"shared": sharedApiEndpoints')
  expect(files["index.ts"]).toContain('"default": defaultEndpoints')
})
