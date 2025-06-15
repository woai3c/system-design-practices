import Redis, { RedisOptions } from 'ioredis'

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  readonly client: Redis
  private readonly defaultTtl: number

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost')
    const port = this.configService.get<number>('REDIS_PORT', 6379)
    const password = this.configService.get<string>('REDIS_PASSWORD', '')
    const db = this.configService.get<number>('REDIS_DB', 0)

    this.defaultTtl = this.configService.get<number>('REDIS_DEFAULT_TTL', 3600) // 1 hour default

    const redisOptions: RedisOptions = {
      host,
      port,
      db,
    }

    if (password) {
      redisOptions.password = password
    }

    this.client = new Redis(redisOptions)
  }

  async onModuleInit() {
    try {
      await this.client.ping()
      this.logger.log('Redis connection established')
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`)
    }
  }

  async onModuleDestroy() {
    await this.client.quit()
    this.logger.log('Redis connection closed')
  }

  /**
   * Set a value in Redis cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, uses default if not provided)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.client.set(key, serialized, 'EX', ttl)
      } else if (this.defaultTtl > 0) {
        await this.client.set(key, serialized, 'EX', this.defaultTtl)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}: ${error.message}`)
    }
  }

  /**
   * Get a value from Redis cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}: ${error.message}`)
      return null
    }
  }

  /**
   * Delete a value from Redis cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}: ${error.message}`)
    }
  }

  /**
   * Check if a key exists in Redis cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      this.logger.error(`Failed to check if key ${key} exists: ${error.message}`)
      return false
    }
  }

  /**
   * Clear all keys in the current database
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushdb()
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`)
    }
  }
}
