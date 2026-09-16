import { isNonEmptyString } from "./object.js"
import type { JsonObject, JsonValue, NamespaceStrategy } from "./types.js"

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
    rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("")
  const prefixed = /^[A-Za-z_$]/.test(identifier) ? identifier : `_${identifier}`
  return DANGEROUS_KEYS.has(prefixed) ? `_${prefixed}` : prefixed
}

export function sanitizeTypeIdentifier(value: string): string {
  const parts = words(value)
  const identifier =
    parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("") || "_"
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
    .filter((segment) => !/^\{[^}]+\}$/.test(segment))
    .map(sanitizeIdentifier)
  return namespace.length > 0 ? namespace : ["root"]
}

export interface OperationNamespaceOptions {
  readonly strategy: NamespaceStrategy
  readonly path: string
  readonly basePath?: string
  readonly tags?: readonly JsonValue[]
}

export function operationNamespace(options: OperationNamespaceOptions): string[] {
  if (options.strategy === "tag") {
    const tag = options.tags?.find(isNonEmptyString)
    if (tag !== undefined) return [sanitizeIdentifier(tag)]
  }
  return pathNamespace(options.path, options.basePath)
}

export function fallbackOperationName(method: string, path: string): string {
  const verb = sanitizeIdentifier(method.toLowerCase())
  const parameters = [...path.matchAll(/\{([^}]+)\}/g)]
    .map((match) => match[1])
    .filter((name): name is string => name !== undefined && name.length > 0)

  if (parameters.length === 0) return verb
  return `${verb}By${parameters.map(sanitizeTypeIdentifier).join("And")}`
}

export function operationName(operation: JsonObject, method: string, path = ""): string {
  const sdkName = operation["x-sdk-name"]
  if (isNonEmptyString(sdkName)) return sanitizeIdentifier(sdkName)

  const operationId = operation["operationId"]
  if (isNonEmptyString(operationId)) return sanitizeIdentifier(operationId)
  return fallbackOperationName(method, path)
}

/** A stable identity, a short name, and progressively stronger optional qualifiers. */
export interface IdentifierRequest {
  readonly key: string
  readonly core: string
  readonly suffix?: string
  readonly qualifiers?: readonly { readonly prefix?: string; readonly suffix?: string }[]
}

/** Resolve names as a batch: every member of a collision is qualified, independent of order. */
export function allocateIdentifiers(
  requests: readonly IdentifierRequest[],
  reserved: readonly string[] = [],
): ReadonlyMap<string, string> {
  const ordered = [...requests].sort((left, right) => left.key.localeCompare(right.key))
  if (new Set(ordered.map((request) => request.key)).size !== ordered.length)
    throw new TypeError("Identifier requests must have distinct keys")
  const fixed = new Set(reserved)
  const levels = new Map(ordered.map((request) => [request.key, 0]))
  const ranks = new Map(ordered.map((request, index) => [request.key, index + 1]))
  const candidate = (request: IdentifierRequest, level: number): string => {
    const qualifiers = request.qualifiers ?? []
    if (level === 0) return `${request.core}${request.suffix ?? ""}`
    const qualifier = qualifiers[level - 1]
    if (qualifier)
      return `${qualifier.prefix ?? ""}${request.core}${qualifier.suffix ?? ""}${request.suffix ?? ""}`
    // The stable rank resolves identical sanitized names; the round handles reserved/cascading collisions.
    return `${request.core}_${ranks.get(request.key)}_${level - qualifiers.length}${request.suffix ?? ""}`
  }
  while (true) {
    const groups = new Map<string, IdentifierRequest[]>()
    for (const request of ordered) {
      const name = candidate(request, levels.get(request.key)!)
      const group = groups.get(name) ?? []
      group.push(request)
      groups.set(name, group)
    }
    let changed = false
    for (const [name, group] of groups) {
      if (group.length === 1 && !fixed.has(name)) continue
      changed = true
      let level = Math.max(...group.map((request) => levels.get(request.key)!)) + 1
      while (true) {
        const names = group.map((request) => candidate(request, level))
        if (new Set(names).size === names.length && names.every((name) => !fixed.has(name))) break
        level++
      }
      for (const request of group) levels.set(request.key, level)
    }
    if (!changed)
      return new Map(
        ordered.map((request) => [request.key, candidate(request, levels.get(request.key)!)]),
      )
  }
}
