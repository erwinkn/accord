import type { JsonObject, JsonValue } from "@accord/codegen"

export const references = {
  parameter: "https://spec.openapis.org/oas/v3.1.1.html#parameter-object",
  schema: "https://spec.openapis.org/oas/v3.1.1.html#schema-object",
  body: "https://spec.openapis.org/oas/v3.1.1.html#request-body-object",
  encoding: "https://spec.openapis.org/oas/v3.1.1.html#encoding-object",
  response: "https://spec.openapis.org/oas/v3.1.1.html#response-object",
  reference:
    "https://spec.openapis.org/oas/v3.1.1.html#relative-references-in-api-description-uris",
  query: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys",
  accord: "docs/testing.md#accord-specific-contracts",
} as const

export const stringSchema = { type: "string" } as const
export const integerSchema = { type: "integer" } as const
export const arraySchema = { type: "array", items: stringSchema } as const
export const objectSchema = {
  type: "object",
  properties: { role: stringSchema, firstName: stringSchema },
  required: ["role", "firstName"],
  additionalProperties: false,
} as const

export function document(paths: JsonObject, components: JsonObject = {}): JsonObject {
  return {
    openapi: "3.1.0",
    info: { title: "Accord conformance", version: "1" },
    paths,
    components,
  }
}

export function operation(overrides: JsonObject = {}): JsonObject {
  return { operationId: "call", responses: { "204": { description: "No content" } }, ...overrides }
}

export function endpoint(overrides: JsonObject = {}, method = "get", path = "/probe"): JsonObject {
  return document({ [path]: { [method]: operation(overrides) } })
}

export function bodyDocument(
  schema: JsonValue,
  mediaType = "application/json",
  required = true,
  mediaOverrides: JsonObject = {},
): JsonObject {
  return endpoint(
    {
      requestBody: { required, content: { [mediaType]: { schema, ...mediaOverrides } } },
    },
    "post",
  )
}

export function responseDocument(schema: JsonValue, mediaType = "application/json"): JsonObject {
  return endpoint({
    responses: { "200": { description: "OK", content: { [mediaType]: { schema } } } },
  })
}

/** Fixture source is compiled against public package declarations before it is executed. */
export function consumer(body: string): string {
  return [
    'import assert from "node:assert/strict"',
    'import { createClient, createEndpointClient, HttpError } from "@accord/client"',
    'import type { InputOf, ResponseOf, ErrorOf, ResponsesOf } from "@accord/client"',
    'import { apiQuery, apiMutation, apiQueryKey, apiMutationKey } from "@accord/react-query"',
    'import { QueryClient } from "@tanstack/react-query"',
    'import { api } from "./generated.js"',
    'import { withServer } from "./server.js"',
    "type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false",
    "type Expect<T extends true> = T",
    body,
  ].join("\n")
}

export function wireConsumer(input: JsonValue, assertion: string): string {
  return consumer(`export async function run() {
  await withServer(async (baseUrl, requests) => {
    const client = createClient(api, { baseUrl })
    await client.probe.call(${JSON.stringify(input)})
    assert.equal(requests.length, 1)
    const request = requests[0]!
    ${assertion}
  })
}`)
}
