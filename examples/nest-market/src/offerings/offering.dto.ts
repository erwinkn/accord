import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from "class-validator"
import { PageQueryDto } from "../common.js"

export enum Currency {
  EUR = "EUR",
  USD = "USD",
}
export enum OfferingStatus {
  Draft = "draft",
  Open = "open",
  Closed = "closed",
}

export class TermsDto {
  @ApiProperty({
    example: "1000.00",
    pattern: "^[0-9]+\\.[0-9]{2}$",
    description: "Decimal string, avoiding floating-point currency rounding.",
  })
  @Matches(/^[0-9]+\.[0-9]{2}$/)
  minimumInvestment!: string

  @ApiProperty({ enum: Currency, enumName: "Currency" })
  @IsEnum(Currency)
  currency!: Currency

  @ApiProperty({ format: "date-time", example: "2027-12-31T23:59:59Z" })
  @IsISO8601()
  closesAt!: string
}

export class CreateOfferingDto {
  @ApiProperty({ minLength: 3, example: "Harbor Renewable Fund" })
  @IsString()
  @MinLength(3)
  name!: string

  @ApiProperty({ type: TermsDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => TermsDto)
  terms!: TermsDto

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: "A diversified infrastructure offering",
  })
  @IsOptional()
  @IsString()
  description?: string | null

  @ApiPropertyOptional({ type: [String], example: ["renewables", "private-markets"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class UpdateOfferingDto extends PartialType(CreateOfferingDto, {
  skipNullProperties: false,
}) {}

export class OfferingDto extends CreateOfferingDto {
  @ApiProperty({ format: "uuid", readOnly: true })
  id!: string

  @ApiProperty({ enum: OfferingStatus, enumName: "OfferingStatus", readOnly: true })
  status!: OfferingStatus

  @ApiProperty({ format: "date-time", readOnly: true })
  createdAt!: string
}

export class OfferingQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: OfferingStatus, enumName: "OfferingStatus", isArray: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(OfferingStatus, { each: true })
  status?: OfferingStatus[]
}

export class OfferingReportDto {
  @ApiProperty({ format: "uuid" })
  offeringId!: string

  @ApiProperty({ type: "integer", minimum: 0 })
  subscriptionCount!: number

  @ApiProperty({ enum: Currency, enumName: "Currency" })
  currency!: Currency
}
