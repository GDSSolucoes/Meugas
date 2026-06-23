import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from "@nestjs/common";
import { catchError, throwError } from "rxjs";
import { v4 as uuidv4 } from "uuid";

function parsePostgresQuery(message: string): string | undefined {
  const match = /Failed query:\s*([^\n]+)\s*params:/s.exec(message);
  return match?.[1]?.trim();
}

function getPostgresErrorInfo(err: any) {
  if (!err || typeof err !== "object") {
    return null;
  }

  const {
    code,
    detail,
    hint,
    constraint,
    column,
    table,
    schema,
    position,
    query,
    params,
    cause,
  } = err;
  const hasPostgresFields =
    code ||
    detail ||
    hint ||
    constraint ||
    column ||
    table ||
    schema ||
    position ||
    query ||
    params ||
    cause;
  if (!hasPostgresFields) {
    return null;
  }

  return {
    code,
    detail,
    hint,
    constraint,
    column,
    table,
    schema,
    position,
    query:
      query ||
      (typeof err.message === "string"
        ? parsePostgresQuery(err.message)
        : undefined),
    params,
    cause,
  };
}

function buildPostgresMessage(
  postgresInfo: ReturnType<typeof getPostgresErrorInfo>,
) {
  if (!postgresInfo) {
    return undefined;
  }

  if (postgresInfo.detail) {
    return postgresInfo.detail;
  }

  if (postgresInfo.hint) {
    return postgresInfo.hint;
  }

  if (postgresInfo.constraint) {
    return `Violação de restrição no banco de dados: ${postgresInfo.constraint}`;
  }

  if (postgresInfo.column) {
    return `Erro de coluna: ${postgresInfo.column}`;
  }

  if (postgresInfo.code) {
    return `Erro de banco de dados (código ${postgresInfo.code})`;
  }

  if (postgresInfo.cause) {
    return `Erro de banco de dados: ${postgresInfo.cause}`;
  }

  return undefined;
}

@Injectable()
export class HttpErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((err: any) => {
        const req = context.switchToHttp().getRequest();
        const requestId = req?.headers?.["x-request-id"] || uuidv4();
        const status =
          typeof err.getStatus === "function" ? err.getStatus() : 500;
        const message =
          (err.response && (err.response.message || err.response.error)) ||
          err.message ||
          "Internal Server Error";

        const postgresInfo = getPostgresErrorInfo(err);
        const publicMessage =
          err instanceof HttpException
            ? message
            : buildPostgresMessage(postgresInfo) || message;

        const logPayload: any = {
          requestId,
          method: req?.method,
          url: req?.url,
          status,
          message,
          stack: err?.stack,
        };

        if (postgresInfo) {
          logPayload.postgres = postgresInfo;
        }

        console.error(logPayload);

        return throwError(
          () =>
            new HttpException(
              { error: publicMessage, request_id: requestId },
              status,
            ),
        );
      }),
    );
  }
}
