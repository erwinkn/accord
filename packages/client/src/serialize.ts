import type { ParameterDescriptor } from "./types.js"

type Primitive = string | number | boolean | bigint | null

type QueryPair = readonly [name: string, value: string, allowReserved: boolean]

const RESERVED_REPLACEMENTS: Readonly<Record<string, string>> = {
  "%3A": ":",
  "%2F": "/",
  "%3F": "?",
  "%23": "#",
  "%5B": "[",
  "%5D": "]",
  "%40": "@",
  "%21": "!",
  "%24": "$",
  "%26": "&",
  "%27": "'",
  "%28": "(",
  "%29": ")",
  "%2A": "*",
  "%2B": "+",
  "%2C": ",",
  "%3B": ";",
  "%3D": "=",
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function primitive(value: unknown): string {
  if (value === null) return ""
  if (value instanceof Date) return value.toISOString()
  return String(value as Primitive)
}

export function encodeValue(value: unknown, allowReserved = false): string {
  const encoded = encodeURIComponent(primitive(value))
  if (!allowReserved) return encoded

  return encoded.replace(
    /%[0-9A-F]{2}/gi,
    (match) => RESERVED_REPLACEMENTS[match.toUpperCase()] ?? match,
  )
}

function objectEntries(
  value: Readonly<Record<string, unknown>>,
): readonly (readonly [string, unknown])[] {
  return Object.entries(value).filter((entry): entry is [string, unknown] => entry[1] !== undefined)
}

export function serializePathParameter(descriptor: ParameterDescriptor, value: unknown): string {
  const name = encodeValue(descriptor.name)
  const encode = (item: unknown) => encodeValue(item)

  if (descriptor.style === "matrix") {
    if (Array.isArray(value)) {
      return descriptor.explode
        ? value.map((item) => `;${name}=${encode(item)}`).join("")
        : `;${name}=${value.map(encode).join(",")}`
    }

    if (isRecord(value)) {
      const entries = objectEntries(value)
      return descriptor.explode
        ? entries.map(([key, item]) => `;${encode(key)}=${encode(item)}`).join("")
        : `;${name}=${entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(",")}`
    }

    return `;${name}=${encode(value)}`
  }

  if (descriptor.style === "label") {
    if (Array.isArray(value)) {
      return `.${value.map(encode).join(descriptor.explode ? "." : ",")}`
    }

    if (isRecord(value)) {
      const entries = objectEntries(value)
      return descriptor.explode
        ? `.${entries.map(([key, item]) => `${encode(key)}=${encode(item)}`).join(".")}`
        : `.${entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(",")}`
    }

    return `.${encode(value)}`
  }

  if (Array.isArray(value)) return value.map(encode).join(",")

  if (isRecord(value)) {
    const entries = objectEntries(value)
    return descriptor.explode
      ? entries.map(([key, item]) => `${encode(key)}=${encode(item)}`).join(",")
      : entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(",")
  }

  return encode(value)
}

export function serializeQueryParameter(
  descriptor: ParameterDescriptor,
  value: unknown,
): readonly QueryPair[] {
  const inputName = descriptor.name
  const pair = (name: string, item: unknown): QueryPair => [
    name,
    primitive(item),
    descriptor.allowReserved,
  ]

  if (descriptor.style === "deepObject") {
    if (!isRecord(value)) {
      throw new TypeError(
        `Query parameter ${descriptor.name} with deepObject style must be an object`,
      )
    }
    return objectEntries(value).map(([key, item]) => pair(`${inputName}[${key}]`, item))
  }

  if (descriptor.style === "spaceDelimited" || descriptor.style === "pipeDelimited") {
    const delimiter = descriptor.style === "spaceDelimited" ? " " : "|"
    if (Array.isArray(value)) return [pair(inputName, value.map(primitive).join(delimiter))]
    if (isRecord(value)) {
      return [
        pair(
          inputName,
          objectEntries(value)
            .flatMap(([key, item]) => [key, primitive(item)])
            .join(delimiter),
        ),
      ]
    }
    return [pair(inputName, value)]
  }

  if (Array.isArray(value)) {
    return descriptor.explode
      ? value.map((item) => pair(inputName, item))
      : [pair(inputName, value.map(primitive).join(","))]
  }

  if (isRecord(value)) {
    const entries = objectEntries(value)
    return descriptor.explode
      ? entries.map(([key, item]) => pair(key, item))
      : [pair(inputName, entries.flatMap(([key, item]) => [key, primitive(item)]).join(","))]
  }

  return [pair(inputName, value)]
}

export function renderQueryString(pairs: readonly QueryPair[]): string {
  return pairs
    .map(
      ([name, value, allowReserved]) => `${encodeValue(name)}=${encodeValue(value, allowReserved)}`,
    )
    .join("&")
}

export function serializeHeaderParameter(descriptor: ParameterDescriptor, value: unknown): string {
  if (Array.isArray(value)) return value.map(primitive).join(",")
  if (isRecord(value)) {
    const entries = objectEntries(value)
    return descriptor.explode
      ? entries.map(([key, item]) => `${key}=${primitive(item)}`).join(",")
      : entries.flatMap(([key, item]) => [key, primitive(item)]).join(",")
  }
  return primitive(value)
}

export function serializeCookieParameter(
  descriptor: ParameterDescriptor,
  value: unknown,
): readonly (readonly [string, string])[] {
  if (Array.isArray(value)) {
    return descriptor.explode
      ? value.map((item) => [descriptor.name, primitive(item)] as const)
      : [[descriptor.name, value.map(primitive).join(",")]]
  }

  if (isRecord(value)) {
    const entries = objectEntries(value)
    return descriptor.explode
      ? entries.map(([key, item]) => [key, primitive(item)] as const)
      : [[descriptor.name, entries.flatMap(([key, item]) => [key, primitive(item)]).join(",")]]
  }

  return [[descriptor.name, primitive(value)]]
}

export function interpolatePath(
  pathTemplate: string,
  descriptors: readonly ParameterDescriptor[],
  input: Readonly<Record<string, unknown>>,
): string {
  let path = pathTemplate

  for (const descriptor of descriptors.filter((parameter) => parameter.in === "path")) {
    const inputName = descriptor.inputName ?? descriptor.name
    const value = input[inputName]
    if (value === undefined) {
      throw new TypeError(`Missing required path parameter: ${inputName}`)
    }

    const token = `{${descriptor.name}}`
    path = path.split(token).join(serializePathParameter(descriptor, value))
  }

  const unresolved = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).filter(Boolean)
  if (unresolved.length > 0) {
    throw new TypeError(`Unresolved path parameters: ${unresolved.join(", ")}`)
  }

  return path
}
