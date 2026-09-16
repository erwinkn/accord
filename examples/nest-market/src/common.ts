import {
  type ArgumentsHost,
  applyDecorators,
  type CanActivate,
  Catch,
  type ExceptionFilter,
  type ExecutionContext,
  HttpException,
  Injectable,
  type Type,
  UnauthorizedException,
} from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger"
import { Type as TransformType } from "class-transformer"
import { IsInt, IsOptional, Max, Min } from "class-validator"
import type { Request, Response } from "express"

/** Public demo credential. This guard deliberately avoids an external identity provider. */
export const DEMO_TOKEN = "accord-demo-token"

@Injectable()
export class DemoAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    if (request.headers.authorization !== `Bearer ${DEMO_TOKEN}`)
      throw new UnauthorizedException("A demo bearer token is required")
    return true
  }
}

export class ProblemDto {
  @ApiProperty({ type: "integer", example: 400 })
  statusCode!: number

  @ApiProperty({ example: "BAD_REQUEST" })
  code!: string

  @ApiProperty({ example: "Request validation failed" })
  message!: string

  @ApiPropertyOptional({ type: [String] })
  details?: string[]
}

@Catch(HttpException)
export class ProblemFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const statusCode = exception.getStatus()
    const payload = exception.getResponse()
    const codes = new Map([
      [400, "BAD_REQUEST"],
      [401, "UNAUTHORIZED"],
      [404, "NOT_FOUND"],
      [409, "CONFLICT"],
      [413, "PAYLOAD_TOO_LARGE"],
    ])
    const problem: ProblemDto = {
      statusCode,
      code: codes.get(statusCode) ?? "HTTP_ERROR",
      message: exception.message,
    }
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- Nest exceptions expose either a string or a structured payload at this HTTP boundary.
    if (typeof payload === "object" && "message" in payload && Array.isArray(payload.message))
      problem.details = payload.message.filter(
        (message): message is string => typeof message === "string",
      )
    response.status(statusCode).json(problem)
  }
}

export function ApiProblems() {
  return applyDecorators(
    ApiBadRequestResponse({ type: ProblemDto }),
    ApiUnauthorizedResponse({ type: ProblemDto }),
    ApiNotFoundResponse({ type: ProblemDto }),
  )
}

export class PageQueryDto {
  @ApiPropertyOptional({ type: "integer", minimum: 1, default: 1 })
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @ApiPropertyOptional({ type: "integer", minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20
}

export class PageInfoDto {
  @ApiProperty({ type: "integer", minimum: 1 })
  page!: number

  @ApiProperty({ type: "integer", minimum: 1 })
  limit!: number

  @ApiProperty({ type: "integer", minimum: 0 })
  total!: number
}

export interface Page<T> extends PageInfoDto {
  items: T[]
}

/** The usual Nest Swagger pagination pattern: generic TS types need explicit item metadata. */
export function ApiPage<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(PageInfoDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageInfoDto) },
          {
            type: "object",
            required: ["items"],
            properties: { items: { type: "array", items: { $ref: getSchemaPath(model) } } },
          },
        ],
      },
    }),
  )
}

export function paginate<T>(items: T[], query: PageQueryDto): Page<T> {
  return {
    items: items.slice((query.page - 1) * query.limit, query.page * query.limit),
    page: query.page,
    limit: query.limit,
    total: items.length,
  }
}
