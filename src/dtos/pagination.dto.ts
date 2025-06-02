import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator'

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    default: 1,
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    example: 10,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsString()
  @IsOptional()
  orderBy?: string = 'createdAt'

  @ApiPropertyOptional({
    description: 'Sort direction',
    default: 'desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc'
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Data list',
    example: [],
  })
  data: T[]

  @ApiProperty({
    description: 'Total items count',
    example: 42,
  })
  total: number

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  pageSize: number
}
