import { randomUUID } from 'crypto'
import { Client } from 'minio'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MinioService {
  private readonly client: Client
  private readonly bucket: string
  private readonly logger = new Logger(MinioService.name)

  constructor(private configService: ConfigService) {
    this.client = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    })
    this.bucket = this.configService.get<string>('MINIO_BUCKET_NAME', 'links-bucket')
  }

  /**
   * Upload text content to MinIO
   * @param content The text content to store
   * @returns The file path in MinIO
   */
  async uploadContent(content: string): Promise<string> {
    try {
      // Create a Buffer from the content
      const buffer = Buffer.from(content, 'utf-8')

      // Generate a unique file name
      const fileName = `${Date.now()}-${randomUUID()}.txt`
      const filePath = `content/${fileName}`

      // Upload the buffer to MinIO
      await this.client.putObject(this.bucket, filePath, buffer, buffer.length, { 'Content-Type': 'text/plain' })

      this.logger.debug(`Content uploaded to ${filePath}`)
      return filePath
    } catch (error) {
      this.logger.error(`Failed to upload content to MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Get text content from MinIO
   * @param filePath The file path in MinIO
   * @returns The text content
   */
  async getContent(filePath: string): Promise<string> {
    try {
      // Get the object from MinIO
      const dataStream = await this.client.getObject(this.bucket, filePath)

      // Read the stream into a buffer
      return new Promise<string>((resolve, reject) => {
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
    } catch (error) {
      this.logger.error(`Failed to get content from MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Get public URL for a file
   * @param filePath The file path in MinIO
   * @returns The public URL
   */
  getPublicUrl(filePath: string): string {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost')
    const port = this.configService.get<number>('MINIO_PORT', 9000)
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false)

    const protocol = useSSL ? 'https' : 'http'
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${filePath}`
  }
}
