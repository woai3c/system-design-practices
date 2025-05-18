import { ConsoleLogger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { LoggingInterceptor } from './interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Use built-in ConsoleLogger
  const globalLogger = new ConsoleLogger('Global')
  app.useLogger(globalLogger)

  try {
    // Use HTTP exception filter
    app.useGlobalFilters(new HttpExceptionFilter(globalLogger))

    // Use logging interceptor
    app.useGlobalInterceptors(new LoggingInterceptor(globalLogger))

    // Swagger documentation configuration
    const config = new DocumentBuilder()
      .setTitle('System Design Practices API')
      .setDescription('API documentation for System Design Practices')
      .setVersion('1.0')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document)

    const port = process.env.PORT ?? 3000
    await app.listen(port)
    globalLogger.log(`Application is running on port ${port}`)
  } catch (error) {
    globalLogger.error(`Error during bootstrap: ${error.message}`)
    throw error
  }
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error)
})
