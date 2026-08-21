// Shared types between frontend and backend

// User types
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

  // Stats (computed)
  followersCount?: number;
  followingCount?: number;
  wavesCount?: number;
}

// Public profile shape. Deliberately excludes email: this is served by a public endpoint.
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

export interface UpdateUserDto {
  username?: string;
  displayName?: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
}

// Auth types
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

// Wave types
export enum WaveType {
  PERSONAL = 'PERSONAL',
  COMMUNITY = 'COMMUNITY',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
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

  // Current user's interaction state
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
  communityRatingScale?: number; // 5 or 10
}

export interface UpdateWaveDto {
  title?: string;
  content?: string;
  category?: string;
  location?: string;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  waveId: string;
  parentCommentId?: string;
  likesCount: number;
  repliesCount?: number;

  user: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
  };
  replies?: Comment[];

  isLiked?: boolean;
}

export interface CreateCommentDto {
  content: string;
  waveId: string;
  parentCommentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}

// Rating types
export interface Rating {
  id: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  waveId: string;
}

export interface CreateRatingDto {
  waveId: string;
  rating: number;
}

export interface UpdateRatingDto {
  rating: number;
}

// Follow types
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Notification types
export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  RATING = 'RATING',
  MENTION = 'MENTION',
}

export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  userId: string;
}

// Feed & Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

export interface FeedParams extends PaginationParams {
  userId?: string;
  category?: string;
  waveType?: WaveType;
  following?: boolean;
}

// Search types
export interface SearchParams {
  query: string;
  type?: 'waves' | 'users' | 'all';
  page?: number;
  limit?: number;
}

export interface SearchResults {
  waves: Wave[];
  users: User[];
}

// Upload types
export interface UploadResponse {
  url: string;
  key: string;
  thumbnailUrl?: string;
}

export interface GenerateUploadUrlDto {
  fileName: string;
  fileType: string;
  mediaType: MediaType;
}

// Websocket types
export enum WebSocketEvent {
  NOTIFICATION = 'notification',
  WAVE_LIKED = 'wave:liked',
  WAVE_COMMENTED = 'wave:commented',
  WAVE_RATED = 'wave:rated',
  USER_FOLLOWED = 'user:followed',
  ONLINE_STATUS = 'online:status',
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEvent;
  data: T;
}

// Error types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
}

// Statistics types
export interface UserStats {
  wavesCount: number;
  followersCount: number;
  followingCount: number;
  likesGiven: number;
  savesCount: number;
  commentsCount: number;
  totalViews: number;
  averageRating?: number;
  topCategories?: { category: string; count: number }[];
}

export interface DashboardStats {
  recentWaves: Wave[];
  topRatedWaves: Wave[];
  trendingCategories: string[];
  followingSuggestions: User[];
}
