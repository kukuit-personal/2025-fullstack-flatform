import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ulid } from 'ulid';
import { RegisterWithRoleDto } from './dto/register-with-role.dto';
import { ChangePasswordAdminDto } from './dto/change-password-admin.dto';

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
  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name, // ⚠️ rất quan trọng cho @Roles()
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    // Lưu session refresh token
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
        ip,
        userAgent,
        deviceName: '',
      },
    });

    // Cập nhật lần đăng nhập gần nhất
    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Lưu vào log đăng nhập
    await this.prisma.loginLog.create({
      data: {
        userId: user.id,
        ip: ip ?? '',
        userAgent: userAgent ?? '',
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        redirectUrl: user.role?.url_login_default ?? '/',
      },
    };
  }

  /**
   * Làm mới token
   * @param userId ID người dùng
   * @param oldToken Token cũ
   * @returns { accessToken, refreshToken }
   */
  async refreshToken(userId: string, oldToken: string) {
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
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.users.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email đã tồn tại');

    const role = await this.prisma.role.findUnique({
      where: { name: 'client' },
    });
    if (!role) throw new BadRequestException('Vai trò mặc định không hợp lệ');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        id: ulid(),
        email,
        password: hashedPassword,
        roleId: role.id,
        profile: { create: { id: ulid(), dob: null } },
      },
      include: { profile: true },
    });

    return { message: 'Đăng ký thành công', userId: user.id };
  }

  async registerWithRole(dto: RegisterWithRoleDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.users.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email đã tồn tại');

    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });
    if (!role) throw new BadRequestException('Vai trò không hợp lệ');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        id: ulid(),
        email,
        password: hashedPassword,
        roleId: role.id,
        profile: { create: { id: ulid(), dob: null } },
      },
      include: { profile: true },
    });

    return { message: 'Đăng ký (gán role) thành công', userId: user.id };
  }

  async getProfile(userId: string) {
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

  // Logout
  async logout(userId: string) {
    // Delete all refreshToken in session table related to user
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

  // Admin: Change password by email
  async adminChangePasswordByEmail(dto: ChangePasswordAdminDto) {
    const email = dto.email.toLowerCase().trim();

    // Tìm user theo email (nếu DB đã chuyển sang private_email, thay where: { private_email: email })
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Hash mật khẩu mới (pattern giống register) :contentReference[oaicite:3]{index=3}
    const hashed = await bcrypt.hash(dto.newPassword, 10);

    // Cập nhật + revoke mọi phiên đăng nhập (pattern giống logout) :contentReference[oaicite:4]{index=4}
    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
      this.prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    return {
      message: 'Đổi mật khẩu thành công. Người dùng cần đăng nhập lại.',
    };
  }
}
