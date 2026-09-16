import { zodAdapter } from "@accord/zod"
import { generateFromFile, writeGeneratedSdk } from "../packages/codegen/src/index.js"

for (const name of ["tasks", "imports", "assets"]) {
  const config = name === "assets" ? {} : { validators: zodAdapter() }
  const result = await generateFromFile(`examples/${name}/openapi.yaml`, config)
  await writeGeneratedSdk(`examples/${name}/sdk.ts`, result)
  console.log(`${name}: ${result.model.operations.length} endpoints`)
}
