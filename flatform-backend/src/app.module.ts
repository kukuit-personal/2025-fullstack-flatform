// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

import { CombinedAuthGuard } from './common/guards/combined-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { NotedModule } from './modules/noted/noted.module';
import { UsersModule } from './modules/admin/users/users.module';
import { EmailTemplateModule } from './modules/admin/email-template/email-template.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    // ✅ Serve static: http://<host>/storage/... -> <project>/storage/...
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'storage'),
      serveRoot: '/storage',
      serveStaticOptions: {
        index: false, // không trả index.html
        fallthrough: false, // tránh nuốt route API
      },
    }),

    // ✅ Config global (đọc .env)
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ Các module còn lại
    AuthModule,
    UsersModule,
    NotedModule,
    EmailTemplateModule,
    FilesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CombinedAuthGuard,
    },
  ],
})
export class AppModule {}
