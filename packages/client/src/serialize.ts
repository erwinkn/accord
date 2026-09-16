import type {
  ParameterDescriptor,
  ParameterObject,
  ParameterValue,
  RequestObject,
  RequestValue,
} from "./types.js"

type QueryPair = readonly [name: string, value: string, allowReserved: boolean]

interface ReservedReplacementMap {
  readonly [key: string]: string
}

const RESERVED_REPLACEMENTS: ReservedReplacementMap = {
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

function isParameterObject(value: RequestValue): value is ParameterObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return false
  return true
}

export function isParameterValue(value: RequestValue): value is ParameterValue {
  if (
    value === null ||
    value instanceof Date ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return true
  }
  if (Array.isArray(value)) return value.every(isParameterValue)
  return (
    isParameterObject(value) &&
    Object.values(value).every((item) => item === undefined || isParameterValue(item))
  )
}

function requireParameterValue(value: RequestValue, name: string): ParameterValue {
  if (isParameterValue(value)) return value
  throw new TypeError(`Parameter ${name} must contain only OpenAPI parameter values`)
}

function primitive(value: ParameterValue): string {
  if (value === null) return ""
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function encodeValue(value: ParameterValue, allowReserved = false): string {
  const encoded = encodeURIComponent(primitive(value))
  if (!allowReserved) return encoded

  return encoded.replace(
    /%[0-9A-F]{2}/gi,
    (match) => RESERVED_REPLACEMENTS[match.toUpperCase()] ?? match,
  )
}

function objectEntries(value: ParameterObject): readonly (readonly [string, ParameterValue])[] {
  const entries: [string, ParameterValue][] = []
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) entries.push([key, item])
  }
  return entries
}

export function serializePathParameter(
  descriptor: ParameterDescriptor,
  value: ParameterValue,
): string {
  const name = encodeValue(descriptor.name)
  const encode = (item: ParameterValue) => encodeValue(item)

  if (descriptor.style === "matrix") {
    if (Array.isArray(value)) {
      return descriptor.explode
        ? value.map((item) => `;${name}=${encode(item)}`).join("")
        : `;${name}=${value.map(encode).join(",")}`
    }

    if (isParameterObject(value)) {
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

    if (isParameterObject(value)) {
      const entries = objectEntries(value)
      return descriptor.explode
        ? `.${entries.map(([key, item]) => `${encode(key)}=${encode(item)}`).join(".")}`
        : `.${entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(",")}`
    }

    return `.${encode(value)}`
  }

  if (Array.isArray(value)) return value.map(encode).join(",")

  if (isParameterObject(value)) {
    const entries = objectEntries(value)
    return descriptor.explode
      ? entries.map(([key, item]) => `${encode(key)}=${encode(item)}`).join(",")
      : entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(",")
  }

  return encode(value)
}

export function serializeQueryParameter(
  descriptor: ParameterDescriptor,
  value: ParameterValue,
): readonly QueryPair[] {
  const inputName = descriptor.name
  const pair = (name: string, item: ParameterValue): QueryPair => [
    name,
    primitive(item),
    descriptor.allowReserved,
  ]

  if (descriptor.style === "deepObject") {
    if (!isParameterObject(value)) {
      throw new TypeError(
        `Query parameter ${descriptor.name} with deepObject style must be an object`,
      )
    }
    return objectEntries(value).map(([key, item]) => pair(`${inputName}[${key}]`, item))
  }

  if (descriptor.style === "spaceDelimited" || descriptor.style === "pipeDelimited") {
    const delimiter = descriptor.style === "spaceDelimited" ? " " : "|"
    if (Array.isArray(value)) return [pair(inputName, value.map(primitive).join(delimiter))]
    if (isParameterObject(value)) {
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

  if (isParameterObject(value)) {
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

export function serializeHeaderParameter(
  descriptor: ParameterDescriptor,
  value: ParameterValue,
): string {
  if (Array.isArray(value)) return value.map(primitive).join(",")
  if (isParameterObject(value)) {
    const entries = objectEntries(value)
    return descriptor.explode
      ? entries.map(([key, item]) => `${key}=${primitive(item)}`).join(",")
      : entries.flatMap(([key, item]) => [key, primitive(item)]).join(",")
  }
  return primitive(value)
}

export function serializeCookieParameter(
  descriptor: ParameterDescriptor,
  value: ParameterValue,
): readonly (readonly [string, string])[] {
  if (Array.isArray(value)) {
    return descriptor.explode
      ? value.map((item) => [descriptor.name, primitive(item)] as const)
      : [[descriptor.name, value.map(primitive).join(",")]]
  }

  if (isParameterObject(value)) {
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
  input: RequestObject,
): string {
  let path = pathTemplate

  for (const descriptor of descriptors.filter((parameter) => parameter.in === "path")) {
    const inputName = descriptor.inputName ?? descriptor.name
    const value = input[inputName]
    if (value === undefined) {
      throw new TypeError(`Missing required path parameter: ${inputName}`)
    }

    const token = `{${descriptor.name}}`
    path = path
      .split(token)
      .join(serializePathParameter(descriptor, requireParameterValue(value, inputName)))
  }

  const unresolved = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).filter(Boolean)
  if (unresolved.length > 0) {
    throw new TypeError(`Unresolved path parameters: ${unresolved.join(", ")}`)
  }

  return path
}
