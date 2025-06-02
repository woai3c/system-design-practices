import { createHash } from 'crypto'

import { Injectable, NotFoundException } from '@nestjs/common'

import { PaginatedResponseDto, PaginationQueryDto } from '../../dtos/pagination.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { MinioService } from '../minio/minio.service'
import { CreateLinkDto, UpdateLinkDto } from './link.dto'

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async findAll(userId?: string, paginationQuery?: PaginationQueryDto): Promise<PaginatedResponseDto<any>> {
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
          content = await this.minioService.getContent(link.filePath)
        }

        // Create a new object without filePath
        const { filePath, ...linkWithoutFilePath } = link

        return {
          ...linkWithoutFilePath,
          content,
        }
      }),
    )

    // Build paginated response
    return {
      data,
      total,
      page,
      pageSize,
    } as PaginatedResponseDto<any>
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

    // Get content from MinIO
    const content = await this.minioService.getContent(link.filePath)

    // Create a new object without filePath
    const { filePath, ...linkWithoutFilePath } = link

    return {
      ...linkWithoutFilePath,
      content,
    }
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

    // Get content from MinIO
    const content = await this.minioService.getContent(link.filePath)

    // Create a new object without filePath
    const { filePath, ...linkWithoutFilePath } = link

    return {
      ...linkWithoutFilePath,
      content,
    }
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

    return {
      ...linkWithoutFilePath,
      content: createLinkDto.content,
    }
  }

  async update(id: string, userId: string, updateLinkDto: UpdateLinkDto) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Prepare update data
    const updateData: any = {
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

    // Get latest content from MinIO
    const content = await this.minioService.getContent(updatedLink.filePath)

    // Return without filePath
    const { filePath, ...linkWithoutFilePath } = updatedLink

    return {
      ...linkWithoutFilePath,
      content,
    }
  }

  async delete(id: string, userId: string) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Delete link
    return this.prisma.link.delete({
      where: { id },
    })
  }

  async updateVisibility(id: string, userId: string, visibility: boolean) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Update link visibility
    const updatedLink = await this.prisma.link.update({
      where: { id },
      data: { visibility },
    })

    // Get content from MinIO
    const content = await this.minioService.getContent(updatedLink.filePath)

    // Return without filePath
    const { filePath, ...linkWithoutFilePath } = updatedLink

    return {
      ...linkWithoutFilePath,
      content,
    }
  }

  async updateExpiration(id: string, userId: string, expiresAt: Date) {
    // Check if link exists and belongs to user
    await this.validateLinkOwnership(id, userId)

    // Update link expiration
    const updatedLink = await this.prisma.link.update({
      where: { id },
      data: { expiresAt },
    })

    // Get content from MinIO
    const content = await this.minioService.getContent(updatedLink.filePath)

    // Return without filePath
    const { filePath, ...linkWithoutFilePath } = updatedLink

    return {
      ...linkWithoutFilePath,
      content,
    }
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
    const MAX_ATTEMPTS = 10
    let attempts = 0
    let urlLength = 7 // Start with 7 characters

    while (attempts < MAX_ATTEMPTS) {
      // Generate timestamp for uniqueness
      const timestamp = Date.now().toString()

      // Create MD5 hash from user ID + timestamp + content (for uniqueness)
      const md5Hash = createHash('md5').update(`${userId}-${timestamp}-${content}`).digest('hex')

      // Convert to Base62 and take first `urlLength` characters
      const shortUrl = this.base62Encode(md5Hash).substring(0, urlLength)

      // Check if it already exists
      const existingLink = await this.prisma.link.findUnique({
        where: { shortUrl },
      })

      // If not exists, return this shortUrl
      if (!existingLink) {
        return shortUrl
      }

      // Increment attempts
      attempts++

      // If we've tried several times, increase the length
      if (attempts >= 5) {
        urlLength++
      }
    }

    // If still failing after max attempts, use a longer hash
    return this.base62Encode(
      createHash('sha256').update(`${userId}-${Date.now()}-${Math.random()}`).digest('hex'),
    ).substring(0, 10) // Use 10 characters from SHA256
  }

  /**
   * Encode a hexadecimal string to Base62
   * @param hex Hexadecimal string to encode
   * @returns Base62 encoded string
   */
  private base62Encode(hex: string): string {
    const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

    // Convert hex to decimal
    let decimal = BigInt('0x' + hex)
    let result = ''

    // Convert decimal to base62
    while (decimal > 0) {
      result = BASE62[Number(decimal % BigInt(62))] + result
      decimal = decimal / BigInt(62)
    }

    return result || '0'
  }
}
