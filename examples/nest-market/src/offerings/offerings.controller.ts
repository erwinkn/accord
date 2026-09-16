import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger"
import type { Response } from "express"
import { ApiPage, ApiProblems, type Page, ProblemDto, paginate } from "../common.js"
import { MarketStore, MarketStoreModule } from "../market.store.js"
import {
  CreateOfferingDto,
  OfferingDto,
  OfferingQueryDto,
  OfferingReportDto,
  UpdateOfferingDto,
} from "./offering.dto.js"

@ApiTags("offerings")
@ApiBearerAuth("bearer")
@ApiProblems()
@Controller("offerings")
export class OfferingsController {
  constructor(private readonly store: MarketStore) {}
  @Get()
  @ApiOperation({ summary: "Browse offerings with repeated status filters and pagination" })
  @ApiPage(OfferingDto)
  listOfferings(@Query() query: OfferingQueryDto): Page<OfferingDto> {
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
  @ApiConflictResponse({ type: ProblemDto })
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
