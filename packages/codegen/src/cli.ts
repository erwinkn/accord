#!/usr/bin/env node
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { generateFromFile, writeGeneratedSdk } from "./generate.js"
import type { AccordCodegenConfig, BodyMode, NamespaceStrategy } from "./types.js"

interface CliArguments {
  input: string
  output?: string
  configPath?: string
  namespace?: NamespaceStrategy
  bodyMode?: BodyMode
  basePath?: string
  validators?: boolean
}

interface ConfigModule {
  readonly default?: AccordCodegenConfig
}

interface MutableCodegenConfig {
  namespace?: NamespaceStrategy
  basePath?: string
  body?: NonNullable<AccordCodegenConfig["body"]>
  validators?: boolean
  operationKinds?: NonNullable<AccordCodegenConfig["operationKinds"]>
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))
  const fileConfig = args.configPath ? await importConfig(args.configPath) : {}
  const config: MutableCodegenConfig = { ...fileConfig }
  if (args.validators) config.validators = true
  if (args.namespace !== undefined) config.namespace = args.namespace
  if (args.basePath !== undefined) config.basePath = args.basePath
  if (args.bodyMode !== undefined) config.body = { ...fileConfig.body, mode: args.bodyMode }

  if (config.validators && !args.output)
    throw new TypeError("--validators requires --output so companion validators can be written")
  const result = await generateFromFile(args.input, config)
  if (args.output) await writeGeneratedSdk(args.output, result)
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

    if (value === "--validators") continue
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
  const parsed: CliArguments = { input }
  if (values.includes("--validators")) parsed.validators = true
  if (output !== undefined) parsed.output = output
  if (configPath !== undefined) parsed.configPath = configPath
  if (namespace !== undefined) parsed.namespace = namespace
  if (bodyMode !== undefined) parsed.bodyMode = bodyMode
  if (basePath !== undefined) parsed.basePath = basePath
  return parsed
}

function requireValue(option: string, value: string | undefined): string {
  if (!value || value.startsWith("-")) throw new TypeError(`${option} requires a value`)
  return value
}

async function importConfig(configPath: string): Promise<AccordCodegenConfig> {
  const module: ConfigModule = await import(pathToFileURL(resolve(configPath)).href)
  const config = module.default
  if (config === undefined) {
    throw new TypeError("Accord config must default-export an object")
  }
  return config
}

function printUsage(): void {
  process.stdout.write(
    `Usage: accord generate <openapi.yaml> [options]\n\nOptions:\n  -o, --output <file>        Generated TypeScript output (stdout by default)\n  -c, --config <file>        JavaScript/TypeScript-compatible config module\n      --namespace <strategy> path (default) or tag\n      --body-mode <mode>     merge or separate (automatic by default)\n      --validators              Generate Standard Schema response validators\n      --base-path <path>     Strip a path prefix from inferred namespaces\n  -h, --help                 Show this help\n`,
  )
}

main().catch((cause: unknown) => {
  process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`)
  process.exitCode = 1
})
