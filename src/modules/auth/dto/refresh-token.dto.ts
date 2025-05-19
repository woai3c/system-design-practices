import { IsNotEmpty, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class RefreshTokenDto {
  @ApiProperty({ example: '5f8d0f1b-d9c3-4a1e-8f1d-2c9a3b4d5e6f', description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string

  @ApiProperty({
    example: '7a1b2c3d4e5f6g7h8i9j0k',
    description: 'Refresh token received during login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
