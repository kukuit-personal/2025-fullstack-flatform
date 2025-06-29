import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 // login
 @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: false, // only set true in HTTPS (production)
      maxAge: 2 * 60 * 60 * 1000,
      sameSite: 'lax', // or 'none' if using cross-site cookies
    });

    return res.json({ message: 'Đăng nhập thành công' });
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
}