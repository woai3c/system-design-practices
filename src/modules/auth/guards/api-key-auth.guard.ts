import { Observable } from 'rxjs'

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = this.extractApiKey(request)

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing')
    }

    // Get API key from environment variable
    const validApiKey = process.env.API_KEY

    if (!validApiKey) {
      throw new UnauthorizedException('API key is not configured on the server')
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key')
    }

    // Add basic API key info to request
    request.user = {
      isApiKey: true,
    }

    return true
  }

  private extractApiKey(request: Record<string, any>): string | undefined {
    // First try the header (preferred method)
    const apiKey = request.headers['x-api-key']

    if (apiKey) {
      return apiKey
    }

    // Fallback to query parameter
    if (request.query && request.query.apiKey) {
      return request.query.apiKey
    }

    return undefined
  }
}
