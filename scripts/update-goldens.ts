import { writeFile } from "node:fs/promises"
import { generateFromFile } from "../packages/codegen/src/index.js"

for (const name of ["users", "features"]) {
  const result = await generateFromFile(
    `tests/fixtures/${name}.openapi.yaml`,
    name === "features" ? { basePath: "/api/v1" } : {},
  )
  const plans = result.model.operations.map((operation) => ({
    exportPath: operation.exportPath,
    plan: operation.plan,
  }))
  await writeFile(`tests/golden/${name}.normalized.json`, `${JSON.stringify(plans, null, 2)}\n`)
  if (name === "users") await writeFile("tests/golden/users.rendered.ts", result.source)
}
