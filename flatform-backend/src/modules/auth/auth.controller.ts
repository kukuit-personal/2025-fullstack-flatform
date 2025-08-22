import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { Public } from '@/common/decorators/public.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RegisterWithRoleDto } from './dto/register-with-role.dto';
import { ChangePasswordAdminDto } from './dto/change-password-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );

    // Set cookies
    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: false,
      // maxAge: 10 * 1000,  // test 10s
      maxAge: 1 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    const redirect = result.user.redirectUrl || '/';
    return { redirect };
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    return typeof forwarded === 'string'
      ? forwarded.split(',')[0]
      : (req as any).socket?.remoteAddress || '';
  }

  // Refresh token
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res() res: Response) {
    const oldToken = req.cookies?.refreshToken;
    const result = await this.authService.refreshToken(req.user.sub, oldToken);

    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: false,
      // maxAge: 10 * 1000,  // test 10s
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

  // Get role
  @Public()
  @UseGuards(AuthGuard('jwt'))
  @Get('role')
  getRole(@Req() req) {
    return { role: req.user.role };
  }

  // Register
  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('admin')
  @Post('register-role')
  registerWithRole(@Body() dto: RegisterWithRoleDto) {
    return this.authService.registerWithRole(dto);
  }

  // Get profile
  @Public()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return this.authService.getProfile(req.user.id);
  }

  // Logout
  @Public()
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return { message: 'Unauthorized' };
    }

    // Delete cookie
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

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('admin')
  @Post('admin-change-password')
  changePasswordByAdmin(@Body() dto: ChangePasswordAdminDto) {
    return this.authService.adminChangePasswordByEmail(dto);
  }
}
