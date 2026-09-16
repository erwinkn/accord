import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsObject, IsOptional, IsUUID, Matches } from "class-validator"
import { PageQueryDto } from "../common.js"

export enum SubscriptionStatus {
  Draft = "draft",
  Submitted = "submitted",
}

export class CreateSubscriptionDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  investorId!: string

  @ApiProperty({ pattern: "^[0-9]+\\.[0-9]{2}$", example: "2500.00" })
  @Matches(/^[0-9]+\.[0-9]{2}$/)
  amount!: string

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { type: "string" },
    example: { source: "advisor", reference: "WEB-42" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>
}

export class SubscriptionDto extends CreateSubscriptionDto {
  @ApiProperty({ format: "uuid", readOnly: true })
  id!: string

  @ApiProperty({ format: "uuid", readOnly: true })
  offeringId!: string

  @ApiProperty({ enum: SubscriptionStatus, enumName: "SubscriptionStatus", readOnly: true })
  status!: SubscriptionStatus

  @ApiProperty({ type: String, format: "date-time", nullable: true, readOnly: true })
  submittedAt!: string | null
}

export class SubscriptionQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  investorId?: string
}

export class AcceptedSubmissionDto {
  @ApiProperty({ enum: ["accepted"] })
  state!: "accepted"

  @ApiProperty({ format: "uuid" })
  jobId!: string
}

export class SubmissionJobDto {
  @ApiProperty({ format: "uuid" })
  id!: string

  @ApiProperty({ enum: ["completed"] })
  state!: "completed"

  @ApiProperty({ type: SubscriptionDto })
  result!: SubscriptionDto
}
