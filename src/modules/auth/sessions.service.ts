import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { TIME, TOKEN_DURATION } from './constants'

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userAgent?: string, ipAddress?: string) {
    const expiresAt = new Date(Date.now() + TOKEN_DURATION.SESSION) // Session expires based on constant

    const session = await this.prisma.session.create({
      data: {
        userId,
        userAgent,
        ipAddress,
        isActive: true,
        expiresAt,
      },
    })

    // Generate a refresh token and hash it
    const refreshToken = randomBytes(40).toString('hex')
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10)

    // Store the hashed refresh token
    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: refreshTokenHash },
    })

    return {
      sessionId: session.id,
      refreshToken,
    }
  }

  findActiveById(id: string) {
    return this.prisma.session.findFirst({
      where: {
        id,
        isActive: true,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    })
  }

  async validateRefreshToken(sessionId: string, refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    })

    if (!session || !session.isActive || session.expiresAt < new Date() || !session.refreshToken) {
      return null
    }

    // Verify the refresh token
    const isValid = await bcrypt.compare(refreshToken, session.refreshToken)
    if (!isValid) {
      // If token validation fails, deactivate the session for security
      await this.deactivate(sessionId)
      return null
    }

    // Update lastActive timestamp
    await this.updateLastActive(sessionId)

    return session
  }

  async recycleRefreshToken(sessionId: string) {
    // Generate a new refresh token and update the session
    const newRefreshToken = randomBytes(40).toString('hex')
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10)

    // Extend session expiry time
    const expiresAt = new Date(Date.now() + TOKEN_DURATION.SESSION)

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: refreshTokenHash,
        expiresAt,
        lastActive: new Date(),
      },
    })

    return newRefreshToken
  }

  updateLastActive(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActive: new Date() },
    })
  }

  deactivate(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { isActive: false },
    })
  }

  deleteSession(id: string) {
    return this.prisma.session.delete({
      where: { id },
    })
  }

  deactivateAllForUser(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    })
  }

  deleteAllUserSessions(userId: string) {
    return this.prisma.session.deleteMany({
      where: { userId },
    })
  }

  deactivateExpiredSessions() {
    // Mark expired sessions as inactive
    return this.prisma.session.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })
  }

  deleteExpiredSessions() {
    // Delete expired sessions older than 7 days
    const cutoffDate = new Date(Date.now() - 7 * TIME.DAY)

    return this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: cutoffDate,
        },
      },
    })
  }

  getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastActive: true,
        createdAt: true,
      },
      orderBy: {
        lastActive: 'desc',
      },
    })
  }
}
