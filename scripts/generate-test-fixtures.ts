import { fileURLToPath } from "node:url"
import { generateFromFile, writeGeneratedFile } from "../packages/codegen/src/index.js"

const root = fileURLToPath(new URL("..", import.meta.url))

const fixtures = [
  {
    input: `${root}/tests/fixtures/users.openapi.yaml`,
    output: `${root}/tests/generated/users.ts`,
    config: {},
  },
  {
    input: `${root}/tests/fixtures/features.openapi.yaml`,
    output: `${root}/tests/generated/features.ts`,
    config: { basePath: "/api/v1" },
  },
] as const

for (const fixture of fixtures) {
  const result = await generateFromFile(fixture.input, fixture.config)
  await writeGeneratedFile(fixture.output, result.source)
}
