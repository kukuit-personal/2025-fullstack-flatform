import { 
  Body, Controller, Delete, Get, Param, Post, Put, Patch, BadRequestException,
  ParseIntPipe, Query, DefaultValuePipe, HttpCode, HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getAllUsers({ page, limit });
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Roles('admin')
  @Put(':id')
  @ApiOperation({ summary: 'Update user info' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete (disable) user' })
  @ApiResponse({ status: 204, description: 'User soft deleted' })
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.disableUser(id);
  }

  @Roles('admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (active/disable)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'active' | 'disable',
  ) {
    if (!['active', 'disable'].includes(status)) {
      throw new BadRequestException('Invalid status')
    }

    return this.usersService.updateStatus(id, status)
  }
}