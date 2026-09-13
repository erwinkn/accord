import type { CodegenDiagnostic } from "../diagnostics.js"
import { isDangerousInputName, sanitizeIdentifier } from "../naming.js"
import {
  isBoolean,
  isNonEmptyString,
  isObject,
  isString,
  resolveObjectReference,
} from "../object.js"
import type {
  JsonObject,
  JsonValue,
  NormalizedParameter,
  ParameterLocation,
  ParameterStyle,
} from "../types.js"

const PARAMETER_LOCATIONS = new Set<string>(["path", "query", "header", "cookie"])

const STYLES_BY_LOCATION = {
  path: new Set<string>(["simple", "label", "matrix"]),
  query: new Set<string>(["form", "spaceDelimited", "pipeDelimited", "deepObject"]),
  header: new Set<string>(["simple"]),
  cookie: new Set<string>(["form"]),
} satisfies Readonly<Record<ParameterLocation, ReadonlySet<string>>>

const DEFAULT_STYLE = {
  path: "simple",
  query: "form",
  header: "simple",
  cookie: "form",
} satisfies Readonly<Record<ParameterLocation, ParameterStyle>>

function isParameterLocation(value: JsonValue | undefined): value is ParameterLocation {
  return isString(value) && PARAMETER_LOCATIONS.has(value)
}

function isParameterStyle(
  value: JsonValue | undefined,
  location: ParameterLocation,
): value is ParameterStyle {
  return isString(value) && STYLES_BY_LOCATION[location].has(value)
}

export function normalizeParameterList(
  document: JsonObject,
  value: JsonValue | undefined,
  diagnostics: CodegenDiagnostic[],
  location: string,
): readonly NormalizedParameter[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    diagnostics.push({
      code: "INVALID_PARAMETER",
      message: "parameters must be an array",
      location,
    })
    return []
  }

  const parameters: NormalizedParameter[] = []
  for (const [index, rawParameter] of value.entries()) {
    const itemLocation = `${location}/${index}`
    const parameter = resolveObjectReference(document, rawParameter, diagnostics, itemLocation)
    if (!parameter) {
      if (!isObject(rawParameter)) {
        diagnostics.push({
          code: "INVALID_PARAMETER",
          message: "Parameter must be an object or an internal reference",
          location: itemLocation,
        })
      }
      continue
    }

    const name = parameter["name"]
    const rawLocation = parameter["in"]
    if (!isNonEmptyString(name)) {
      diagnostics.push({
        code: "INVALID_PARAMETER",
        message: "Parameter name must be a non-empty string",
        location: `${itemLocation}/name`,
      })
      continue
    }
    if (!isParameterLocation(rawLocation)) {
      diagnostics.push({
        code: "INVALID_PARAMETER",
        message: `Unsupported parameter location ${String(rawLocation)}`,
        location: `${itemLocation}/in`,
      })
      continue
    }

    const required = parameter["required"] === true
    if (rawLocation === "path" && !required) {
      diagnostics.push({
        code: "INVALID_PARAMETER",
        message: "OpenAPI path parameters must set required: true",
        location: `${itemLocation}/required`,
      })
    }

    const rawStyle = parameter["style"]
    let style: ParameterStyle = DEFAULT_STYLE[rawLocation]
    if (rawStyle !== undefined) {
      if (!isParameterStyle(rawStyle, rawLocation)) {
        diagnostics.push({
          code: "UNSUPPORTED_PARAMETER_STYLE",
          message: `Style ${String(rawStyle)} is not supported for ${rawLocation} parameters`,
          location: `${itemLocation}/style`,
        })
        continue
      }
      style = rawStyle
    }

    const inputName = sanitizeIdentifier(name)
    if (isDangerousInputName(name)) {
      diagnostics.push({
        code: "DANGEROUS_INPUT_NAME",
        message: `Parameter name ${JSON.stringify(name)} is unsafe as a flattened JavaScript input property`,
        location: `${itemLocation}/name`,
      })
    }

    const rawExplode = parameter["explode"]
    parameters.push({
      name,
      inputName,
      in: rawLocation,
      required,
      style,
      explode: isBoolean(rawExplode) ? rawExplode : style === "form",
      allowReserved: rawLocation === "query" && parameter["allowReserved"] === true,
    })
  }
  return parameters
}

export function mergeParameters(
  pathParameters: readonly NormalizedParameter[],
  operationParameters: readonly NormalizedParameter[],
): readonly NormalizedParameter[] {
  const merged = new Map<string, NormalizedParameter>()
  for (const parameter of pathParameters) {
    merged.set(`${parameter.in}\0${parameter.name}`, parameter)
  }
  for (const parameter of operationParameters) {
    merged.set(`${parameter.in}\0${parameter.name}`, parameter)
  }
  return [...merged.values()].sort((left, right) => {
    const locationOrder = left.in.localeCompare(right.in)
    return locationOrder || left.name.localeCompare(right.name)
  })
}

export function validateFlattenedParameters(
  parameters: readonly NormalizedParameter[],
  diagnostics: CodegenDiagnostic[],
  location: string,
): void {
  const inputs = new Map<string, NormalizedParameter>()
  for (const parameter of parameters) {
    const previous = inputs.get(parameter.inputName)
    if (previous) {
      diagnostics.push({
        code: "INPUT_COLLISION",
        message:
          `Parameters ${previous.in}:${previous.name} and ${parameter.in}:${parameter.name} ` +
          `both flatten to input property ${parameter.inputName}`,
        location,
      })
    } else {
      inputs.set(parameter.inputName, parameter)
    }
  }
}

export function validatePathParameters(
  path: string,
  parameters: readonly NormalizedParameter[],
  diagnostics: CodegenDiagnostic[],
  location: string,
): void {
  const placeholders = new Set(
    [...path.matchAll(/\{([^}]+)\}/g)]
      .map((match) => match[1])
      .filter((name): name is string => Boolean(name)),
  )
  const pathParameters = new Set(
    parameters.filter((parameter) => parameter.in === "path").map((parameter) => parameter.name),
  )

  for (const placeholder of placeholders) {
    if (!pathParameters.has(placeholder)) {
      diagnostics.push({
        code: "INVALID_PARAMETER",
        message: `Path placeholder {${placeholder}} has no matching path parameter`,
        location,
      })
    }
  }
  for (const parameter of pathParameters) {
    if (!placeholders.has(parameter)) {
      diagnostics.push({
        code: "INVALID_PARAMETER",
        message: `Path parameter ${parameter} has no matching placeholder in ${path}`,
        location,
      })
    }
  }
}
