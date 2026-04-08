import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/profile.dto';
import { AuthenticatedUser } from '@/common/types';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const GUEST_SESSION_TTL_DAYS = 30;


@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) {}

    async createCustomer(dto: CreateUserDto): Promise<AuthenticatedUser> {
        // await this.assertEmailAvailable(dto.email);

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        const profile = await this.prisma.profile.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: Role.CUSTOMER,
                id: "test",
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
        });

        // return this.toPublic(profile);
        return {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            firstName: profile.firstName,
            lastName: profile.lastName,
        };
    }
}
