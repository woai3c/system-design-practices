import { ExtractJwt, Strategy } from 'passport-jwt'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'

import { SessionsService } from '../sessions.service'

export interface JwtPayload {
  sub: string // Session ID as subject
  email: string
}

export interface JwtUser {
  userId: string
  email: string
  sub: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private sessionsService: SessionsService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from the Authorization header first
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try to extract from the cookie
        (req) => {
          let token = null
          if (req && req.cookies) {
            token = req.cookies['access_token']
          }
          return token
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
    })
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    // Get the session and user information
    const session = await this.sessionsService.findActiveById(payload.sub)

    if (!session) {
      throw new UnauthorizedException('Invalid session')
    }

    // Update the session's lastActive timestamp
    await this.sessionsService.updateLastActive(payload.sub)

    // Return user information to be attached to the request
    return {
      userId: session.user.id,
      email: session.user.email,
      sub: payload.sub, // Include the session ID as subject
    }
  }
}
