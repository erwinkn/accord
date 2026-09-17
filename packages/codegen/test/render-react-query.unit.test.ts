import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"
import { generate, generateFromFile } from "../src/generate.js"

const fixture = fileURLToPath(
  new URL("../../../tests/fixtures/users.openapi.yaml", import.meta.url),
)

it.each([
  ["market", "Market", "market"],
  ["harbor-market", "HarborMarket", "harborMarket"],
  ["123 market", "T123Market", "_123Market"],
])("generates readable, branded React exports for %s", async (prefix, typeName, name) => {
  const result = await generateFromFile(fixture, { prefix, reactQuery: true })
  const source = result.files["react-query.ts"]!
  expect(source).toContain(`Provider: ${typeName}Provider`)
  expect(source).toContain(`useQuery: use${typeName}`)
  expect(source).toContain(`useMutation: use${typeName}Mutation`)
  expect(source).toContain(`apiQuery as ${name}Query`)
  expect(source).toContain(`apiMutationCall as ${name}MutationCall`)
  expect(result.source).toContain(`useQuery: use${typeName}`)
  // The ordinary API entry stays usable in Node and non-React applications.
  expect(result.files["index.ts"]).not.toContain("react-query")
  expect(result.files["index.ts"]).not.toContain("createQueryHooks")
})

it("does not introduce React dependencies when integration is disabled", async () => {
  const result = await generateFromFile(fixture)
  expect(result.files["react-query.ts"]).toBeUndefined()
  expect(result.source).not.toContain("@accord/react-query")
})

it("reserves branded names during shared model naming", async () => {
  const result = await generate(
    {
      openapi: "3.1.0",
      info: { title: "Market", version: "1" },
      paths: {},
      components: { schemas: { MarketProvider: { type: "string" } } },
    },
    { prefix: "market", reactQuery: true },
  )
  expect(result.source).not.toContain("export type MarketProvider =")
  expect(result.source).toContain("export type ResponseMarketProvider = string")
  expect(result.files["types/shared.ts"]).toContain("ResponseMarketProvider")
})
