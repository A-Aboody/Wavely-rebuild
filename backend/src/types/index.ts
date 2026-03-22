// Shared types for Wavely

// ============ USER TYPES ============
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  followersCount?: number;
  followingCount?: number;
  wavesCount?: number;
}

export interface UpdateUserDto {
  username?: string;
  displayName?: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
}

// ============ AUTH TYPES ============
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============ WAVE TYPES ============
export enum WaveType {
  PERSONAL = 'PERSONAL',
  COMMUNITY = 'COMMUNITY'
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO'
}

export interface Wave {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  location?: string;
  waveType: WaveType;
  mediaType?: MediaType;
  mediaUrls: string[];
  thumbnailUrl?: string;
  personalRating?: number;
  communityRatingScale?: number;
  averageRating?: number;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  userRating?: number;
}

export interface CreateWaveDto {
  title?: string;
  content?: string;
  category?: string;
  location?: string;
  waveType: WaveType;
  mediaType?: MediaType;
  mediaUrls?: string[];
  thumbnailUrl?: string;
  personalRating?: number;
  communityRatingScale?: number;
}

export interface UpdateWaveDto {
  title?: string;
  content?: string;
  category?: string;
  location?: string;
}

// ============ FEED TYPES ============
export interface FeedParams {
  page?: number;
  limit?: number;
  cursor?: string;
  userId?: string;
  category?: string;
  waveType?: WaveType;
  following?: boolean;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

// ============ COMMENT TYPES ============
export interface Comment {
  id: string;
  content: string;
  userId: string;
  waveId: string;
  parentCommentId?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
  };
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  waveId: string;
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}

// ============ USER PROFILE & STATS TYPES ============
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  wavesCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  createdAt: string;
}

export interface UserStats {
  wavesCount: number;
  followersCount: number;
  followingCount: number;
  likesGiven: number;
  savesCount: number;
  commentsCount: number;
  totalViews: number;
  averageRating?: number;
}