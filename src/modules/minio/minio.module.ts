import { PrismaModule } from 'src/prisma/prisma.module'

import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { MinioService } from './minio.service'

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
