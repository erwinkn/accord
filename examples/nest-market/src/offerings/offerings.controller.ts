import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  type MessageEvent,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  Sse,
} from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtension,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger"
import type { Response } from "express"
import type { Observable } from "rxjs"
import { ErrorDto, paginate } from "../common.js"
import { DocumentDto } from "../documents/document.dto.js"
import { MarketStore, MarketStoreModule } from "../market.store.js"
import { SubscriptionDto } from "../subscriptions/subscription.dto.js"
import { StreamStatusDto } from "./event.dto.js"
import {
  CreateOfferingDto,
  OfferingDto,
  OfferingDtoPage,
  OfferingQueryDto,
  OfferingReportDto,
  UpdateOfferingDto,
} from "./offering.dto.js"

@ApiTags("offerings")
@ApiBearerAuth("bearer")
@ApiBadRequestResponse({ type: ErrorDto })
@ApiUnauthorizedResponse({ type: ErrorDto })
@ApiNotFoundResponse({ type: ErrorDto })
@Controller("offerings")
export class OfferingsController {
  constructor(private readonly store: MarketStore) {}

  @Sse(":offeringId/events")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiOperation({ summary: "Watch live offering, subscription and document activity" })
  @ApiExtraModels(StreamStatusDto, SubscriptionDto, DocumentDto, OfferingDto)
  @ApiOkResponse({ content: { "text/event-stream": { schema: { type: "string" } } } })
  @ApiExtension("x-accord-sse", {
    events: {
      connected: {
        mediaType: "application/json",
        schema: { $ref: getSchemaPath(StreamStatusDto) },
      },
      heartbeat: {
        mediaType: "application/json",
        schema: { $ref: getSchemaPath(StreamStatusDto) },
      },
      "offering.updated": {
        mediaType: "application/json",
        schema: { $ref: getSchemaPath(OfferingDto) },
      },
      "subscription.created": {
        mediaType: "application/json",
        schema: { $ref: getSchemaPath(SubscriptionDto) },
      },
      "subscription.submitted": {
        mediaType: "application/json",
        schema: { $ref: getSchemaPath(SubscriptionDto) },
      },
      "document.uploaded": {
        mediaType: "application/json",
        schema: { $ref: getSchemaPath(DocumentDto) },
      },
    },
  })
  watchOffering(@Param("offeringId", ParseUUIDPipe) offeringId: string): Observable<MessageEvent> {
    return this.store.watchOffering(offeringId)
  }

  @Get()
  @ApiOperation({ summary: "Browse offerings with repeated status filters and pagination" })
  @ApiOkResponse({ type: OfferingDtoPage })
  listOfferings(@Query() query: OfferingQueryDto): OfferingDtoPage {
    return paginate(this.store.listOfferings(query.status), query)
  }

  @Post()
  @ApiOperation({ summary: "Create an offering with nested terms and an exact decimal amount" })
  @ApiCreatedResponse({ type: OfferingDto })
  createOffering(@Body() input: CreateOfferingDto): OfferingDto {
    return this.store.createOffering(input)
  }

  @Get(":offeringId")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiOkResponse({ type: OfferingDto })
  getOffering(@Param("offeringId", ParseUUIDPipe) offeringId: string): OfferingDto {
    return this.store.offering(offeringId)
  }

  @Patch(":offeringId")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiBody({ type: UpdateOfferingDto, required: false })
  @ApiOperation({ summary: "Update supplied fields; clear description explicitly with null" })
  @ApiOkResponse({ type: OfferingDto })
  updateOffering(
    @Param("offeringId", ParseUUIDPipe) offeringId: string,
    @Body() input: UpdateOfferingDto = {},
  ): OfferingDto {
    return this.store.updateOffering(offeringId, input)
  }

  @Delete(":offeringId")
  @HttpCode(204)
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiNoContentResponse()
  @ApiConflictResponse({ type: ErrorDto })
  deleteOffering(@Param("offeringId", ParseUUIDPipe) offeringId: string): void {
    this.store.deleteOffering(offeringId)
  }

  @Get(":offeringId/report")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiOperation({ summary: "Return JSON or CSV selected by the Accept request header" })
  @ApiExtraModels(OfferingReportDto)
  @ApiResponse({
    status: 200,
    content: {
      "application/json": { schema: { $ref: getSchemaPath(OfferingReportDto) } },
      "text/csv": { schema: { type: "string" } },
    },
  })
  exportOffering(
    @Param("offeringId", ParseUUIDPipe) offeringId: string,
    @Headers("accept") accept: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): OfferingReportDto | string {
    const offering = this.store.offering(offeringId)
    const subscriptionCount = this.store.listSubscriptions(offeringId).length
    if (accept?.includes("text/csv")) {
      response.type("text/csv")
      return `offeringId,subscriptionCount,currency\n${offering.id},${subscriptionCount},${offering.terms.currency}\n`
    }
    return { offeringId, subscriptionCount, currency: offering.terms.currency }
  }
}

@Module({ imports: [MarketStoreModule], controllers: [OfferingsController] })
export class OfferingsModule {}
