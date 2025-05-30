import { randomBytes } from 'crypto'
import { NextFunction, Request, Response } from 'express'

import { Injectable, NestMiddleware } from '@nestjs/common'

export const REQUEST_ID_TOKEN_NAME = 'X-Request-Id'

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Check if request already has an ID, otherwise generate a new one
    const requestId = req.headers[REQUEST_ID_TOKEN_NAME.toLowerCase()] || randomBytes(16).toString('hex')

    // Assign ID to request object for use in controllers/services
    req[REQUEST_ID_TOKEN_NAME] = requestId

    // Set ID in response headers
    res.setHeader(REQUEST_ID_TOKEN_NAME, requestId)

    next()
  }
}
