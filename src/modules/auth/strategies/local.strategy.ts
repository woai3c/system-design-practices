import { Strategy } from 'passport-local'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'

import { AuthService } from '../auth.service'

// 定义本地验证后返回的用户对象类型
export interface LocalUser {
  id: string
  email: string
  passwordHash: string
  firstName: string | null
  lastName: string | null
  name: string | null
  isActive: boolean
  role: string
  resetCode: string | null
  resetExpiry: Date | null
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    })
  }

  async validate(email: string, password: string): Promise<LocalUser> {
    const user = await this.authService.validateUser(email, password)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return user
  }
}
