import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport'; // ✅ thêm vào
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule, // ✅ đăng ký Passport
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,           // ✅ sử dụng cho AuthGuard('jwt')
    JwtRefreshStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
