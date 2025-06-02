import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { MinioService } from './minio.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class CommonModule {}
