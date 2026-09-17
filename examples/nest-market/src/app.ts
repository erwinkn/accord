import "reflect-metadata"
import { randomInt, randomUUID } from "node:crypto"
import { type INestApplication, Module, ValidationPipe } from "@nestjs/common"
import { APP_GUARD, NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import type { NextFunction, Request, Response } from "express"
import { DemoAuthGuard, HttpErrorFilter } from "./common.js"
import { DocumentsModule } from "./documents/documents.controller.js"
import { InvestorsModule } from "./investors/investors.controller.js"
import { OfferingsModule } from "./offerings/offerings.controller.js"
import { SubscriptionsModule } from "./subscriptions/subscriptions.controller.js"

@Module({
  imports: [OfferingsModule, InvestorsModule, SubscriptionsModule, DocumentsModule],
  providers: [{ provide: APP_GUARD, useClass: DemoAuthGuard }],
})
class AppModule {}

export interface ApplicationOptions {
  /** Tests and code generation use no artificial delay unless requested. */
  latency?: { minMs: number; maxMs: number }
}

export async function createApplication(
  options: ApplicationOptions = {},
): Promise<INestApplication> {
  const { minMs, maxMs } = options.latency ?? { minMs: 0, maxMs: 0 }
  if (![minMs, maxMs].every(Number.isSafeInteger) || minMs < 0 || maxMs < minMs || maxMs > 10_000)
    throw new Error("Latency must be whole milliseconds with 0 <= min <= max <= 10000")
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false })
  app.setGlobalPrefix("api/v1")
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  )
  app.useGlobalFilters(new HttpErrorFilter())
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader("x-request-id", request.get("x-request-id") ?? randomUUID())
    if (!request.path.startsWith("/api/")) return next()
    const latency = randomInt(minMs, maxMs + 1)
    response.setHeader("x-demo-latency-ms", latency)
    response.setHeader("server-timing", `demo;dur=${latency};desc="Artificial latency"`)
    if (latency === 0) return next()
    const timer = setTimeout(next, latency)
    response.once("close", () => clearTimeout(timer))
  })
  return app
}

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Harbor investment platform")
    .setDescription("A runnable NestJS example: offerings, investors, subscriptions and documents.")
    .setVersion("1.0.0")
    .addServer("/", "Current origin (standalone API or development proxy)")
    .addBearerAuth({ type: "http", scheme: "bearer" }, "bearer")
    .build()
  const document = SwaggerModule.createDocument(app, config, {
    // Method names are descriptive and globally unique; Accord checks collisions.
    operationIdFactory: (_controller, method) => method,
  })
  // This example's DTO classes describe fixed records. Swagger 7 leaves them open,
  // so make their contract explicit. Nested dictionaries keep their own key rules.
  for (const [name, schema] of Object.entries(document.components?.schemas ?? {})) {
    if ("$ref" in schema || schema.type !== "object" || schema.additionalProperties !== undefined)
      continue
    if (!schema.properties || schema.allOf || schema.anyOf || schema.oneOf)
      throw new Error(`Expected a concrete object schema for DTO ${name}`)
    schema.additionalProperties = false
  }
  return document
}
