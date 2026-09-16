import { SwaggerModule } from "@nestjs/swagger"
import { createApplication, createOpenApiDocument } from "./app.js"
import { DEMO_TOKEN } from "./common.js"

const app = await createApplication()
SwaggerModule.setup("docs", app, createOpenApiDocument(app))
app.enableShutdownHooks()
const port = Number(process.env["PORT"] ?? 3100)
await app.listen(port, "127.0.0.1")
console.log(
  `Harbor API: ${await app.getUrl()}/api/v1\nSwagger UI: ${await app.getUrl()}/docs\nDemo bearer token: ${DEMO_TOKEN}`,
)
