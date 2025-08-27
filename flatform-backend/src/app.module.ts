import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CombinedAuthGuard } from './common/guards/combined-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { NotedModule } from './modules/noted/noted.module';
import { UsersModule } from './modules/admin/users/users.module';
import { EmailTemplateModule } from './modules/admin/email-template/email-template.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    NotedModule,
    EmailTemplateModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CombinedAuthGuard,
    },
  ],
})
export class AppModule {}
