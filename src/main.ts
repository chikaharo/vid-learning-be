import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

import { json, urlencoded } from 'express';

// ...

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // Increase body size limit for video uploads
  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ extended: true, limit: '500mb' }));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const uploadsRoot = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
  }
  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads/',
  });

  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const port =
    (configService.get<number>('port', { infer: true }) as number) ?? 8080;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Video Learning & Testing API')
    .setDescription('Backend API for the video learning and quiz platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  const server = await app.listen(port);
  server.setTimeout(600000); // 10 minutes timeout for large uploads
}
void bootstrap();
