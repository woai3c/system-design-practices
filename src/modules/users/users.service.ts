import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { addHours } from 'date-fns'

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto, UpdateUserDto } from './user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictException('Email already in use')
    }

    // Hash password
    const passwordHash = await this.hashPassword(password)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findById(id)

    // Update user
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    // Find user with password
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        passwordHash: true,
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      throw new ConflictException('Current password is incorrect')
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword)

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    return { success: true, message: 'Password updated successfully' }
  }

  async createPasswordResetToken(email: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal that the user doesn't exist (security best practice)
      return { success: true, message: 'If your email is in our system, you will receive a password reset link' }
    }

    // Generate reset token - simple 6-digit code for demonstration
    const resetCode = randomBytes(3).toString('hex').toUpperCase()

    // Save reset token with expiry (1 hour)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetExpiry: addHours(new Date(), 1),
      },
    })

    // In a real app, send this code via email
    console.log(`Reset code for ${email}: ${resetCode}`)

    return { success: true, message: 'If your email is in our system, you will receive a password reset link' }
  }

  async resetPassword(resetCode: string, newPassword: string) {
    // Find user with this reset code
    const user = await this.prisma.user.findFirst({
      where: {
        resetCode,
        resetExpiry: {
          gt: new Date(), // Ensure token hasn't expired
        },
      },
    })

    if (!user) {
      throw new ConflictException('Invalid or expired reset code')
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword)

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetCode: null,
        resetExpiry: null,
      },
    })

    return { success: true, message: 'Password has been reset successfully' }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  getUsersCount(): Promise<number> {
    return this.prisma.user.count()
  }
}
