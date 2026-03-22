import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile, UpdateUserDto, UserStats } from '../types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(username: string, currentUserId?: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: false, // Don't expose email
        bio: true,
        profileImage: true,
        bannerImage: true,
        createdAt: true,
        _count: {
          select: {
            waves: true,
            followers: true,
            following: true,
            likes: true,
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { followerId: true },
            }
          : false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isFollowing = currentUserId && user.followers && user.followers.length > 0;
    const isOwnProfile = currentUserId === user.id;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      wavesCount: user._count.waves,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      likesCount: user._count.likes,
      isFollowing: !!isFollowing,
      isOwnProfile: !!isOwnProfile,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserProfile> {
    const { username, displayName, bio, profileImage, bannerImage } = updateUserDto;

    // Check if username is being changed and if it's already taken
    if (username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(profileImage !== undefined && { profileImage }),
        ...(bannerImage !== undefined && { bannerImage }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        profileImage: true,
        bannerImage: true,
        createdAt: true,
        _count: {
          select: {
            waves: true,
            followers: true,
            following: true,
            likes: true,
          },
        },
      },
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      wavesCount: user._count.waves,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      likesCount: user._count.likes,
      isFollowing: false,
      isOwnProfile: true,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            waves: true,
            followers: true,
            following: true,
            likes: true,
            saves: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get total views on user's waves
    const viewsResult = await this.prisma.wave.aggregate({
      where: { userId },
      _sum: {
        viewsCount: true,
      },
    });

    // Get average rating for personal waves
    const ratingResult = await this.prisma.wave.aggregate({
      where: {
        userId,
        waveType: 'PERSONAL',
        personalRating: { not: null },
      },
      _avg: {
        personalRating: true,
      },
    });

    return {
      wavesCount: user._count.waves,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      likesGiven: user._count.likes,
      savesCount: user._count.saves,
      commentsCount: user._count.comments,
      totalViews: viewsResult._sum.viewsCount || 0,
      averageRating: ratingResult._avg.personalRating || null,
    };
  }

  async follow(
    followerId: string,
    followingId: string,
  ): Promise<{ following: boolean }> {
    if (followerId === followingId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return { following: false };
    } else {
      // Follow
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      return { following: true };
    }
  }

  async getFollowers(username: string, limit: number = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followers = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return followers.map((f) => f.follower);
  }

  async getFollowing(username: string, limit: number = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const following = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return following.map((f) => f.following);
  }

  async searchUsers(query: string, limit: number = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            waves: true,
          },
        },
      },
      take: limit,
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    });
  }
}
