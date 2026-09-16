import { compileApi } from "./compile.js"
import { DocumentStore, readDocument, sourceUri } from "./loader.js"
import type { ApiModel } from "./model.js"
import { canonicalize } from "./object.js"
import { renderSdk } from "./render-sdk.js"
import type { AccordCodegenConfig, JsonValue } from "./types.js"
import { generateValidators } from "./validators.js"

export { writeGeneratedFile, writeGeneratedSdk } from "./write-sdk.js"

export interface GenerateResult {
  /** Complete single-file rendering, suitable for stdout. */
  readonly source: string
  /** SDK modules, with index.ts as the public entry point. */
  readonly files: Readonly<Record<string, string>>
  readonly model: ApiModel
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
  const validators = config.validators
    ? await generateValidators(compilation, store, config.validators)
    : undefined
  return {
    ...renderSdk(compilation, validators),
    model: compilation.model,
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
