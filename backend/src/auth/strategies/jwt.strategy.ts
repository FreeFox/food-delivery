import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload, AuthenticatedUser } from '../../common/types';

/**
 * Validates JWT Bearer tokens on Admin panel routes.
 * The token payload is verified against the secret, expiry is checked
 * automatically by passport-jwt, and then we re-fetch the user from
 * the DB to catch deactivated / deleted accounts.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      // Re-fetch so deactivated admins are blocked immediately
      const profile = await this.usersService.findPublicById(payload.sub);
      return profile;
    } catch {
      throw new UnauthorizedException('Token is no longer valid.');
    }
  }
}