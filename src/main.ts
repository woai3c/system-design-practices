import * as cookieParser from 'cookie-parser'
import * as csurf from 'csurf'
import helmet from 'helmet'

import { ConsoleLogger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { LoggingInterceptor } from './interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const isProd = process.env.NODE_ENV === 'production'

  // Use built-in ConsoleLogger
  const globalLogger = new ConsoleLogger('Global')
  app.useLogger(globalLogger)

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })

  // Add security headers with helmet
  app.use(helmet())

  // Parse cookies
  app.use(cookieParser())

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Transform payload to DTO instances
      forbidNonWhitelisted: true, // Throw errors for non-whitelisted properties
    }),
  )

  // Use HTTP exception filter
  app.useGlobalFilters(new HttpExceptionFilter(globalLogger))

  // Use logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(globalLogger))

  // CSRF protection - disable for APIs that need to be called from other domains
  if (process.env.ENABLE_CSRF === 'true') {
    app.use(
      csurf({
        cookie: {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
        },
      }),
    )
  }

  if (!isProd) {
    // Swagger documentation configuration
    const config = new DocumentBuilder()
      .setTitle('System Design Practices API')
      .setDescription('API documentation for System Design Practices')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      })
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'x-api-key')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document)
  }

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  globalLogger.log(`Application is running on port ${port}`)
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error)
})
