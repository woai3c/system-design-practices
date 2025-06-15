import { createHash } from 'crypto'

import { Injectable, NotFoundException } from '@nestjs/common'

import { Link } from '@prisma/client'

import { PaginatedResponseDto, PaginationQueryDto } from '../../dtos/pagination.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { MinioService } from '../minio/minio.service'
import { CreateLinkDto, LinkResponseDto, UpdateLinkDto } from './link.dto'

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async findAll(userId?: string, paginationQuery?: PaginationQueryDto): Promise<PaginatedResponseDto<LinkResponseDto>> {
    const { page = 1, pageSize = 10, orderBy = 'createdAt', order = 'desc' } = paginationQuery || {}

    // Calculate skip for pagination
    const skip = (page - 1) * pageSize

    // Prepare where clause
    const where = userId ? { userId } : {}

    // Get total count
    const total = await this.prisma.link.count({ where })

    // Get paginated data
    const links = await this.prisma.link.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [orderBy]: order },
    })

    // Transform data, add content and remove filePath
    const data = await Promise.all(
      links.map(async (link) => {
        // Get content from MinIO
        let content = ''

        if (link.expiresAt && link.expiresAt > new Date() && link.visibility) {
          // MinioService already handles caching internally
          content = await this.minioService.getContent(link.filePath)
        }

        // Create a new object without filePath
        const { filePath, ...linkWithoutFilePath } = link

        return this.formatLinkResponse(linkWithoutFilePath, content)
      }),
    )

    // Build paginated response
    return {
      data,
      total,
      page,
      pageSize,
    } as PaginatedResponseDto<LinkResponseDto>
  }

  async findById(id: string) {
    const link = await this.prisma.link.findUnique({
      where: { id },
    })

    if (!link || !link.visibility) {
      throw new NotFoundException(`Link with ID ${id} not found`)
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException(`Link with ID ${id} has expired`)
    }

    // Get content from MinIO (MinioService already handles caching internally)
    const content = await this.minioService.getContent(link.filePath)

    // Create a new object without filePath
    const { filePath, ...linkWithoutFilePath } = link

    return this.formatLinkResponse(linkWithoutFilePath, content)
  }

  async findByShortUrl(shortUrl: string) {
    const link = await this.prisma.link.findUnique({
      where: { shortUrl },
    })

    if (!link || !link.visibility) {
      throw new NotFoundException(`Link with short URL ${shortUrl} not found`)
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException(`Link with short URL ${shortUrl} has expired`)
    }

    // Get content from MinIO (MinioService already handles caching internally)
    const content = await this.minioService.getContent(link.filePath)

    // Create a new object without filePath
    const { filePath, ...linkWithoutFilePath } = link

    return this.formatLinkResponse(linkWithoutFilePath, content)
  }

  async create(userId: string, createLinkDto: CreateLinkDto) {
    // Generate unique shortUrl using MD5 + Base62
    const shortUrl = await this.generateUniqueShortUrl(userId, createLinkDto.content)

    // Store content in MinIO
    const filePath = await this.minioService.uploadContent(createLinkDto.content)

    // Create link in database
    const link = await this.prisma.link.create({
      data: {
        shortUrl,
        filePath,
        visibility: createLinkDto.visibility ?? true,
        expiresAt: createLinkDto.expiresAt,
        userId,
      },
    })

    // Return without filePath
    const { filePath: _, ...linkWithoutFilePath } = link

    return this.formatLinkResponse(linkWithoutFilePath, createLinkDto.content)
  }

  async update(id: string, userId: string, updateLinkDto: UpdateLinkDto) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Prepare update data
    const updateData: Partial<Link> = {
      visibility: updateLinkDto.visibility,
      expiresAt: updateLinkDto.expiresAt,
    }

    // If new content provided, update filePath
    if (updateLinkDto.content) {
      updateData.filePath = await this.minioService.uploadContent(updateLinkDto.content)
    }

    // Update link
    const updatedLink = await this.prisma.link.update({
      where: { id },
      data: updateData,
    })

    // Get latest content
    let content: string
    if (updateLinkDto.content) {
      content = updateLinkDto.content
    } else {
      // MinioService already handles caching internally
      content = await this.minioService.getContent(updatedLink.filePath)
    }

    // Return without filePath
    const { filePath, ...linkWithoutFilePath } = updatedLink

    return this.formatLinkResponse(linkWithoutFilePath, content)
  }

  async delete(id: string, userId: string) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Delete link
    const result = await this.prisma.link.delete({
      where: { id },
    })

    return result
  }

  async updateVisibility(id: string, userId: string, visibility: boolean) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Update link visibility
    const updatedLink = await this.prisma.link.update({
      where: { id },
      data: { visibility },
    })

    // Get content (MinioService already handles caching internally)
    const content = await this.minioService.getContent(updatedLink.filePath)

    // Return without filePath
    const { filePath, ...linkWithoutFilePath } = updatedLink

    return this.formatLinkResponse(linkWithoutFilePath, content)
  }

  async updateExpiration(id: string, userId: string, expiresAt: Date) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Update link expiration
    const updatedLink = await this.prisma.link.update({
      where: { id },
      data: { expiresAt },
    })

    // Get content (MinioService already handles caching internally)
    const content = await this.minioService.getContent(updatedLink.filePath)

    // Return without filePath
    const { filePath, ...linkWithoutFilePath } = updatedLink

    return this.formatLinkResponse(linkWithoutFilePath, content)
  }

  private async validateLinkOwnership(id: string, userId: string) {
    const link = await this.prisma.link.findUnique({
      where: { id },
    })

    if (!link) {
      throw new NotFoundException(`Link with ID ${id} not found`)
    }

    if (link.userId !== userId) {
      throw new NotFoundException(`Link with ID ${id} not found`)
      // Using NotFoundException instead of ForbiddenException for security
    }

    return link
  }

  /**
   * Generate a unique short URL using MD5 and Base62 encoding
   * @param userId User ID for uniqueness
   * @param content The content to create a link for
   * @returns A unique short URL
   */
  private async generateUniqueShortUrl(userId: string, content: string): Promise<string> {
    // Generate hash using user ID and content
    const hash = createHash('md5').update(`${userId}:${content}:${Date.now()}`).digest('hex')

    // Encode hash to Base62 and take first 7 characters
    let shortUrl = this.base62Encode(hash).substring(0, 7)

    // Check if short URL already exists
    const existingLink = await this.prisma.link.findUnique({
      where: { shortUrl },
    })

    // If exists, add incremental value and try again
    if (existingLink) {
      shortUrl = await this.generateUniqueShortUrl(userId, `${content}-${Math.random()}`)
    }

    return shortUrl
  }

  /**
   * Encode a hex string to Base62
   * @param hex Hex string to encode
   * @returns Base62 encoded string
   */
  private base62Encode(hex: string): string {
    const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const hexLen = hex.length
    const radix = BigInt(62)
    let value = 0n
    let result = ''

    // Convert hex to decimal
    for (let i = 0; i < hexLen; i += 1) {
      value = value * 16n + BigInt(parseInt(hex[i], 16))
    }

    // Convert decimal to base62
    while (value > 0) {
      const remainder = value % radix
      value = value / radix
      result = base62Chars[Number(remainder)] + result
    }

    return result || '0'
  }

  /**
   * Convert null to undefined for type compatibility with DTOs
   */
  private formatLinkResponse(link: Partial<LinkResponseDto>, content: string): LinkResponseDto {
    return {
      ...link,
      content,
      expiresAt: link.expiresAt || undefined, // Convert null to undefined
    } as LinkResponseDto
  }
}
