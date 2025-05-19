import * as bcrypt from 'bcrypt'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { UsersService } from '../users/users.service'
import { COOKIE_OPTIONS, TOKEN_DURATION } from './constants'
import { SessionsService } from './sessions.service'
import { JwtPayload } from './strategies/jwt.strategy'

// Login response type
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
  }
}

// Refresh token response type
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
  }
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionsService: SessionsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return null
    }

    return user
  }

  async login(user: any, userAgent?: string, ipAddress?: string, res?: any): Promise<LoginResponse> {
    // Create a new session
    const { sessionId, refreshToken } = await this.sessionsService.create(user.id, userAgent, ipAddress)

    // Create JWT with sessionId as subject
    const payload: JwtPayload = {
      sub: sessionId,
      email: user.email,
      role: user.role,
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: TOKEN_DURATION.ACCESS_TOKEN / 1000, // Convert to seconds
    })

    // If response object is provided, set cookies
    if (res) {
      // Set access token cookie (short-term)
      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: TOKEN_DURATION.ACCESS_TOKEN,
      })

      // Set refresh token cookie (long-term)
      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        path: '/auth/refresh-token', // Only usable on refresh route
        maxAge: TOKEN_DURATION.REFRESH_TOKEN,
      })

      // Set session ID cookie
      res.cookie('session_id', sessionId, {
        ...COOKIE_OPTIONS,
        maxAge: TOKEN_DURATION.SESSION,
      })
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  }

  async refreshToken(sessionId: string, refreshToken: string): Promise<RefreshTokenResponse> {
    const session = await this.sessionsService.validateRefreshToken(sessionId, refreshToken)

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const user = session.user

    // Generate a new refresh token for security
    const newRefreshToken = await this.sessionsService.recycleRefreshToken(sessionId)

    // Create new JWT
    const payload: JwtPayload = {
      sub: session.id,
      email: user.email,
      role: user.role,
    }

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: TOKEN_DURATION.ACCESS_TOKEN / 1000, // Convert to seconds
      }),
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  }

  async logout(sessionId: string): Promise<{ success: boolean; message: string }> {
    // Delete the session instead of just deactivating it
    await this.sessionsService.deleteSession(sessionId)
    return { success: true, message: 'Logged out successfully' }
  }

  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    // Delete all user sessions instead of just deactivating them
    await this.sessionsService.deleteAllUserSessions(userId)
    return { success: true, message: 'Logged out from all devices successfully' }
  }

  getActiveSessions(userId: string) {
    return this.sessionsService.getActiveSessions(userId)
  }
}
