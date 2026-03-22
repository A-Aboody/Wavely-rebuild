import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
} from '../types';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const { waveId, content, parentCommentId } = createCommentDto;

    // Verify wave exists
    const wave = await this.prisma.wave.findUnique({
      where: { id: waveId },
    });

    if (!wave) {
      throw new NotFoundException('Wave not found');
    }

    // If replying to a comment, verify it exists
    if (parentCommentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentCommentId },
      });

      if (!parentComment || parentComment.waveId !== waveId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        userId,
        waveId,
        parentCommentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    // Increment comments count on wave
    await this.prisma.wave.update({
      where: { id: waveId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });

    return this.transformComment(comment);
  }

  async findByWave(
    waveId: string,
    userId?: string,
  ): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany({
      where: {
        waveId,
        parentCommentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImage: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments.map((comment) => this.transformComment(comment, userId));
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    return this.transformComment(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        wave: {
          select: { userId: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only comment owner or wave owner can delete
    if (comment.userId !== userId && comment.wave.userId !== userId) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    // Delete comment and its replies (cascade)
    await this.prisma.comment.delete({
      where: { id },
    });

    // Decrement comments count on wave
    await this.prisma.wave.update({
      where: { id: comment.waveId },
      data: {
        commentsCount: {
          decrement: 1,
        },
      },
    });
  }

  async toggleLike(
    id: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId: id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId: id,
          },
        },
      });

      return { liked: false };
    } else {
      // Like
      await this.prisma.commentLike.create({
        data: {
          userId,
          commentId: id,
        },
      });

      return { liked: true };
    }
  }

  private transformComment(comment: any, userId?: string): Comment {
    const likesCount = comment._count?.likes || 0;
    const repliesCount = comment._count?.replies || 0;
    const isLiked = userId && comment.likes?.length > 0;

    return {
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      waveId: comment.waveId,
      parentCommentId: comment.parentCommentId,
      user: comment.user,
      likesCount,
      repliesCount,
      isLiked: !!isLiked,
      replies: comment.replies?.map((reply) => this.transformComment(reply, userId)),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
