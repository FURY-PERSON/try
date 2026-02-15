import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UsersService, UserStats } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeviceAuthGuard } from '@/common/guards/device-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user or return existing user by device ID' })
  @ApiResponse({ status: 201, description: 'User successfully registered or found' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async register(@Body() dto: RegisterUserDto): Promise<User> {
    return this.usersService.register(dto.deviceId);
  }

  @Patch('me')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Update current user settings' })
  @ApiResponse({ status: 200, description: 'User settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing device authentication' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(user.id, dto);
  }

  @Get('me/stats')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing device authentication' })
  async getMyStats(@CurrentUser() user: User): Promise<UserStats> {
    return this.usersService.getUserStats(user.id);
  }
}
