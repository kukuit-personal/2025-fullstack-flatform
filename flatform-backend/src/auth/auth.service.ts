import { Injectable, ConflictException, UnauthorizedException, BadRequestException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { role: true }, // include bảng roles
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }

    const payload = { sub: user.id, role: user.role.name }; // role.name mới là 'client' | 'admin'
    const token = this.jwtService.sign(payload);

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken: token };
  }

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
      include: { profile: true },
    });

    if (user?.profile?.dob?.getFullYear?.() === 0) {
      user.profile.dob = null;
    }

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    return { 
      message: 'Thông tin người dùng đã xác thực',
      user,
    };
  }
}