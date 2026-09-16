import { createHash } from "node:crypto"
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { basename, dirname, join, resolve } from "node:path"
import ts from "typescript"
import type { GenerateResult } from "./generate.js"
import { isObject, isString } from "./object.js"
import type { JsonValue } from "./types.js"

const manifestName = ".accord-manifest.json"
const hash = (source: string) => createHash("sha256").update(source).digest("hex")

export async function writeGeneratedFile(outputPath: string, source: string): Promise<void> {
  const absolute = resolve(outputPath)
  await mkdir(dirname(absolute), { recursive: true })
  const temporary = `${absolute}.accord-${process.pid}-${crypto.randomUUID()}.tmp`
  try {
    await writeFile(temporary, source, "utf8")
    await rename(temporary, absolute)
  } finally {
    await rm(temporary, { force: true })
  }
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8")
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined
    throw error
  }
}

function validModulePath(path: string): boolean {
  return /^(?:[a-zA-Z0-9_$-]+\/)*[a-zA-Z0-9_$-]+\.ts$/.test(path)
}

async function assertNoSymlinks(root: string, path: string): Promise<void> {
  let current = root
  for (const part of ["", ...path.split("/")]) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing to write SDK through a symlink: ${current}`)
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") continue
      throw error
    }
  }
}

async function readManifest(path: string): Promise<Readonly<Record<string, string>>> {
  const source = await readOptional(path)
  if (source === undefined) return {}
  const value: JsonValue = JSON.parse(source)
  if (!isObject(value) || value["version"] !== 1 || !isObject(value["files"]))
    throw new Error(`Invalid Accord output manifest: ${path}`)
  const entries: [string, string][] = []
  for (const [file, checksum] of Object.entries(value["files"])) {
    if (!validModulePath(file) || !isString(checksum) || !/^[a-f0-9]{64}$/.test(checksum))
      throw new Error(`Invalid Accord output manifest entry: ${file}`)
    entries.push([file, checksum])
  }
  return Object.fromEntries(entries)
}

/** Rebase module specifiers only; never replace spec-owned string literals. */
function rebaseEntry(source: string, directory: string): string {
  const file = ts.createSourceFile("index.ts", source, ts.ScriptTarget.Latest, true)
  const replacements: { start: number; end: number; text: string }[] = []
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue
    const specifier = statement.moduleSpecifier
    if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith("./"))
      replacements.push({
        start: specifier.getStart(file),
        end: specifier.getEnd(),
        text: JSON.stringify(`./${directory}/${specifier.text.slice(2)}`),
      })
  }
  let result = source
  for (const replacement of replacements.reverse())
    result = result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end)
  return result
}

/**
 * A directory target gets index.ts; a .ts target keeps that entry filename and
 * stores its modules in an adjacent directory named after the file.
 */
export async function writeGeneratedSdk(outputPath: string, result: GenerateResult): Promise<void> {
  const absolute = resolve(outputPath)
  const fileTarget = /\.(?:[cm]?ts|tsx)$/.test(absolute)
  const directory = fileTarget ? absolute.replace(/\.(?:[cm]?ts|tsx)$/, "") : absolute
  const entry = result.files["index.ts"]
  if (entry === undefined) throw new Error("Generated SDK is missing index.ts")
  const modules = Object.entries(result.files).filter(
    ([path]) => !fileTarget || path !== "index.ts",
  )
  for (const [path] of modules) {
    if (!validModulePath(path)) throw new Error(`Invalid generated SDK path: ${path}`)
    await assertNoSymlinks(directory, path)
  }
  await assertNoSymlinks(directory, manifestName)
  const previous = await readManifest(join(directory, manifestName))
  // Validate every cleanup target before writing. Only unmodified, previously owned files are removed.
  const stale: string[] = []
  const next = new Map(modules)
  for (const [path, checksum] of Object.entries(previous)) {
    if (next.has(path)) continue
    await assertNoSymlinks(directory, path)
    const source = await readOptional(join(directory, path))
    if (source !== undefined && hash(source) === checksum) stale.push(path)
  }
  for (const [path, source] of modules)
    if (path !== "index.ts") await writeGeneratedFile(join(directory, path), source)
  await writeGeneratedFile(
    fileTarget ? absolute : join(directory, "index.ts"),
    fileTarget ? rebaseEntry(entry, basename(directory)) : entry,
  )
  for (const path of stale) await rm(join(directory, path))
  await writeGeneratedFile(
    join(directory, manifestName),
    `${JSON.stringify({ version: 1, files: Object.fromEntries(modules.map(([path, source]) => [path, hash(source)])) }, null, 2)}\n`,
  )
}
