import { ConsoleLogger, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

import { PrismaClient } from '@prisma/client'

type PrismaClientWithExtensions = PrismaClient & {
  $on: (eventType: string, callback: (event: any) => void) => void
  $connect: () => Promise<void>
  $disconnect: () => Promise<void>
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClientWithExtensions
  private readonly logger = new ConsoleLogger('PrismaService')

  constructor() {
    this.prisma = new PrismaClient() as PrismaClientWithExtensions
  }

  get user() {
    return this.prisma.user
  }

  get session() {
    return this.prisma.session
  }

  get link() {
    return this.prisma.link
  }

  get fileHash() {
    return this.prisma.fileHash
  }

  async onModuleInit() {
    await this.prisma.$connect()
    this.logger.log('Database connection established')

    // Add listeners for query logging if in development
    if (process.env.NODE_ENV !== 'production') {
      this.prisma.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`)
        this.logger.debug(`Duration: ${e.duration}ms`)
      })
    }

    // Always log errors
    this.prisma.$on('error', (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`)
    })
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect()
    this.logger.log('Database connection closed')
  }
}
