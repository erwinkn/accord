import { mkdir, rename, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { compileApi } from "./compile.js"
import { DocumentStore, readDocument, sourceUri } from "./loader.js"
import type { ApiModel } from "./model.js"
import { canonicalize } from "./object.js"
import { renderSdk } from "./render-sdk.js"
import type { AccordCodegenConfig, JsonValue } from "./types.js"
import { generateValidators } from "./validators.js"

export interface GenerateResult {
  readonly source: string
  readonly model: ApiModel
  /** Companion modules, such as standalone validators, written alongside the SDK. */
  readonly files: Readonly<Record<string, string>>
}

export async function generate(
  document: JsonValue,
  config: AccordCodegenConfig = {},
): Promise<GenerateResult> {
  const store = new DocumentStore(
    canonicalize(document),
    config.sourceUrl ? sourceUri(config.sourceUrl) : sourceUri("openapi.json"),
  )
  await store.preload()
  const compilation = compileApi(store, config)
  const validators = config.validators ? await generateValidators(compilation, store) : undefined
  return {
    source: renderSdk(compilation, validators),
    model: compilation.model,
    files: validators?.files ?? {},
  }
}

export async function loadOpenApiFile(filePath: string): Promise<JsonValue> {
  return readDocument(sourceUri(filePath))
}
export async function generateFromFile(
  filePath: string,
  config: AccordCodegenConfig = {},
): Promise<GenerateResult> {
  return generate(await loadOpenApiFile(filePath), { ...config, sourceUrl: sourceUri(filePath) })
}
export async function writeGeneratedFile(outputPath: string, source: string): Promise<void> {
  const absolute = resolve(outputPath)
  await mkdir(dirname(absolute), { recursive: true })
  const temporary = `${absolute}.accord-${process.pid}-${crypto.randomUUID()}.tmp`
  await writeFile(temporary, source, "utf8")
  await rename(temporary, absolute)
}
export async function writeGeneratedSdk(outputPath: string, result: GenerateResult): Promise<void> {
  for (const [name, source] of Object.entries(result.files))
    await writeGeneratedFile(resolve(dirname(outputPath), name), source)
  await writeGeneratedFile(outputPath, result.source)
}
