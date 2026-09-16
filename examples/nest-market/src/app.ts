import "reflect-metadata"
import { randomUUID } from "node:crypto"
import { type INestApplication, Module, ValidationPipe } from "@nestjs/common"
import { APP_GUARD, NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import type { NextFunction, Request, Response } from "express"
import { DemoAuthGuard, ProblemFilter } from "./common.js"
import { DocumentsModule } from "./documents/documents.controller.js"
import { InvestorsModule } from "./investors/investors.controller.js"
import { OfferingsModule } from "./offerings/offerings.controller.js"
import { SubscriptionsModule } from "./subscriptions/subscriptions.controller.js"

@Module({
  imports: [OfferingsModule, InvestorsModule, SubscriptionsModule, DocumentsModule],
  providers: [{ provide: APP_GUARD, useClass: DemoAuthGuard }],
})
class AppModule {}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false })
  app.setGlobalPrefix("api/v1")
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  app.useGlobalFilters(new ProblemFilter())
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader("x-request-id", request.get("x-request-id") ?? randomUUID())
    next()
  })
  return app
}

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Harbor investment platform")
    .setDescription("A runnable NestJS example: offerings, investors, subscriptions and documents.")
    .setVersion("1.0.0")
    .addServer("http://127.0.0.1:3100", "Local example server")
    .addBearerAuth({ type: "http", scheme: "bearer" }, "bearer")
    .build()
  return SwaggerModule.createDocument(app, config, {
    // Method names are descriptive and globally unique; Accord checks collisions.
    operationIdFactory: (_controller, method) => method,
  })
}
