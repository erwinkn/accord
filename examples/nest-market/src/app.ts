import "reflect-metadata"
import { randomUUID } from "node:crypto"
import { type INestApplication, Module, ValidationPipe } from "@nestjs/common"
import { APP_GUARD, NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import type { NextFunction, Request, Response } from "express"
import { DemoAuthGuard, ProblemFilter } from "./common.js"
import { UploadDocumentDto } from "./documents/document.dto.js"
import { DocumentsModule } from "./documents/documents.controller.js"
import { CreateCompanyInvestorDto, CreateIndividualInvestorDto } from "./investors/investor.dto.js"
import { InvestorsModule } from "./investors/investors.controller.js"
import { CreateOfferingDto, TermsDto, UpdateOfferingDto } from "./offerings/offering.dto.js"
import { OfferingsModule } from "./offerings/offerings.controller.js"
import { CreateSubscriptionDto } from "./subscriptions/subscription.dto.js"
import { SubscriptionsModule } from "./subscriptions/subscriptions.controller.js"

@Module({
  imports: [OfferingsModule, InvestorsModule, SubscriptionsModule, DocumentsModule],
  providers: [{ provide: APP_GUARD, useClass: DemoAuthGuard }],
})
class AppModule {}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false })
  app.setGlobalPrefix("api/v1")
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  )
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
  const document = SwaggerModule.createDocument(app, config, {
    // Method names are descriptive and globally unique; Accord checks collisions.
    operationIdFactory: (_controller, method) => method,
  })
  // Swagger 7 omits additionalProperties for DTO classes. Match the server's strict
  // request DTOs explicitly; don't close response composition or nested dictionaries.
  for (const dto of [
    CreateOfferingDto,
    UpdateOfferingDto,
    TermsDto,
    CreateIndividualInvestorDto,
    CreateCompanyInvestorDto,
    CreateSubscriptionDto,
    UploadDocumentDto,
  ]) {
    const schema = document.components?.schemas?.[dto.name]
    if (
      !schema ||
      "$ref" in schema ||
      schema.type !== "object" ||
      !schema.properties ||
      schema.allOf ||
      schema.anyOf ||
      schema.oneOf
    )
      throw new Error(`Expected a concrete object schema for request DTO ${dto.name}`)
    schema.additionalProperties = false
  }
  return document
}
