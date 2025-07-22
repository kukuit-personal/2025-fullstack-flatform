import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { RolesGuard } from './common/guards/roles.guard'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { CombinedAuthGuard } from './common/guards/combined-auth.guard'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { NotedModule } from './modules/noted/noted.module'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    NotedModule,
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
