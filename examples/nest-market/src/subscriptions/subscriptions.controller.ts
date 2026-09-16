import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Module,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common"
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger"
import type { Response } from "express"
import { ApiErrors, ApiPage, type Page, paginate } from "../common.js"
import { MarketStore, MarketStoreModule } from "../market.store.js"
import {
  AcceptedSubmissionDto,
  CreateSubscriptionDto,
  SubmissionJobDto,
  SubscriptionDto,
  SubscriptionQueryDto,
} from "./subscription.dto.js"

@ApiTags("subscriptions")
@ApiBearerAuth("bearer")
@ApiErrors()
@Controller()
export class SubscriptionsController {
  constructor(private readonly store: MarketStore) {}
  @Post("offerings/:offeringId/subscriptions")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiCreatedResponse({ type: SubscriptionDto })
  createSubscription(
    @Param("offeringId", ParseUUIDPipe) offeringId: string,
    @Body() input: CreateSubscriptionDto,
  ): SubscriptionDto {
    return this.store.createSubscription(offeringId, input)
  }

  @Get("offerings/:offeringId/subscriptions")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiPage(SubscriptionDto)
  listSubscriptions(
    @Param("offeringId", ParseUUIDPipe) offeringId: string,
    @Query() query: SubscriptionQueryDto,
  ): Page<SubscriptionDto> {
    return paginate(this.store.listSubscriptions(offeringId, query.investorId), query)
  }

  @Get("subscriptions/:subscriptionId")
  @ApiParam({ name: "subscriptionId", format: "uuid" })
  @ApiOkResponse({ type: SubscriptionDto })
  getSubscription(@Param("subscriptionId", ParseUUIDPipe) subscriptionId: string): SubscriptionDto {
    return this.store.subscription(subscriptionId)
  }

  @Post("subscriptions/:subscriptionId/submit")
  @ApiParam({ name: "subscriptionId", format: "uuid" })
  @ApiQuery({ name: "background", required: false, type: Boolean })
  @ApiOperation({ summary: "Submit now (200) or return an accepted job (202)" })
  @ApiOkResponse({ type: SubscriptionDto })
  @ApiAcceptedResponse({
    type: AcceptedSubmissionDto,
    headers: { Location: { schema: { type: "string" }, description: "The job resource" } },
  })
  submitSubscription(
    @Param("subscriptionId", ParseUUIDPipe) subscriptionId: string,
    @Query("background", new DefaultValuePipe(false), ParseBoolPipe) background: boolean,
    @Res({ passthrough: true }) response: Response,
  ): SubscriptionDto | AcceptedSubmissionDto {
    if (background) {
      const job = this.store.createSubmissionJob(subscriptionId)
      response.status(202).setHeader("location", `/api/v1/jobs/${job.id}`)
      return { state: "accepted", jobId: job.id }
    }
    response.status(200)
    return this.store.submit(subscriptionId)
  }
}

@ApiTags("jobs")
@ApiBearerAuth("bearer")
@ApiErrors()
@Controller("jobs")
export class JobsController {
  constructor(private readonly store: MarketStore) {}
  @Get(":jobId")
  @ApiParam({ name: "jobId", format: "uuid" })
  @ApiOkResponse({ type: SubmissionJobDto })
  getSubmissionJob(@Param("jobId", ParseUUIDPipe) jobId: string): SubmissionJobDto {
    return this.store.job(jobId)
  }
}

@Module({ imports: [MarketStoreModule], controllers: [SubscriptionsController, JobsController] })
export class SubscriptionsModule {}
