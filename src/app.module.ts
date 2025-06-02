import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { RequestIdMiddleware } from './middlewares/request-id.middleware'
import { AuthModule } from './modules/auth/auth.module'
import { CookieParserMiddleware } from './modules/auth/cookies.parser'
import { LinksModule } from './modules/links/links.module'
import { CommonModule } from './modules/minio/minio.module'
import { UsersModule } from './modules/users/users.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CommonModule,
    UsersModule,
    AuthModule,
    LinksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*')
    consumer.apply(CookieParserMiddleware).forRoutes('*')
  }
}
