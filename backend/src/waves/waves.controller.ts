import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WavesService } from './waves.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import type {
  CreateWaveDto,
  UpdateWaveDto,
  FeedParams,
  Wave,
  CursorPaginatedResponse,
} from '@wavely/shared';
import { Request } from 'express';

@Controller('waves')
@UseGuards(JwtAuthGuard)
export class WavesController {
  constructor(private readonly wavesService: WavesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createWaveDto: CreateWaveDto, @Req() req: Request): Promise<Wave> {
    const userId = req.user['sub'];
    return this.wavesService.create(createWaveDto, userId);
  }

  @Get()
  @Public()
  async findAll(
    @Query() params: FeedParams,
    @Req() req: Request,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const userId = req.user?.['sub'];
    return this.wavesService.getFeed(params, userId);
  }

  @Get('following')
  async getFollowingFeed(
    @Query() params: FeedParams,
    @Req() req: Request,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const userId = req.user['sub'];
    return this.wavesService.getFollowingFeed(params, userId);
  }

  @Get('trending')
  @Public()
  async getTrending(@Query('limit') limit: number = 10, @Req() req: Request): Promise<Wave[]> {
    const userId = req.user?.['sub'];
    return this.wavesService.getTrending(limit, userId);
  }

  @Get('top-rated')
  @Public()
  async getTopRated(@Query('limit') limit: number = 10, @Req() req: Request): Promise<Wave[]> {
    const userId = req.user?.['sub'];
    return this.wavesService.getTopRated(limit, userId);
  }

  @Get('user/:username/saved')
  @Public()
  async getSavedWaves(
    @Param('username') username: string,
    @Query() params: FeedParams,
    @Req() req: Request,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const currentUserId = req.user?.['sub'];
    return this.wavesService.getSavedWaves(username, params, currentUserId);
  }

  @Get('user/:username/liked')
  @Public()
  async getLikedWaves(
    @Param('username') username: string,
    @Query() params: FeedParams,
    @Req() req: Request,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const currentUserId = req.user?.['sub'];
    return this.wavesService.getLikedWaves(username, params, currentUserId);
  }

  @Get('user/:username')
  @Public()
  async findByUser(
    @Param('username') username: string,
    @Query() params: FeedParams,
    @Req() req: Request,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const currentUserId = req.user?.['sub'];
    return this.wavesService.getUserWaves(username, params, currentUserId);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<Wave> {
    const userId = req.user?.['sub'];
    return this.wavesService.findOne(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWaveDto: UpdateWaveDto,
    @Req() req: Request,
  ): Promise<Wave> {
    const userId = req.user['sub'];
    return this.wavesService.update(id, updateWaveDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userId = req.user['sub'];
    await this.wavesService.remove(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') id: string, @Req() req: Request): Promise<{ liked: boolean }> {
    const userId = req.user['sub'];
    return this.wavesService.toggleLike(id, userId);
  }

  @Post(':id/save')
  @HttpCode(HttpStatus.OK)
  async save(@Param('id') id: string, @Req() req: Request): Promise<{ saved: boolean }> {
    const userId = req.user['sub'];
    return this.wavesService.toggleSave(id, userId);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async incrementView(@Param('id') id: string): Promise<void> {
    await this.wavesService.incrementView(id);
  }

  @Get(':id/saved-by')
  async getSavedBy(@Param('id') id: string, @Query('limit') limit: number = 20) {
    return this.wavesService.getSavedBy(id, limit);
  }
}
