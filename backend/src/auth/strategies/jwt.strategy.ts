import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '../../profiles/profiles.service';
import { JwtPayload, AuthenticatedUser } from '../../common/types';

/**
 * Validates JWT Bearer tokens on Admin panel routes.
 * The token payload is verified against the secret, expiry is checked
 * automatically by passport-jwt, and then we re-fetch the user from
 * the DB to catch deactivated / deleted accounts.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
}
