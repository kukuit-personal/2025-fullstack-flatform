import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Cookie parser cho phép đọc/ghi cookie
  app.use(cookieParser());

  // ✅ Validation pipe để tự động validate dữ liệu đầu vào
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true, // chỉ nhận field được định nghĩa trong DTO
      // forbidNonWhitelisted: true, // chặn field lạ
      transform: true, // auto transform param (ví dụ id: string -> number)
    }),
  );

  // ✅ Global prefix for all routes
  app.setGlobalPrefix('api');

  // ✅ CORS cho phép frontend truy cập và nhận cookie
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // ✅ Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription('API for managing users')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ✅ Static assets (ảnh, file upload...)
  const STORAGE_DIR = process.env.STORAGE_DIR || 'storage';
  app.use('/assets', express.static(join(process.cwd(), STORAGE_DIR)));

  await app.listen(3001);
}
bootstrap();
