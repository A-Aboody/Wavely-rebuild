import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDto, RegisterDto, AuthResponse } from '@wavely/shared';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request): Promise<{ accessToken: string }> {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const userId = req.user['sub'];
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    return this.authService.getUserProfile(req.user['sub']);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('code') code: string, @Req() req: Request): Promise<{ message: string }> {
    const userId = req.user['sub'];
    return this.authService.verifyEmail(code, userId);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Req() req: Request): Promise<{ message: string }> {
    const userId = req.user['sub'];
    return this.authService.resendVerificationCode(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(token, password);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if ('needsSetup' in result && result.needsSetup) {
      const redirectUrl = `${frontendUrl}/auth/complete-profile?setupToken=${result.setupToken}&email=${encodeURIComponent(result.email)}&displayName=${encodeURIComponent(result.displayName)}`;
      return res.redirect(redirectUrl);
    }

    const authResult = result as AuthResponse;
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${authResult.accessToken}&refreshToken=${authResult.refreshToken}`;
    res.redirect(redirectUrl);
  }

  @Post('google/complete')
  @HttpCode(HttpStatus.OK)
  async completeGoogleSignup(
    @Body('setupToken') setupToken: string,
    @Body('username') username: string,
    @Body('displayName') displayName?: string,
  ): Promise<AuthResponse> {
    if (!setupToken || !username) {
      throw new BadRequestException('setupToken and username are required');
    }
    return this.authService.completeGoogleSignup(setupToken, username, displayName);
  }
}
