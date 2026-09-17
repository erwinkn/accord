import { SwaggerModule } from "@nestjs/swagger"
import { createApplication, createOpenApiDocument } from "./app.js"

export async function startApplication() {
  const app = await createApplication({
    latency: {
      minMs: Number(process.env["LATENCY_MIN_MS"] ?? 350),
      maxMs: Number(process.env["LATENCY_MAX_MS"] ?? 1100),
    },
  })
  try {
    SwaggerModule.setup("docs", app, createOpenApiDocument(app))
    await app.listen(Number(process.env["PORT"] ?? 3100), "127.0.0.1")
    console.log(`Market API: ${await app.getUrl()}/api/v1\nSwagger UI: ${await app.getUrl()}/docs`)
    return app
  } catch (error) {
    await app.close()
    throw error
  }
}
