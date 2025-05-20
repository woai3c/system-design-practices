import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If public, allow access without JWT
    if (isPublic) {
      return true
    }

    // Otherwise, use the default JWT authentication logic
    return super.canActivate(context)
  }

  handleRequest(err, user, _info) {
    // You can throw a custom exception based on err or info
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required')
    }
    return user
  }
}
