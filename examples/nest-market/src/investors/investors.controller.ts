import { Body, Controller, Get, Module, Param, ParseUUIDPipe, Post } from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger"
import { ApiErrors } from "../common.js"
import { MarketStore, MarketStoreModule } from "../market.store.js"
import {
  CompanyInvestorDto,
  CreateCompanyInvestorDto,
  CreateIndividualInvestorDto,
  IndividualInvestorDto,
  type Investor,
} from "./investor.dto.js"

@ApiTags("investors")
@ApiBearerAuth("bearer")
@ApiErrors()
@Controller("investors")
export class InvestorsController {
  constructor(private readonly store: MarketStore) {}
  @Post("individuals")
  @ApiCreatedResponse({ type: IndividualInvestorDto })
  createIndividualInvestor(@Body() input: CreateIndividualInvestorDto): IndividualInvestorDto {
    return this.store.createIndividual(input)
  }

  @Post("companies")
  @ApiCreatedResponse({ type: CompanyInvestorDto })
  createCompanyInvestor(@Body() input: CreateCompanyInvestorDto): CompanyInvestorDto {
    return this.store.createCompany(input)
  }

  @Get(":investorId")
  @ApiParam({ name: "investorId", format: "uuid" })
  @ApiOperation({ summary: "Read an individual or company investor, discriminated by kind" })
  @ApiExtraModels(IndividualInvestorDto, CompanyInvestorDto)
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(IndividualInvestorDto) },
        { $ref: getSchemaPath(CompanyInvestorDto) },
      ],
      discriminator: {
        propertyName: "kind",
        mapping: {
          individual: getSchemaPath(IndividualInvestorDto),
          company: getSchemaPath(CompanyInvestorDto),
        },
      },
    },
  })
  getInvestor(@Param("investorId", ParseUUIDPipe) investorId: string): Investor {
    return this.store.investor(investorId)
  }
}

@Module({ imports: [MarketStoreModule], controllers: [InvestorsController] })
export class InvestorsModule {}
