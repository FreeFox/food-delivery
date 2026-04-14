import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateUserDto } from '../profiles/dto/profile.dto';
import { AuthenticatedUser, JwtPayload, TokenPair } from '../common/types';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly profilesService: ProfilesService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(
        dto: CreateUserDto,
        guestId?: string,
    ): Promise<AuthenticatedUser> {
        const profile = await this.profilesService.createCustomer(dto);

        if (guestId) {
            // await this.migrateGuestCart(guestId, profile.id);
        }

        return profile;
    }

    async login(email: string, password: string) {
        // const [users] = await this.db.execute<{ id: string; password: string }>(
        //   'SELECT id, password FROM users WHERE email = ?',
        //   [email],
        // );
        // if (users.length === 0) {
        //   throw new UnauthorizedException('Invalid credentials');
        // }

        // const user = users[0];
        // const validPassword = await bcrypt.compare(password, user.password);
        // if (!validPassword) {
        //   throw new UnauthorizedException('Invalid credentials');
        // }

        // const token = this.jwt.sign({ userId: user.id, email });
        // return { userId: user.id, email, token };
    }

    // ─── Password reset ───────────────────────────────────────────────────────

    /**
     * Generates a short-lived signed JWT to be embedded in a reset link.
     * The token payload carries only the profileId and a 'purpose' claim to
     * prevent the reset token from being used as an access token.
     */
    async createPasswordResetToken(email: string): Promise<string> {
        const profile = await this.profilesService.findByEmail(email);

        if (!profile) return '';

        return this.jwtService.sign(
            { sub: profile.id, purpose: 'password-reset' },
            {
                secret: this.configService.getOrThrow('JWT_RESET_SECRET'),
                expiresIn: '1h',
            },
        );
    }

    // ─── Storefront: post-login hook ──────────────────────────────────────────

    /**
     * Called after Passport validates the credentials and sets req.user.
     * Handles guest cart migration so AuthController stays thin.
     */
    async onCustomerLogin(
        user: AuthenticatedUser,
        guestId?: string,
    ): Promise<AuthenticatedUser> {
        if (guestId) {
            // await this.migrateGuestCart(guestId, user.id);
        }
        return user;
    }
}
