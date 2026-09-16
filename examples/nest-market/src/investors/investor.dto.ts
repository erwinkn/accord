import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger"
import { Equals, IsEmail, IsOptional, IsString, Length, MinLength } from "class-validator"

export class InvestorContactDto {
  @ApiProperty({ minLength: 2, example: "Alex Morgan" })
  @IsString()
  @MinLength(2)
  displayName!: string

  @ApiProperty({ format: "email", example: "alex@example.test" })
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 2, maxLength: 2, example: "FR" })
  @IsString()
  @Length(2, 2)
  country!: string

  @ApiPropertyOptional({
    writeOnly: true,
    description: "An onboarding note accepted on creation and omitted from public responses.",
  })
  @IsOptional()
  @IsString()
  onboardingNote?: string
}

export class CreateIndividualInvestorDto extends InvestorContactDto {
  @ApiProperty({ enum: ["individual"] })
  @Equals("individual")
  kind!: "individual"
}

export class CreateCompanyInvestorDto extends InvestorContactDto {
  @ApiProperty({ enum: ["company"] })
  @Equals("company")
  kind!: "company"

  @ApiProperty({ minLength: 3, example: "REG-123456" })
  @IsString()
  @MinLength(3)
  registrationNumber!: string
}

export class IndividualInvestorDto extends OmitType(CreateIndividualInvestorDto, [
  "onboardingNote",
] as const) {
  @ApiProperty({ format: "uuid", readOnly: true })
  id!: string
}

export class CompanyInvestorDto extends OmitType(CreateCompanyInvestorDto, [
  "onboardingNote",
] as const) {
  @ApiProperty({ format: "uuid", readOnly: true })
  id!: string
}

export type Investor = IndividualInvestorDto | CompanyInvestorDto
