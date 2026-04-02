// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController, AdminAuthController } from './auth.controller';

import { LocalStrategy } from './strategies/local.strategy';
import { AdminLocalStrategy } from './strategies/admin-local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionSerializer } from './strategies/session.serializer';

import { ProfilesModule } from '../profiles/profiles.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ProfilesModule,
    PrismaModule,
    ConfigModule,

    // PassportModule with 'session' as the default strategy so that
    // @UseGuards(AuthGuard()) (no arg) defaults to session on the storefront.
    PassportModule.register({ defaultStrategy: 'session', session: true }),

    // JwtModule is configured lazily from ConfigService so the secret is
    // read from environment variables at runtime, not at build time.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],

  controllers: [AuthController, AdminAuthController],

  providers: [
    AuthService,
    // Passport strategies
    LocalStrategy,
    AdminLocalStrategy,
    JwtStrategy,
    // Session serializer (used by passport.serializeUser / deserializeUser)
    SessionSerializer,
  ],

  exports: [AuthService],
})
export class AuthModule {}