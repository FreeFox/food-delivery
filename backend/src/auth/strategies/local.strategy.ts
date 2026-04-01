// src/auth/strategies/local.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ProfilesService } from '../../profiles/profiles.service';
import { AuthenticatedUser } from '../../common/types';

/**
 * Storefront local strategy.
 * Validates email + password for Customer login/register flow.
 * On success, the returned user object is serialized into the session.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly profilesService: ProfilesService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.profilesService.validateCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }
}
