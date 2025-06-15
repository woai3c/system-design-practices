import { Module } from '@nestjs/common'

import { MinioModule } from '../minio/minio.module'
import { LinksController } from './links.controller'
import { LinksService } from './links.service'

@Module({
  imports: [MinioModule],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
