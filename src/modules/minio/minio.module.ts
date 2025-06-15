import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from '../../prisma/prisma.module'
import { RedisModule } from '../redis/redis.module'
import { MinioService } from './minio.service'

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
