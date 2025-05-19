import { NextFunction, Request, Response } from 'express'

import { Injectable, NestMiddleware } from '@nestjs/common'

@Injectable()
export class CookieParserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // If req.cookies is already defined, skip parsing
    if (req.cookies) {
      return next()
    }

    const cookieHeader = req.headers.cookie
    req.cookies = {}

    if (cookieHeader) {
      const cookies = cookieHeader.split(';')

      cookies.forEach((cookie) => {
        const parts = cookie.split('=')
        if (parts.length >= 2) {
          const key = parts[0].trim()
          const value = parts.slice(1).join('=').trim()
          req.cookies[key] = decodeURIComponent(value)
        }
      })
    }

    next()
  }
}
