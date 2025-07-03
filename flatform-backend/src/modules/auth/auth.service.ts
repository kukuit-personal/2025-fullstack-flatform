import { Injectable, ConflictException, UnauthorizedException, BadRequestException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Đăng nhập người dùng
   * @param email Email người dùng
   * @param password Mật khẩu người dùng
   * @param ip Địa chỉ IP (nếu có)
   * @param userAgent Thông tin trình duyệt (nếu có)
   * @returns { accessToken, refreshToken }
   */
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const payload = { sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip,
        userAgent,
        deviceName: '', // Có thể truyền từ client nếu muốn
      },
    });

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, role: user.role.name, };
  }

  /**
   * Làm mới token
   * @param userId ID người dùng
   * @param oldToken Token cũ
   * @returns { accessToken, refreshToken }
   */
  async refreshToken(userId: number, oldToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: oldToken },
      include: { user: { include: { role: true } } },
    });

    if (!session || session.user.id !== userId) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    await this.prisma.session.delete({ where: { id: session.id } });

    const payload = { sub: session.user.id, role: session.user.role.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.session.create({
      data: {
        userId: session.user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: session.ip,
        userAgent: session.userAgent,
        deviceName: session.deviceName,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Đăng ký người dùng mới
   * @param dto Thông tin đăng ký
   * @returns { message, userId }
   */
  async register(dto: RegisterDto) {
    // Kiểm tra email đã tồn tại
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Lấy role theo tên (hoặc mặc định là 'client')
    const role = await this.prisma.role.findUnique({
      where: { name: dto.role || 'client' },
    });
    if (!role) {
      throw new BadRequestException('Vai trò không hợp lệ');
    }

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tạo user mới
    const user = await this.prisma.users.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        roleId: role.id,
        profile: {
          create: { dob: null },
        },
      },
      include: {
        profile: true,
      },
    });

    return { message: 'Đăng ký thành công', userId: user.id };
  }


  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { 
        profile: true,
        role: true,
      },
    });

    if (user?.profile?.dob?.getFullYear?.() === 0) {
      user.profile.dob = null;
    }

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    return { 
      message: 'Thông tin người dùng đã xác thực',
      user: {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        status: user.status,
        profile: user.profile,
      },
    };
  }

   // logout
  async logout(userId: number) {
    // Xoá tất cả refreshToken trong bảng session liên quan đến user
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }
}