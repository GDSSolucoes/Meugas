import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { HttpException } from '@nestjs/common'
import { catchError, throwError } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class HttpErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((err: any) => {
        const req = context.switchToHttp().getRequest()
        const requestId = req?.headers?.['x-request-id'] || uuidv4()
        const status = typeof err.getStatus === 'function' ? err.getStatus() : 500
        const message =
          (err.response && (err.response.message || err.response.error)) ||
          err.message ||
          'Internal Server Error'
        // Structured log
        console.error({
          requestId,
          method: req?.method,
          url: req?.url,
          status,
          message,
          stack: err?.stack
        })
        return throwError(() => new HttpException({ error: message, request_id: requestId }, status))
      })
    )
  }
}
