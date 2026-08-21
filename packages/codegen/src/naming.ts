import type { NamespaceStrategy } from "./types.js"

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"])

function words(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9_$]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function sanitizeIdentifier(value: string): string {
  const parts = words(value)
  if (parts.length === 0) return "_"

  const [first = "_", ...rest] = parts
  const identifier =
    first.toLowerCase() +
    rest.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("")
  const prefixed = /^[A-Za-z_$]/.test(identifier) ? identifier : `_${identifier}`
  return DANGEROUS_KEYS.has(prefixed) ? `_${prefixed}` : prefixed
}

export function sanitizeTypeIdentifier(value: string): string {
  const parts = words(value)
  const identifier =
    parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("") || "_"
  const prefixed = /^[A-Za-z_$]/.test(identifier) ? identifier : `T${identifier}`
  return DANGEROUS_KEYS.has(prefixed.toLowerCase()) ? `T${prefixed}` : prefixed
}

export function isDangerousInputName(value: string): boolean {
  return DANGEROUS_KEYS.has(value)
}

export function stripBasePath(path: string, basePath = ""): string {
  if (!basePath) return path
  const normalizedBase = `/${basePath.split("/").filter(Boolean).join("/")}`
  if (normalizedBase === "/") return path
  if (path === normalizedBase) return "/"
  return path.startsWith(`${normalizedBase}/`) ? path.slice(normalizedBase.length) : path
}

export function pathNamespace(path: string, basePath = ""): string[] {
  const relative = stripBasePath(path, basePath)
  const namespace = relative
    .split("/")
    .filter(Boolean)
    .filter(segment => !/^\{[^}]+\}$/.test(segment))
    .map(sanitizeIdentifier)
  return namespace.length > 0 ? namespace : ["root"]
}

export function operationNamespace(options: {
  readonly strategy: NamespaceStrategy
  readonly path: string
  readonly basePath?: string
  readonly tags?: readonly unknown[]
}): string[] {
  if (options.strategy === "tag") {
    const tag = options.tags?.find(value => typeof value === "string" && value.trim().length > 0)
    if (typeof tag === "string") return [sanitizeIdentifier(tag)]
  }
  return pathNamespace(options.path, options.basePath)
}

export function operationName(operation: Readonly<Record<string, unknown>>, method: string): string {
  const sdkName = operation["x-sdk-name"]
  if (typeof sdkName === "string" && sdkName.trim().length > 0) return sanitizeIdentifier(sdkName)

  const operationId = operation["operationId"]
  if (typeof operationId === "string" && operationId.trim().length > 0) {
    return sanitizeIdentifier(operationId)
  }
  return sanitizeIdentifier(method.toLowerCase())
}
