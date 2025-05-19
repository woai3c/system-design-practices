import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'

import { ALLOW_API_KEY } from '../decorators/api-key.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { ApiKeyAuthGuard } from './api-key-auth.guard'

@Injectable()
export class AuthGuard {
  constructor(
    private reflector: Reflector,
    private apiKeyAuthGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If public, allow access without authentication
    if (isPublic) {
      return true
    }

    // Check if API key authentication is allowed
    const allowApiKey = this.reflector.getAllAndOverride<boolean>(ALLOW_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // Try API key authentication if allowed
    if (allowApiKey) {
      try {
        // Delegate to ApiKeyAuthGuard
        const isApiKeyValid = await this.apiKeyAuthGuard.canActivate(context)
        if (isApiKeyValid) {
          return true
        }
      } catch {
        // Failed API key auth, continue to JWT
        throw new UnauthorizedException('API key authentication failed')
      }
    }

    // Fallback to JWT authentication
    try {
      // Create a JWT guard on-the-fly
      const jwtGuard = new (PassportAuthGuard('jwt'))()
      // Need to bind the context to the guard
      return (await jwtGuard.canActivate(context)) as boolean
    } catch {
      throw new UnauthorizedException('Authentication required')
    }
  }
}
