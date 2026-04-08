import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/profile.dto';
import { AuthenticatedUser } from '@/common/types';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Profile, Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const GUEST_SESSION_TTL_DAYS = 30;


@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) {}

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

        if (!profile){
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
