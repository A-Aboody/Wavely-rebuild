import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import {
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
} from '../types';
import { Request } from 'express';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ): Promise<Comment> {
    const userId = req.user['sub'];
    return this.commentsService.create(createCommentDto, userId);
  }

  @Get('wave/:waveId')
  @Public()
  async findByWave(
    @Param('waveId') waveId: string,
    @Req() req: Request,
  ): Promise<Comment[]> {
    const userId = req.user?.['sub'];
    return this.commentsService.findByWave(waveId, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request,
  ): Promise<Comment> {
    const userId = req.user['sub'];
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userId = req.user['sub'];
    await this.commentsService.remove(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ liked: boolean }> {
    const userId = req.user['sub'];
    return this.commentsService.toggleLike(id, userId);
  }
}
