import { ApiProperty } from "@nestjs/swagger"

export class StreamStatusDto {
  @ApiProperty({ format: "uuid" })
  offeringId!: string

  @ApiProperty({ format: "date-time" })
  timestamp!: string
}
