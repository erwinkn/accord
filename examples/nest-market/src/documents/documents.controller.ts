import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Module,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from "@nestjs/swagger"
import { ApiErrors, ErrorDto } from "../common.js"
import { MarketStore, MarketStoreModule } from "../market.store.js"
import { DocumentDto, DocumentFieldsDto, UploadDocumentDto } from "./document.dto.js"

@ApiTags("documents")
@ApiBearerAuth("bearer")
@ApiErrors()
@Controller()
export class DocumentsController {
  constructor(private readonly store: MarketStore) {}
  @Post("offerings/:offeringId/documents")
  @ApiParam({ name: "offeringId", format: "uuid" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadDocumentDto })
  @ApiOperation({ summary: "Upload an offering document with its category and note" })
  @ApiCreatedResponse({ type: DocumentDto })
  @ApiPayloadTooLargeResponse({ type: ErrorDto })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 1024 * 1024 } }))
  uploadDocument(
    @Param("offeringId", ParseUUIDPipe) offeringId: string,
    @Body() fields: DocumentFieldsDto,
    @UploadedFile(new ParseFilePipe()) file: Express.Multer.File,
  ): DocumentDto {
    return this.store.upload(offeringId, fields, file)
  }

  @Get("documents/:documentId")
  @ApiParam({ name: "documentId", format: "uuid" })
  @ApiOkResponse({ type: DocumentDto })
  getDocument(@Param("documentId", ParseUUIDPipe) documentId: string): DocumentDto {
    return this.store.document(documentId).metadata
  }

  @Get("documents/:documentId/content")
  @ApiParam({ name: "documentId", format: "uuid" })
  @ApiOkResponse({
    content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
    headers: {
      "Content-Disposition": { schema: { type: "string" }, description: "Attachment filename" },
    },
  })
  downloadDocument(@Param("documentId", ParseUUIDPipe) documentId: string): StreamableFile {
    const { metadata, bytes } = this.store.document(documentId)
    return new StreamableFile(bytes, {
      type: "application/octet-stream",
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(metadata.filename)}`,
    })
  }

  @Delete("documents/:documentId")
  @HttpCode(204)
  @ApiParam({ name: "documentId", format: "uuid" })
  @ApiNoContentResponse()
  deleteDocument(@Param("documentId", ParseUUIDPipe) documentId: string): void {
    this.store.deleteDocument(documentId)
  }
}

@Module({ imports: [MarketStoreModule], controllers: [DocumentsController] })
export class DocumentsModule {}
