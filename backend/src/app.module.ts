import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { WavesModule } from './waves/waves.module';
import { UploadModule } from './upload/upload.module';
import { CommentsModule } from './comments/comments.module';
import { UsersModule } from './users/users.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),

    PrismaModule,
    RedisModule,

    HealthModule,
    AuthModule,
    WavesModule,
    UploadModule,
    CommentsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
