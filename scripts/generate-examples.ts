import { readdir, rm } from "node:fs/promises"
import { generateFromFile, writeGeneratedSdk } from "../packages/codegen/src/index.js"

for (const name of ["tasks", "imports", "assets"]) {
  for (const file of await readdir(`examples/${name}`))
    if (/^accord-.*\.validators\.(js|d\.ts)$/.test(file)) await rm(`examples/${name}/${file}`)
  const result = await generateFromFile(`examples/${name}/openapi.yaml`, {
    validators: name !== "assets",
  })
  await writeGeneratedSdk(`examples/${name}/sdk.ts`, result)
  console.log(`${name}: ${result.model.operations.length} endpoints`)
}
