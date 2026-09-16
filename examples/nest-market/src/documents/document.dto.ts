import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsOptional, IsString } from "class-validator"

export enum DocumentCategory {
  Terms = "terms",
  Prospectus = "prospectus",
  Other = "other",
}

export class DocumentFieldsDto {
  @ApiProperty({ enum: DocumentCategory, enumName: "DocumentCategory" })
  @IsEnum(DocumentCategory)
  category!: DocumentCategory

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

export class UploadDocumentDto extends DocumentFieldsDto {
  @ApiProperty({ type: "string", format: "binary" })
  file!: string
}

export class DocumentDto extends DocumentFieldsDto {
  @ApiProperty({ format: "uuid", readOnly: true })
  id!: string

  @ApiProperty({ format: "uuid", readOnly: true })
  offeringId!: string

  @ApiProperty()
  filename!: string

  @ApiProperty({ type: "integer", minimum: 0 })
  size!: number
}
