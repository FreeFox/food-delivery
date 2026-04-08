import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProfilesModule } from '@/profiles/profiles.module';
import { LocalStrategy } from './strategies/local.strategy';
import { SessionSerializer } from './strategies/session.serializer';

@Module({
  imports: [
    // PassportModule with 'session' as the default strategy so that
    // @UseGuards(AuthGuard()) (no arg) defaults to session on the storefront.
    PassportModule.register({ defaultStrategy: 'session', session: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        if (!secret) {
          console.error('ERROR: JWT_SECRET environment variable is not set');
          process.exit(1);
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
    ProfilesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    // AdminLocalStrategy,
    // JwtStrategy,
    SessionSerializer,
  ],
  exports: [AuthService],
})
export class AuthModule {}
