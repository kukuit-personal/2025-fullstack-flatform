// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Cookie parser cho phép đọc/ghi cookie
  app.use(cookieParser());

  // ✅ Validation pipe để tự động validate dữ liệu đầu vào
  app.useGlobalPipes(new ValidationPipe());

  // ✅ CORS cho phép frontend truy cập và nhận cookie
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(3001);
}
bootstrap();
