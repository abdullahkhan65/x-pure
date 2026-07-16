import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "@x-pure/database";

const STATUS_BY_CODE: Record<string, number> = {
  P2002: HttpStatus.CONFLICT, // unique constraint violation
  P2025: HttpStatus.NOT_FOUND, // record not found
  P2003: HttpStatus.BAD_REQUEST, // foreign key constraint failed
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: messageFor(exception),
      error: exception.code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

function messageFor(exception: Prisma.PrismaClientKnownRequestError): string {
  switch (exception.code) {
    case "P2002": {
      const target = (exception.meta?.target as string[] | undefined)?.join(", ");
      return target ? `A record with this ${target} already exists.` : "A unique constraint was violated.";
    }
    case "P2025":
      return "The requested record was not found.";
    case "P2003":
      return "This operation references a record that doesn't exist.";
    default:
      return "A database error occurred.";
  }
}
