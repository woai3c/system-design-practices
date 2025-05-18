import { Request, Response } from 'express'
import { REQUEST_ID_TOKEN_NAME } from 'src/middlewares/request-id.middleware'

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, LoggerService } from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // Get the request ID from the request
    const requestId = request[REQUEST_ID_TOKEN_NAME]

    // Determine the status code and error message
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof HttpException ? exception.message : 'Internal server error'

    // Log the error with context
    this.logger.error(`Exception: ${message}`, exception.stack, `Path: ${request.url}`, `Method: ${request.method}`)

    // Send the error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      message,
    })
  }
}
