import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    // Set access token
    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: false, // Chỉ bật true khi dùng HTTPS
      maxAge: 1 * 60 * 60 * 1000, // 1h
      sameSite: 'lax',
    });

    // Set refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      sameSite: 'lax',
    });

    // ✅ Trả về URL để redirect frontend tự xử lý
    const redirect = result.role === 'admin' ? '/admin/dashboard' : '/';
    return { redirect };
  }


  // refresh token
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res() res: Response) {
    const oldToken = req.cookies?.refreshToken;
    const result = await this.authService.refreshToken(req.user.sub, oldToken);

    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 1 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.json({ message: 'Token đã được làm mới' });
  }

  // get role
  @UseGuards(AuthGuard('jwt'))
  @Get('role')
  getRole(@Req() req) {
    return { role: req.user.role }
  }

  // register
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // get profile
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return this.authService.getProfile(req.user.userId);
  }

  // logout
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.userId;
    
    if (!userId) {
      return { message: 'Unauthorized' };
    }

    // Xoá cookie trong controller
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return this.authService.logout(userId);
  }
}