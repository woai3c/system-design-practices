import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'
import { LinksController } from './links.controller'
import { LinksService } from './links.service'

@Module({
  imports: [PrismaModule],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
