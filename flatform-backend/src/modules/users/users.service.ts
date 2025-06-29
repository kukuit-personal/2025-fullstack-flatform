import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getUserById(id: number) {
    return this.usersRepo.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async createUser(dto: CreateUserDto) {
    return this.usersRepo.createUser(dto);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    return this.usersRepo.updateUser(id, dto);
  }

  async deleteUser(id: number) {
    return this.usersRepo.deleteUser(id);
  }
}