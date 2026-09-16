import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import { generateFromFile, writeGeneratedSdk } from "@accord/codegen"
import { createApplication, createOpenApiDocument } from "../src/app.js"

const app = await createApplication()
try {
  const document = createOpenApiDocument(app)
  // Use the same documented contract as Swagger UI, including strict request DTOs.
  await writeFile("openapi.json", `${JSON.stringify(document, null, 2)}\n`)
  const generated = await generateFromFile("openapi.json", { namespace: "tag", validators: true })
  await mkdir("sdk", { recursive: true })
  for (const file of await readdir("sdk"))
    if (/^accord-.*\.validators\.(js|d\.ts)$/.test(file)) await rm(`sdk/${file}`)
  await writeGeneratedSdk("sdk/sdk.ts", generated)
  console.log(
    `Nest → OpenAPI → Accord: ${generated.model.operations.length} endpoints; ${Object.keys(document.components?.schemas ?? {}).length} schemas`,
  )
} finally {
  await app.close()
}
