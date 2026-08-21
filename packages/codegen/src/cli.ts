#!/usr/bin/env node
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
import { generateFromFile, writeGeneratedFile } from "./generate.js"
import type { AccordCodegenConfig, BodyMode, NamespaceStrategy } from "./types.js"

interface CliArguments {
  readonly input: string
  readonly output?: string
  readonly configPath?: string
  readonly namespace?: NamespaceStrategy
  readonly bodyMode?: BodyMode
  readonly basePath?: string
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))
  const fileConfig = args.configPath ? await importConfig(args.configPath) : {}
  const config: AccordCodegenConfig = {
    ...fileConfig,
    ...(args.namespace !== undefined ? { namespace: args.namespace } : {}),
    ...(args.basePath !== undefined ? { basePath: args.basePath } : {}),
    ...(args.bodyMode !== undefined
      ? { body: { ...fileConfig.body, mode: args.bodyMode } }
      : {}),
  }
  const result = await generateFromFile(args.input, config)
  if (args.output) await writeGeneratedFile(args.output, result.source)
  else process.stdout.write(result.source)
}

function parseArguments(values: readonly string[]): CliArguments {
  const args = [...values]
  if (args[0] === "generate") args.shift()
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage()
    process.exit(args.length === 0 ? 1 : 0)
  }

  let input: string | undefined
  let output: string | undefined
  let configPath: string | undefined
  let namespace: NamespaceStrategy | undefined
  let bodyMode: BodyMode | undefined
  let basePath: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (!value) continue
    if (!value.startsWith("-")) {
      if (input !== undefined) throw new TypeError(`Unexpected positional argument ${value}`)
      input = value
      continue
    }

    const next = args[index + 1]
    if (value === "--output" || value === "-o") {
      output = requireValue(value, next)
      index += 1
    } else if (value === "--config" || value === "-c") {
      configPath = requireValue(value, next)
      index += 1
    } else if (value === "--namespace") {
      const candidate = requireValue(value, next)
      if (candidate !== "path" && candidate !== "tag") {
        throw new TypeError("--namespace must be path or tag")
      }
      namespace = candidate
      index += 1
    } else if (value === "--body-mode") {
      const candidate = requireValue(value, next)
      if (candidate !== "merge" && candidate !== "separate") {
        throw new TypeError("--body-mode must be merge or separate")
      }
      bodyMode = candidate
      index += 1
    } else if (value === "--base-path") {
      basePath = requireValue(value, next)
      index += 1
    } else {
      throw new TypeError(`Unknown option ${value}`)
    }
  }

  if (!input) throw new TypeError("An OpenAPI input file is required")
  return {
    input,
    ...(output !== undefined ? { output } : {}),
    ...(configPath !== undefined ? { configPath } : {}),
    ...(namespace !== undefined ? { namespace } : {}),
    ...(bodyMode !== undefined ? { bodyMode } : {}),
    ...(basePath !== undefined ? { basePath } : {}),
  }
}

function requireValue(option: string, value: string | undefined): string {
  if (!value || value.startsWith("-")) throw new TypeError(`${option} requires a value`)
  return value
}

async function importConfig(configPath: string): Promise<AccordCodegenConfig> {
  const module = (await import(pathToFileURL(resolve(configPath)).href)) as {
    readonly default?: unknown
  }
  const config = module.default
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Accord config must default-export an object")
  }
  return config as AccordCodegenConfig
}

function printUsage(): void {
  process.stdout.write(`Usage: accord generate <openapi.yaml> [options]\n\nOptions:\n  -o, --output <file>        Generated TypeScript output (stdout by default)\n  -c, --config <file>        JavaScript/TypeScript-compatible config module\n      --namespace <strategy> path (default) or tag\n      --body-mode <mode>     merge (default) or separate\n      --base-path <path>     Strip a path prefix from inferred namespaces\n  -h, --help                 Show this help\n`)
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
