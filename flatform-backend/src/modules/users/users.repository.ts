import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()

export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.users.findUnique({ where: { id }, include: { role: true, profile: true } });
  }

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({ where: { email }, include: { role: true, profile: true } });
  }

  async createUser(data: any) {
    return this.prisma.users.create({ data });
  }

  async updateUser(id: number, data: any) {
    return this.prisma.users.update({ where: { id }, data });
  }

  async deleteUser(id: number) {
    return this.prisma.users.delete({ where: { id } });
  }

  async findAllWithProfile(status?: string) {
    return this.prisma.users.findMany({
      where: status ? { status } : undefined,
      include: { profile: true },
    });
  }

  async softDelete(id: number) {
    return this.prisma.users.update({
      where: { id },
      data: { status: 'DISABLED' }
    });
  }
} 