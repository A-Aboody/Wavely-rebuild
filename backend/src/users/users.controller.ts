import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { UserProfile, UpdateUserDto, UserStats } from '../types';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @Public()
  async search(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.usersService.searchUsers(query, limit);
  }

  @Get(':username')
  @Public()
  async getProfile(
    @Param('username') username: string,
    @Req() req: Request,
  ): Promise<UserProfile> {
    const currentUserId = req.user?.['sub'];
    return this.usersService.getProfile(username, currentUserId);
  }

  @Put('me')
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserProfile> {
    const userId = req.user['sub'];
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Get('me/stats')
  async getMyStats(@Req() req: Request): Promise<UserStats> {
    const userId = req.user['sub'];
    return this.usersService.getStats(userId);
  }

  @Post(':userId/follow')
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('userId') followingId: string,
    @Req() req: Request,
  ): Promise<{ following: boolean }> {
    const followerId = req.user['sub'];
    return this.usersService.follow(followerId, followingId);
  }

  @Get(':username/followers')
  @Public()
  async getFollowers(
    @Param('username') username: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.usersService.getFollowers(username, limit);
  }

  @Get(':username/following')
  @Public()
  async getFollowing(
    @Param('username') username: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.usersService.getFollowing(username, limit);
  }
}
