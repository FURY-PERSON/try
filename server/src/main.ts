import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Security middleware (CSP disabled for Swagger UI compatibility)
  app.use(helmet({ contentSecurityPolicy: false }));

  // Compression
  app.use(compression());

  // Payload size limits
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || '*';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: corsOrigin !== '*',
  });

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fact Front API')
    .setDescription(
      'API for Fact Front - a daily educational facts game',
    )
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-device-id', in: 'header' },
      'device-id',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Request timeout (60 seconds)
  const server = app.getHttpServer();
  server.setTimeout(60000);

  // Start server
  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  logger.log(`Fact Front API is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
