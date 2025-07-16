import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Cookie parser cho phép đọc/ghi cookie
  app.use(cookieParser());

  // ✅ Validation pipe để tự động validate dữ liệu đầu vào
  app.useGlobalPipes(new ValidationPipe());

  // ✅ Đặt tiền tố cho tất cả các route
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

  await app.listen(3001);
}
bootstrap();
