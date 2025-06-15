import { createHash, randomUUID } from 'crypto'
import { Client } from 'minio'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class MinioService {
  private readonly client: Client
  private readonly bucket: string
  private readonly logger = new Logger(MinioService.name)
  private readonly cacheTtl: number

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    this.client = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    })
    this.bucket = this.configService.get<string>('MINIO_BUCKET_NAME', 'links-bucket')
    this.cacheTtl = this.configService.get<number>('MINIO_CACHE_TTL', 3600) // Default 1 hour
  }

  /**
   * Hash content using SHA-256
   * @param content Text content to hash
   * @returns Hash value of the content
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Find file with the same content based on hash value
   * Uses database query instead of file traversal
   * @param contentHash Content hash value
   * @returns File path if found; otherwise null
   */
  private async findFileByHash(contentHash: string): Promise<string | null> {
    try {
      // Try to get from cache first
      const cacheKey = `file-hash:${contentHash}`
      const cachedPath = await this.redisService.get<string>(cacheKey)

      if (cachedPath) {
        try {
          // Verify if the file still exists
          await this.client.statObject(this.bucket, cachedPath)
          return cachedPath
        } catch {
          // File doesn't exist, delete from cache
          await this.redisService.delete(cacheKey)
        }
      }

      // Query hash value from database
      const fileHash = await this.prisma.fileHash.findUnique({
        where: { hash: contentHash },
      })

      if (fileHash) {
        try {
          // Verify if the file still exists
          await this.client.statObject(this.bucket, fileHash.filePath)

          // Update access time and count
          await this.prisma.fileHash.update({
            where: { id: fileHash.id },
            data: {
              accessedAt: new Date(),
              accessCount: { increment: 1 },
            },
          })

          // Cache the file path
          await this.redisService.set(cacheKey, fileHash.filePath, this.cacheTtl)

          return fileHash.filePath
        } catch {
          // File doesn't exist, delete record from database
          await this.prisma.fileHash.delete({
            where: { id: fileHash.id },
          })
          this.logger.debug(`File ${fileHash.filePath} doesn't exist, record deleted from database`)
        }
      }

      return null
    } catch (error) {
      this.logger.error(`Error finding file with hash value ${contentHash}: ${error.message}`)
      return null
    }
  }

  /**
   * Upload text content to MinIO with content deduplication
   * @param content Text content to store
   * @returns File path in MinIO
   */
  async uploadContent(content: string): Promise<string> {
    try {
      // Generate hash value for content
      const contentHash = this.hashContent(content)

      // Check if the same content is already stored
      const existingPath = await this.findFileByHash(contentHash)
      if (existingPath) {
        this.logger.debug(`Content with hash ${contentHash} already exists at ${existingPath}`)
        return existingPath
      }

      // Create buffer for content
      const buffer = Buffer.from(content, 'utf-8')
      const size = buffer.length

      // Generate unique filename and path
      const hashPrefix = contentHash.substring(0, 2)
      const fileName = `${Date.now()}-${randomUUID()}.txt`
      const filePath = `content/${hashPrefix}/${fileName}`

      // Upload buffer to MinIO
      await this.client.putObject(this.bucket, filePath, buffer, size, {
        'Content-Type': 'text/plain',
        'Content-Hash': contentHash, // Store hash value as metadata
      })

      // Save hash and path to database
      await this.prisma.fileHash.create({
        data: {
          hash: contentHash,
          filePath,
          size,
          accessCount: 1,
        },
      })

      // Cache the file path with its hash
      const cacheKey = `file-hash:${contentHash}`
      await this.redisService.set(cacheKey, filePath, this.cacheTtl)

      // Cache the content
      const contentCacheKey = `content:${filePath}`
      await this.redisService.set(contentCacheKey, content, this.cacheTtl)

      this.logger.debug(`Content uploaded to ${filePath}, hash value is ${contentHash}`)
      return filePath
    } catch (error) {
      this.logger.error(`Failed to upload content to MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Get text content from MinIO
   * @param filePath File path in MinIO
   * @returns Text content
   */
  async getContent(filePath: string): Promise<string> {
    try {
      // Try to get from cache first
      const cacheKey = `content:${filePath}`
      const cachedContent = await this.redisService.get<string>(cacheKey)

      if (cachedContent) {
        this.logger.debug(`Content for ${filePath} retrieved from cache`)
        return cachedContent
      }

      // Get object from MinIO
      const dataStream = await this.client.getObject(this.bucket, filePath)

      // Read stream into string
      const content = await new Promise<string>((resolve, reject) => {
        let content = ''

        dataStream.on('data', (chunk) => {
          content += chunk.toString()
        })

        dataStream.on('end', () => {
          resolve(content)
        })

        dataStream.on('error', (err) => {
          reject(err)
        })
      })

      // Cache the content
      await this.redisService.set(cacheKey, content, this.cacheTtl)

      return content
    } catch (error) {
      this.logger.error(`Failed to get content from MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Get public URL for a file
   * @param filePath File path in MinIO
   * @returns Public URL
   */
  getPublicUrl(filePath: string): string {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost')
    const port = this.configService.get<number>('MINIO_PORT', 9000)
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false)

    const protocol = useSSL ? 'https' : 'http'
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${filePath}`
  }
}
