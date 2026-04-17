import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateUserDto } from '../profiles/dto/profile.dto';
import { AuthenticatedUser, JwtPayload, TokenPair } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

const REFRESH_TOKEN_TTL_DAYS = 7;
const BCRYPT_ROUNDS = 10;

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

    /**
     * Validates a password reset token and applies the new password.
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        let payload: { sub: string; purpose: string };

        try {
            payload = this.jwtService.verify(token, {
                secret: this.configService.getOrThrow('JWT_RESET_SECRET'),
            });
        } catch {
            throw new BadRequestException(
                'Reset link is invalid or has expired. Please request a new one.',
            );
        }
        if (payload.purpose !== 'password-reset') {
            throw new BadRequestException('Invalid token purpose.');
        }

        await this.profilesService.setPassword(payload.sub, newPassword);
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

    // ─── Admin: JWT issuance ──────────────────────────────────────────────────

    /**
     * Issues an access token + refresh token pair for an Admin user.
     * The refresh token is hashed and persisted in the DB.
     */
    async issueAdminTokens(user: AuthenticatedUser): Promise<TokenPair> {
        const accessToken = this.signAccessToken(user);
        const refreshToken = await this.createRefreshToken(user.id);
        return { accessToken, refreshToken };
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private signAccessToken(user: AuthenticatedUser): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        });
    }

    private async createRefreshToken(profileId: string): Promise<string> {
        const raw = uuidv4();
        const tokenHash = await bcrypt.hash(raw, BCRYPT_ROUNDS);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

        await this.prisma.refreshToken.create({
            data: { profileId, tokenHash, expiresAt },
        });

        return raw; // Return raw token — only the hash lives in the DB
    }
}
