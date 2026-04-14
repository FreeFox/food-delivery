import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/profile.dto';
import { AuthenticatedUser } from '@/common/types';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Profile, Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const GUEST_SESSION_TTL_DAYS = 30;


@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find a user by email. Returns null if not found.
     * Used by Passport local strategy — includes passwordHash.
     */
    async findByEmail(email: string): Promise<Profile | null> {
        return this.prisma.profile.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
    }

    /**
     * Find a user by ID. Throws NotFoundException if missing.
     */
    async findById(id: string): Promise<Profile> {
        const profile = await this.prisma.profile.findUnique({ where: { id } });

        if (!profile) {
            throw new NotFoundException(`Profile ${id} not found.`);
        }

        return profile;
    }

    /**
     * Returns a safe public projection (no passwordHash).
     */
    async findPublicById(id: string): Promise<AuthenticatedUser> {
        const profile = await this.findById(id);

        return this.toPublic(profile);
    }

    async createCustomer(dto: CreateUserDto): Promise<AuthenticatedUser> {
        await this.assertEmailAvailable(dto.email);

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        const profile = await this.prisma.profile.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: Role.CUSTOMER
            },
        });

        return this.toPublic(profile);
    }

    // ─── Password validation ──────────────────────────────────────────────────

    /**
     * Validates email + password. Returns the safe public user on success,
     * null on failure. Used by LocalStrategy.
     */
    async validateCredentials(
        email: string,
        password: string,
    ): Promise<AuthenticatedUser | null> {
        const profile = await this.findByEmail(email);
        if (!profile || !profile.isActive || !profile.passwordHash) {
            return null;
        }

        const isValid = await bcrypt.compare(password, profile.passwordHash);
        if (!isValid) return null;

        return this.toPublic(profile);
    }

    /**
     * Update password. Verifies the current password before hashing the new one.
     */
    async changePassword(
        profileId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const profile = await this.findById(profileId);

        if (!profile.passwordHash) {
            throw new BadRequestException(
                'No password set on this account. Use social login.',
            );
        }

        const isValid = await bcrypt.compare(currentPassword, profile.passwordHash);
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect.');
        }

        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.prisma.profile.update({
            where: { id: profileId },
            data: { passwordHash },
        });
    }

    /**
     * Set a new password directly (used during password reset flow after
     * the reset token has already been validated by AuthService).
     */
    async setPassword(profileId: string, newPassword: string): Promise<void> {
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.prisma.profile.update({
            where: { id: profileId },
            data: { passwordHash },
        });
    }

    // ─── Guest session management ─────────────────────────────────────────────

    /**
     * Creates or returns an existing GuestSession record, ensuring a
     * corresponding empty Cart exists as well.
     */
    // async ensureGuestSession(guestId?: string): Promise<string> {
    //     if (guestId) {
    //         const existing = await this.prisma.guestSession.findUnique({
    //             where: { guestId },
    //         });

    //         if (existing && existing.expiresAt > new Date()) {
    //             return existing.guestId;
    //         }
    //     }

    //     // Create a fresh guest session + cart atomically
    //     const newGuestId = uuidv4();
    //     const expiresAt = new Date();
    //     expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_TTL_DAYS);

    //     await this.prisma.$transaction(async (tx) => {
    //         const session = await tx.guestSession.create({
    //             data: { guestId: newGuestId, expiresAt },
    //         });
    //         await tx.cart.create({ data: { guestSessionId: session.id } });
    //     });

    //     return newGuestId;
    // }

    /**
     * Prunes expired guest sessions and their associated carts.
     * Call from a @Cron scheduler in a dedicated task module.
     */
    // async pruneExpiredGuestSessions(): Promise<number> {
    //     const result = await this.prisma.guestSession.deleteMany({
    //         where: { expiresAt: { lt: new Date() } },
    //     });
    //     return result.count;
    // }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async assertEmailAvailable(
        email: string,
        excludeProfileId?: string,
    ): Promise<void> {
        const existing = await this.findByEmail(email);

        if (existing && existing.id !== excludeProfileId) {
            throw new ConflictException('An account with this email already exists.');
        }
    }

    toPublic(profile: Profile): AuthenticatedUser {
        return {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            firstName: profile.firstName,
            lastName: profile.lastName,
        };
    }
}
