import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PassportModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
