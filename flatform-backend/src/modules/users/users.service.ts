import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getUserById(id: number) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async getAllUsers({ page, limit }: { page: number; limit: number }) {
    const whereCondition = { status: { in: ['active', 'disable'] } };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          profile: true,
          role: true,
        },
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.users.count({ where: whereCondition }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createUser(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.usersRepo.createUser({
      email: dto.email,
      password: hashedPassword,
      roleId: Number(dto.role),
      status: 'active',
      profile: {
        create: {
          name: dto.name ?? '',
          phone: dto.phone ?? null,
          avatar: dto.avatar ?? null,
          gender: dto.gender ?? null,
          dob: dto.dob ? new Date(dto.dob) : null,
          status: 'active',
        },
      },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const updateData: any = {
      roleId: dto.role ? Number(dto.role) : undefined,
      profile: {
        update: {
          name: dto.name,
          phone: dto.phone,
          avatar: dto.avatar,
          gender: dto.gender,
          dob: dto.dob ? new Date(dto.dob) : undefined,
        },
      },
    };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.usersRepo.updateUser(id, updateData);
  }

  async disableUser(id: number) {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return this.usersRepo.updateUser(id, {
      status: 'disable',
      profile: {
        update: {
          status: 'disable',
        },
      },
    });
  }

  async updateStatus(id: number, status: 'active' | 'disable') {
    const user = await this.usersRepo.findById(id)
    if (!user) throw new NotFoundException('User not found')

    return this.usersRepo.updateUser(id, {
      status,
      profile: {
        update: { status },
      },
    })
  }
}
