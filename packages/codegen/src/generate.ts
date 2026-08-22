import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, extname, resolve } from "node:path"
import openapiTS, { astToString } from "openapi-typescript"
import { parse as parseYaml } from "yaml"
import { AccordCodegenError } from "./diagnostics.js"
import { normalizeOpenApi } from "./normalize.js"
import { canonicalize, isObject } from "./object.js"
import { renderGeneratedModule } from "./render.js"
import type { AccordCodegenConfig, JsonValue, NormalizedApi } from "./types.js"

export interface GenerateResult {
  readonly source: string
  readonly normalized: NormalizedApi
}

export async function generate(
  document: JsonValue,
  config: AccordCodegenConfig = {},
): Promise<GenerateResult> {
  const normalized = normalizeOpenApi(document, config)
  let canonicalDocument: JsonValue
  try {
    canonicalDocument = canonicalize(document)
  } catch (error) {
    throw new AccordCodegenError([
      {
        code: "MAXIMUM_DEPTH_EXCEEDED",
        message:
          error instanceof Error ? error.message : "Could not canonicalize the OpenAPI document",
      },
    ])
  }

  if (!isObject(canonicalDocument)) {
    throw new AccordCodegenError([
      { code: "INVALID_DOCUMENT", message: "The OpenAPI document must be an object" },
    ])
  }

  const ast = await openapiTS(JSON.stringify(canonicalDocument), {
    alphabetize: true,
    immutable: true,
  })
  const schemaTypes = astToString(ast)
  return {
    source: renderGeneratedModule(normalized, schemaTypes),
    normalized,
  }
}

export async function loadOpenApiFile(filePath: string): Promise<JsonValue> {
  const absolutePath = resolve(filePath)
  const source = await readFile(absolutePath, "utf8")
  const extension = extname(absolutePath).toLowerCase()

  if (extension === ".json") {
    try {
      const document: JsonValue = JSON.parse(source)
      return document
    } catch (error) {
      throw new AccordCodegenError([
        {
          code: "INVALID_DOCUMENT",
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
          location: absolutePath,
        },
      ])
    }
  }

  try {
    const document: JsonValue = parseYaml(source)
    return document
  } catch (error) {
    throw new AccordCodegenError([
      {
        code: "INVALID_DOCUMENT",
        message: `Invalid YAML: ${error instanceof Error ? error.message : String(error)}`,
        location: absolutePath,
      },
    ])
  }
}

export async function generateFromFile(
  filePath: string,
  config: AccordCodegenConfig = {},
): Promise<GenerateResult> {
  return generate(await loadOpenApiFile(filePath), config)
}

export async function writeGeneratedFile(outputPath: string, source: string): Promise<void> {
  const absolutePath = resolve(outputPath)
  await mkdir(dirname(absolutePath), { recursive: true })
  const temporaryPath = `${absolutePath}.accord-${process.pid}.tmp`
  await writeFile(temporaryPath, source, "utf8")
  await rename(temporaryPath, absolutePath)
}
