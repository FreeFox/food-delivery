import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Role } from '@prisma/client';
import { ProfilesService } from '../../profiles/profiles.service';
import { AuthenticatedUser } from '../../common/types';

/**
 * Admin panel local strategy.
 * Same credential check as LocalStrategy but additionally asserts
 * that the user holds the ADMIN role.
 *
 * Registered under the name 'admin-local' to avoid colliding with
 * the storefront 'local' strategy.
 */
@Injectable()
export class AdminLocalStrategy extends PassportStrategy(
    Strategy,
    'admin-local',
) {
    constructor(private readonly profilesService: ProfilesService) {
        super({ usernameField: 'email', passwordField: 'password' });
    }

    async validate(email: string, password: string): Promise<AuthenticatedUser> {
        const user = await this.profilesService.validateCredentials(email, password);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        if (user.role !== Role.ADMIN) {
            // Return a 403 so the admin panel can distinguish "wrong credentials"
            // from "not authorized for this area"
            throw new ForbiddenException('Access to the admin panel is restricted.');
        }

        return user;
    }
}
