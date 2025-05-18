import { Observable, tap } from 'rxjs'

import { CallHandler, ExecutionContext, Injectable, LoggerService, NestInterceptor } from '@nestjs/common'

import { REQUEST_ID_TOKEN_NAME } from '../middlewares/request-id.middleware'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  // Safely format objects to avoid logging excessive data
  private safeStringify(obj: any, maxLength = 1000): string {
    if (!obj) return 'null'

    try {
      // Handle sensitive fields
      const safeObj = { ...obj }

      // Remove sensitive information (such as passwords, tokens, etc.)
      if (safeObj.password) safeObj.password = '[REDACTED]'
      if (safeObj.token) safeObj.token = '[REDACTED]'
      if (safeObj.authorization) safeObj.authorization = '[REDACTED]'

      const stringified = JSON.stringify(safeObj)

      // If the string is too long, truncate it
      if (stringified.length > maxLength) {
        return `${stringified.substring(0, maxLength)}... [truncated, full length: ${stringified.length}]`
      }

      return stringified
    } catch {
      return '[non-serializable object]'
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url } = request
    const requestId = request[REQUEST_ID_TOKEN_NAME]

    // Safely log request details, avoiding logging excessive data
    this.logger.log(
      `Request ${method} ${url}`,
      `RequestID: ${requestId}`,
      `Body: ${this.safeStringify(request.body)}`,
      `Params: ${this.safeStringify(request.params)}`,
      `Query: ${this.safeStringify(request.query)}`,
    )

    const startTime = Date.now()

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const responseTime = Date.now() - startTime

          // Log response time and basic status, without logging response body to avoid large logs
          this.logger.log(
            `Response for ${method} ${url}`,
            `RequestID: ${requestId}`,
            `Status: Success`,
            `Time: ${responseTime}ms`,
          )
        },
        error: (error: any) => {
          const responseTime = Date.now() - startTime

          this.logger.log(
            `Response for ${method} ${url}`,
            `RequestID: ${requestId}`,
            `Status: Error`,
            `Time: ${responseTime}ms`,
          )
        },
      }),
    )
  }
}
