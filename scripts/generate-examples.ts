import { generateFromFile, writeGeneratedSdk } from "../packages/codegen/src/index.js"

for (const name of ["tasks", "imports", "assets"]) {
  const result = await generateFromFile(`examples/${name}/openapi.yaml`, {
    validators: name !== "assets",
  })
  await writeGeneratedSdk(`examples/${name}/sdk.ts`, result)
  console.log(`${name}: ${result.model.operations.length} endpoints`)
}
