import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator'

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateLinkDto {
  @ApiProperty({
    description: 'Content for the link',
    example: 'This is some text content to share via a short link.',
  })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiPropertyOptional({
    description: 'Link visibility (public or private)',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  visibility?: boolean

  @ApiPropertyOptional({
    description: 'Link expiration date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date
}

export class UpdateLinkDto {
  @ApiPropertyOptional({
    description: 'Content for the link',
    example: 'Updated content for the short link.',
  })
  @IsString()
  @IsOptional()
  content?: string

  @ApiPropertyOptional({
    description: 'Link visibility (public or private)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  visibility?: boolean

  @ApiPropertyOptional({
    description: 'Link expiration date',
    example: '2025-06-30T23:59:59Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date
}

export class LinkVisibilityDto {
  @ApiProperty({
    description: 'Link visibility status',
    example: false,
  })
  @IsBoolean()
  visibility: boolean
}

export class LinkExpirationDto {
  @ApiProperty({
    description: 'Link expiration date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt: Date
}

export class LinkResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string

  @ApiProperty({
    description: 'Short URL for accessing the content',
    example: 'Ab3x7Z',
  })
  shortUrl: string

  @ApiProperty({
    description: 'Content of the link',
    example: 'This is the content that was shared via the short link.',
  })
  content: string

  @ApiProperty({
    example: true,
  })
  visibility: boolean

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
  })
  expiresAt?: Date | null

  @ApiProperty({
    example: '2023-06-01T12:00:00Z',
  })
  createdAt: Date

  @ApiProperty({
    example: '2023-06-01T12:30:00Z',
  })
  updatedAt: Date
}
