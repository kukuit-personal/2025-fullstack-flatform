import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refreshToken,  // 👈 lấy refreshToken từ cookie
      ]),
      ignoreExpiration: false, // ❗ refresh token phải hết hạn mới mất hiệu lực
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    })
  }

  async validate(payload: any) {
    return payload // payload.sub = userId
  }
}
