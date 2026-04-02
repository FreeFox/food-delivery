// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService, CreateUserDto } from '../profiles/profiles.service';
import { AuthenticatedUser, JwtPayload, TokenPair } from '../common/types';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const REFRESH_TOKEN_TTL_DAYS = 7;
const BCRYPT_ROUNDS = 10; // lower than password hash — refresh tokens are UUIDs

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Storefront: Customer registration ───────────────────────────────────

  /**
   * Registers a new Customer, optionally migrating a guest cart.
   * Returns the created user ready to be serialized into the session.
   */
  async register(
    dto: CreateUserDto,
    guestId?: string,
  ): Promise<AuthenticatedUser> {
    const profile = await this.profilesService.createCustomer(dto);

    if (guestId) {
      await this.migrateGuestCart(guestId, profile.id);
    }

    return profile;
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
      await this.migrateGuestCart(guestId, user.id);
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

  // ─── Admin: token refresh ─────────────────────────────────────────────────

  /**
   * Validates a refresh token, rotates it (old one deleted), and
   * issues a fresh token pair — implements refresh token rotation.
   */
  async refreshAdminTokens(rawRefreshToken: string): Promise<TokenPair> {
    // Hash the incoming token and look it up
    const tokenHash = await bcrypt.hash(rawRefreshToken, BCRYPT_ROUNDS);

    // We must search by comparing hashes — find candidates via profileId
    // stored in the token itself (avoids a full table scan).
    // Here we verify by iterating valid tokens; in production you may
    // prefer a deterministic hash (e.g. SHA-256) for direct lookup.
    const record = await this.findRefreshToken(rawRefreshToken);

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const profile = await this.profilesService.findPublicById(record.profileId);

    // Rotate: delete old, create new
    await this.prisma.refreshToken.delete({ where: { id: record.id } });
    return this.issueAdminTokens(profile);
  }

  // ─── Admin: logout (revoke refresh token) ────────────────────────────────

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const record = await this.findRefreshToken(rawRefreshToken);
    if (record) {
      await this.prisma.refreshToken.delete({ where: { id: record.id } });
    }
  }

  /**
   * Revokes ALL refresh tokens for a user (e.g. "logout all devices").
   */
  async revokeAllRefreshTokens(profileId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { profileId } });
  }

  // ─── Cart migration ───────────────────────────────────────────────────────

  /**
   * Merges a guest cart into the authenticated customer's cart inside a
   * single DB transaction. Duplicate SKUs have their quantities combined;
   * new items are moved over; the guest cart is deleted afterward.
   */
  async migrateGuestCart(guestId: string, profileId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Locate the guest session and its cart
      const guestSession = await tx.guestSession.findUnique({
        where: { guestId },
        include: { cart: { include: { items: true } } },
      });

      if (!guestSession?.cart || guestSession.cart.items.length === 0) {
        return; // Nothing to migrate
      }

      // Ensure the customer has a cart (created on registration if missing)
      let customerCart = await tx.cart.findUnique({ where: { profileId } });
      if (!customerCart) {
        customerCart = await tx.cart.create({ data: { profileId } });
      }

      // Merge items
      for (const guestItem of guestSession.cart.items) {
        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: customerCart.id,
              productId: guestItem.productId,
            },
          },
        });

        if (existingItem) {
          // Combine quantities — keep the customer's stored price
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + guestItem.quantity },
          });
        } else {
          // Move the item to the customer's cart
          await tx.cartItem.create({
            data: {
              cartId: customerCart.id,
              productId: guestItem.productId,
              quantity: guestItem.quantity,
              price: guestItem.price,
            },
          });
        }
      }

      // Clean up the guest cart and session
      await tx.cart.delete({ where: { id: guestSession.cart.id } });
      await tx.guestSession.delete({ where: { id: guestSession.id } });
    });
  }

  // ─── Guest session ────────────────────────────────────────────────────────

  async ensureGuestSession(existingGuestId?: string): Promise<string> {
    return this.profilesService.ensureGuestSession(existingGuestId);
  }

  // ─── Password reset ───────────────────────────────────────────────────────

  /**
   * Generates a short-lived signed JWT to be embedded in a reset link.
   * The token payload carries only the profileId and a 'purpose' claim to
   * prevent the reset token from being used as an access token.
   */
  async createPasswordResetToken(email: string): Promise<string> {
    const profile = await this.profilesService.findByEmail(email);

    // Silently succeed even if email not found — avoids user enumeration
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

  /**
   * Finds a RefreshToken record by comparing the raw token against stored
   * hashes for all non-expired records. In high-traffic scenarios, replace
   * bcrypt with a deterministic HMAC-SHA256 for O(1) lookup.
   */
  private async findRefreshToken(rawToken: string) {
    const candidates = await this.prisma.refreshToken.findMany({
      where: { expiresAt: { gte: new Date() } },
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawToken, candidate.tokenHash);
      if (match) return candidate;
    }

    return null;
  }
}