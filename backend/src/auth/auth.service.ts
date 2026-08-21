import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import type { LoginDto, RegisterDto, AuthResponse, User } from '@wavely/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { username: registerDto.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('Email already in use');
      }
      if (existingUser.username === registerDto.username) {
        throw new ConflictException('Username already taken');
      }
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(registerDto.username)) {
      throw new BadRequestException(
        'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        displayName: registerDto.displayName || registerDto.username,
        password: hashedPassword,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
        emailVerified: false,
        lastLogin: new Date(),
      },
    });

    try {
      await this.emailService.sendVerificationEmail(user.email, verificationCode, user.username);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string }> {
    const storedToken = await this.redisService.get(`refresh:${userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.redisService.del(`refresh:${userId}`);
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            waves: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...this.sanitizeUser(user),
      wavesCount: user._count.waves,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const ttl = 7 * 24 * 60 * 60;
    await this.redisService.set(`refresh:${userId}`, refreshToken, ttl);
  }

  async verifyEmail(code: string, userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    try {
      await this.emailService.sendWelcomeEmail(user.email, user.username);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { message: 'Email verified successfully' };
  }

  async resendVerificationCode(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationCode, user.username);

    return { message: 'Verification code sent' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return { message: 'If an account exists, a password reset email has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.username);

    return { message: 'If an account exists, a password reset email has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async googleLogin(
    googleUser: any,
  ): Promise<
    AuthResponse | { needsSetup: true; setupToken: string; email: string; displayName: string }
  > {
    const user = await this.prisma.user.findFirst({
      where: {
        provider: 'GOOGLE',
        providerId: googleUser.providerId,
      },
    });

    if (!user) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use with a different login method');
      }

      // New Google user — store their data temporarily and ask them to pick a username
      const setupToken = crypto.randomBytes(32).toString('hex');
      const googleData = {
        email: googleUser.email,
        displayName: googleUser.displayName,
        profileImage: googleUser.profileImage,
        providerId: googleUser.providerId,
      };
      await this.redisService.set(
        `google_setup:${setupToken}`,
        JSON.stringify(googleData),
        600, // 10 minutes
      );

      return {
        needsSetup: true,
        setupToken,
        email: googleUser.email,
        displayName: googleUser.displayName || '',
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async completeGoogleSignup(
    setupToken: string,
    username: string,
    displayName?: string,
  ): Promise<AuthResponse> {
    const googleDataStr = await this.redisService.get(`google_setup:${setupToken}`);
    if (!googleDataStr) {
      throw new BadRequestException('Setup session expired. Please sign in with Google again.');
    }

    const googleData = JSON.parse(googleDataStr);

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new BadRequestException(
        'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      );
    }

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.prisma.user.create({
      data: {
        email: googleData.email,
        username,
        displayName: displayName || googleData.displayName || username,
        profileImage: googleData.profileImage,
        provider: 'GOOGLE',
        providerId: googleData.providerId,
        emailVerified: true,
        password: null,
        lastLogin: new Date(),
      },
    });

    await this.redisService.del(`google_setup:${setupToken}`);

    try {
      await this.emailService.sendWelcomeEmail(user.email, user.username);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Allowlist: only these fields ever reach a client. Never spread the Prisma record,
  // or new columns leak by default.
  private sanitizeUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio ?? undefined,
      profileImage: user.profileImage ?? undefined,
      bannerImage: user.bannerImage ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    };
  }
}
