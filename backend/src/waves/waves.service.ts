import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWaveDto,
  UpdateWaveDto,
  FeedParams,
  Wave,
  CursorPaginatedResponse,
  WaveType,
} from '../types';

@Injectable()
export class WavesService {
  constructor(private prisma: PrismaService) {}

  async create(createWaveDto: CreateWaveDto, userId: string): Promise<Wave> {
    // Validate community wave
    if (createWaveDto.waveType === WaveType.COMMUNITY) {
      if (!createWaveDto.communityRatingScale || ![5, 10].includes(createWaveDto.communityRatingScale)) {
        throw new BadRequestException('Community waves must have a rating scale of 5 or 10');
      }
      if (createWaveDto.personalRating) {
        throw new BadRequestException('Community waves cannot have personal ratings');
      }
    }

    // Validate personal wave
    if (createWaveDto.waveType === WaveType.PERSONAL) {
      if (createWaveDto.personalRating !== undefined && createWaveDto.personalRating !== null) {
        if (createWaveDto.personalRating < 1 || createWaveDto.personalRating > 10) {
          throw new BadRequestException('Personal rating must be between 1 and 10');
        }
      }
    }

    const wave = await this.prisma.wave.create({
      data: {
        ...createWaveDto,
        userId,
        mediaUrls: createWaveDto.mediaUrls || [],
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
      },
    });

    return this.formatWave(wave);
  }

  async getFeed(
    params: FeedParams,
    currentUserId?: string,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const limit = Math.min(params.limit || 20, 50);
    const cursor = params.cursor;

    const where: any = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.waveType) {
      where.waveType = params.waveType;
    }

    if (cursor) {
      where.id = { lt: cursor };
    }

    const waves = await this.prisma.wave.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    const hasMore = waves.length > limit;
    const results = hasMore ? waves.slice(0, -1) : waves;
    const nextCursor = hasMore ? results[results.length - 1].id : undefined;

    const formattedWaves = await Promise.all(
      results.map((wave) => this.formatWave(wave, currentUserId)),
    );

    return {
      data: formattedWaves,
      meta: {
        nextCursor,
        hasMore,
      },
    };
  }

  async getFollowingFeed(
    params: FeedParams,
    userId: string,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const limit = Math.min(params.limit || 20, 50);
    const cursor = params.cursor;

    // Get following user IDs
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    const where: any = {
      userId: { in: followingIds },
    };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const waves = await this.prisma.wave.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    const hasMore = waves.length > limit;
    const results = hasMore ? waves.slice(0, -1) : waves;
    const nextCursor = hasMore ? results[results.length - 1].id : undefined;

    const formattedWaves = await Promise.all(
      results.map((wave) => this.formatWave(wave, userId)),
    );

    return {
      data: formattedWaves,
      meta: {
        nextCursor,
        hasMore,
      },
    };
  }

  async getUserWaves(
    username: string,
    params: FeedParams,
    currentUserId?: string,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = Math.min(params.limit || 20, 50);
    const cursor = params.cursor;

    const where: any = { userId: user.id };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const waves = await this.prisma.wave.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    const hasMore = waves.length > limit;
    const results = hasMore ? waves.slice(0, -1) : waves;
    const nextCursor = hasMore ? results[results.length - 1].id : undefined;

    const formattedWaves = await Promise.all(
      results.map((wave) => this.formatWave(wave, currentUserId)),
    );

    return {
      data: formattedWaves,
      meta: {
        nextCursor,
        hasMore,
      },
    };
  }

  async getTrending(limit: number, currentUserId?: string): Promise<Wave[]> {
    // Get waves from the last 7 days, sorted by engagement
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const waves = await this.prisma.wave.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      take: limit,
      orderBy: [
        { likesCount: 'desc' },
        { commentsCount: 'desc' },
        { viewsCount: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return Promise.all(
      waves.map((wave) => this.formatWave(wave, currentUserId)),
    );
  }

  async getTopRated(limit: number, currentUserId?: string): Promise<Wave[]> {
    const waves = await this.prisma.wave.findMany({
      where: {
        OR: [
          { personalRating: { not: null } },
          { averageRating: { not: null } },
        ],
      },
      take: limit,
      orderBy: [
        { averageRating: { sort: 'desc', nulls: 'last' } },
        { personalRating: { sort: 'desc', nulls: 'last' } },
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return Promise.all(
      waves.map((wave) => this.formatWave(wave, currentUserId)),
    );
  }

  async findOne(id: string, currentUserId?: string): Promise<Wave> {
    const wave = await this.prisma.wave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!wave) {
      throw new NotFoundException('Wave not found');
    }

    return this.formatWave(wave, currentUserId);
  }

  async update(
    id: string,
    updateWaveDto: UpdateWaveDto,
    userId: string,
  ): Promise<Wave> {
    const wave = await this.prisma.wave.findUnique({ where: { id } });

    if (!wave) {
      throw new NotFoundException('Wave not found');
    }

    if (wave.userId !== userId) {
      throw new ForbiddenException('You can only update your own waves');
    }

    const updatedWave = await this.prisma.wave.update({
      where: { id },
      data: updateWaveDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return this.formatWave(updatedWave, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const wave = await this.prisma.wave.findUnique({ where: { id } });

    if (!wave) {
      throw new NotFoundException('Wave not found');
    }

    if (wave.userId !== userId) {
      throw new ForbiddenException('You can only delete your own waves');
    }

    await this.prisma.wave.delete({ where: { id } });
  }

  async toggleLike(
    waveId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const existingLike = await this.prisma.like.findUnique({
      where: { userId_waveId: { userId, waveId } },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.wave.update({
          where: { id: waveId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    } else {
      // Like
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: { userId, waveId },
        }),
        this.prisma.wave.update({
          where: { id: waveId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return { liked: true };
    }
  }

  async toggleSave(
    waveId: string,
    userId: string,
  ): Promise<{ saved: boolean }> {
    const existingSave = await this.prisma.save.findUnique({
      where: { userId_waveId: { userId, waveId } },
    });

    if (existingSave) {
      // Unsave
      await this.prisma.$transaction([
        this.prisma.save.delete({
          where: { id: existingSave.id },
        }),
        this.prisma.wave.update({
          where: { id: waveId },
          data: { savesCount: { decrement: 1 } },
        }),
      ]);
      return { saved: false };
    } else {
      // Save
      await this.prisma.$transaction([
        this.prisma.save.create({
          data: { userId, waveId },
        }),
        this.prisma.wave.update({
          where: { id: waveId },
          data: { savesCount: { increment: 1 } },
        }),
      ]);
      return { saved: true };
    }
  }

  async incrementView(waveId: string): Promise<void> {
    await this.prisma.wave.update({
      where: { id: waveId },
      data: { viewsCount: { increment: 1 } },
    });
  }

  async getSavedBy(waveId: string, limit: number) {
    const saves = await this.prisma.save.findMany({
      where: { waveId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return saves.map((save) => save.user);
  }

  async getSavedWaves(
    username: string,
    params: FeedParams,
    currentUserId?: string,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = Math.min(params.limit || 20, 50);
    const cursor = params.cursor;

    const where: any = { userId: user.id };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const saves = await this.prisma.save.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        wave: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    const hasMore = saves.length > limit;
    const results = hasMore ? saves.slice(0, -1) : saves;
    const nextCursor = hasMore ? results[results.length - 1].id : undefined;

    const formattedWaves = await Promise.all(
      results.map((save) => this.formatWave(save.wave, currentUserId)),
    );

    return {
      data: formattedWaves,
      meta: {
        nextCursor,
        hasMore,
      },
    };
  }

  async getLikedWaves(
    username: string,
    params: FeedParams,
    currentUserId?: string,
  ): Promise<CursorPaginatedResponse<Wave>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = Math.min(params.limit || 20, 50);
    const cursor = params.cursor;

    const where: any = { userId: user.id };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const likes = await this.prisma.like.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        wave: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    const hasMore = likes.length > limit;
    const results = hasMore ? likes.slice(0, -1) : likes;
    const nextCursor = hasMore ? results[results.length - 1].id : undefined;

    const formattedWaves = await Promise.all(
      results.map((like) => this.formatWave(like.wave, currentUserId)),
    );

    return {
      data: formattedWaves,
      meta: {
        nextCursor,
        hasMore,
      },
    };
  }

  private async formatWave(wave: any, currentUserId?: string): Promise<Wave> {
    let isLiked = false;
    let isSaved = false;
    let userRating: number | undefined;

    if (currentUserId) {
      const [like, save, rating] = await Promise.all([
        this.prisma.like.findUnique({
          where: { userId_waveId: { userId: currentUserId, waveId: wave.id } },
        }),
        this.prisma.save.findUnique({
          where: { userId_waveId: { userId: currentUserId, waveId: wave.id } },
        }),
        this.prisma.rating.findUnique({
          where: { userId_waveId: { userId: currentUserId, waveId: wave.id } },
        }),
      ]);

      isLiked = !!like;
      isSaved = !!save;
      userRating = rating?.rating;
    }

    return {
      ...wave,
      createdAt: wave.createdAt.toISOString(),
      updatedAt: wave.updatedAt.toISOString(),
      isLiked,
      isSaved,
      userRating,
    };
  }
}
