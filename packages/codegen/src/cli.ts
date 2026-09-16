#!/usr/bin/env node
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { resolve as resolveModule } from "import-meta-resolve"
import { generateFromFile, writeGeneratedFile, writeGeneratedSdk } from "./generate.js"
import type { AccordCodegenConfig, BodyMode, NamespaceStrategy } from "./types.js"
import type { ValidationAdapterModule } from "./validation-adapter.js"

interface CliArguments {
  input: string
  output?: string
  configPath?: string
  prefix?: string
  namespace?: NamespaceStrategy
  bodyMode?: BodyMode
  basePath?: string
  validators?: string
  singleFile?: boolean
}

interface ConfigModule {
  readonly default?: AccordCodegenConfig
}

interface MutableCodegenConfig {
  prefix?: string
  namespace?: NamespaceStrategy
  basePath?: string
  body?: NonNullable<AccordCodegenConfig["body"]>
  validators?: NonNullable<AccordCodegenConfig["validators"]>
  operationKinds?: NonNullable<AccordCodegenConfig["operationKinds"]>
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))
  const fileConfig = args.configPath ? await importConfig(args.configPath) : {}
  const config: MutableCodegenConfig = { ...fileConfig }
  if (args.prefix !== undefined) config.prefix = args.prefix
  if (args.validators) {
    const module: ValidationAdapterModule = await import(
      resolveModule(args.validators, pathToFileURL(resolve("package.json")).href)
    )
    config.validators = module.default()
  }
  if (args.namespace !== undefined) config.namespace = args.namespace
  if (args.basePath !== undefined) config.basePath = args.basePath
  if (args.bodyMode !== undefined) config.body = { ...fileConfig.body, mode: args.bodyMode }

  const result = await generateFromFile(args.input, config)
  if (args.output) {
    if (args.singleFile) await writeGeneratedFile(args.output, result.source)
    else await writeGeneratedSdk(args.output, result)
  } else process.stdout.write(result.source)
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
  let prefix: string | undefined
  let namespace: NamespaceStrategy | undefined
  let bodyMode: BodyMode | undefined
  let basePath: string | undefined
  let singleFile = false

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (!value) continue
    if (!value.startsWith("-")) {
      if (input !== undefined) throw new TypeError(`Unexpected positional argument ${value}`)
      input = value
      continue
    }

    if (value === "--single-file") {
      singleFile = true
      continue
    }
    if (value === "--validators") {
      index += 1
      continue
    }
    const next = args[index + 1]
    if (value === "--output" || value === "-o") {
      output = requireValue(value, next)
      index += 1
    } else if (value === "--config" || value === "-c") {
      configPath = requireValue(value, next)
      index += 1
    } else if (value === "--prefix") {
      prefix = requireValue(value, next)
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
  const parsed: CliArguments = { input, singleFile }
  const adapterIndex = values.indexOf("--validators")
  if (adapterIndex >= 0) parsed.validators = requireValue("--validators", values[adapterIndex + 1])
  if (output !== undefined) parsed.output = output
  if (configPath !== undefined) parsed.configPath = configPath
  if (prefix !== undefined) parsed.prefix = prefix
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
    `Usage: accord generate <openapi.yaml> [options]\n\nOptions:\n  -o, --output <file-or-dir> SDK entry file or directory (stdout by default)\n      --single-file         Write one file instead of modules\n  -c, --config <file>        JavaScript/TypeScript-compatible config module\n      --prefix <prefix>     SDK query/mutation key prefix (OpenAPI title by default)\n      --namespace <strategy> path (default) or tag\n      --body-mode <mode>     merge or separate (automatic by default)\n      --validators <package>  Response schema adapter, e.g. @accord/zod\n      --base-path <path>     Strip a path prefix from inferred namespaces\n  -h, --help                 Show this help\n`,
  )
}

main().catch((cause: unknown) => {
  process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`)
  process.exitCode = 1
})
