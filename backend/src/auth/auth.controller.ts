// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Session,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types';
import { Role } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

// ─────────────────────────────────────────────────────────────────────────────
// Storefront Auth  (/auth/*)
// ─────────────────────────────────────────────────────────────────────────────

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /auth/register
   *
   * Creates a new Customer account. If a guestId session cookie is present
   * the guest cart is migrated to the new account before responding.
   * The newly created user is immediately serialized into the session so
   * the customer lands on the site already logged in.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Session() session: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const guestId = session.guestId as string | undefined;

    const profile = await this.authService.register(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      guestId,
    );

    // Log the user in by populating req.user and regenerating the session
    await new Promise<void>((resolve, reject) => {
      req.login(user, (err) => (err ? reject(err) : resolve()));
    });

    // Clear the now-migrated guestId from the session
    delete session.guestId;

    return {
      message: 'Account created successfully.',
      user: this.sanitize(user),
    };
  }

  /**
   * POST /auth/login
   *
   * Passport's LocalStrategy validates credentials before this handler runs.
   * On success the user is already attached to req.user by Passport.
   * We then handle cart migration and return the user payload.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  async login(
    @CurrentUser() user: AuthenticatedUser,
    @Session() session: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const guestId = session.guestId as string | undefined;

    await this.authService.onCustomerLogin(user, guestId);

    // Regenerate session ID to prevent session fixation
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    // Re-attach user after regeneration (regenerate clears session data)
    await new Promise<void>((resolve, reject) => {
      req.login(user, (err) => (err ? reject(err) : resolve()));
    });

    return {
      message: 'Logged in successfully.',
      user: this.sanitize(user),
    };
  }

  /**
   * POST /auth/logout
   *
   * Destroys the session and clears the session cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });

    res.clearCookie('connect.sid');

    return { message: 'Logged out successfully.' };
  }

  /**
   * GET /auth/me
   *
   * Returns the currently authenticated customer profile.
   */
  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user: this.sanitize(user) };
  }

  /**
   * POST /auth/change-password
   *
   * Authenticated customers can update their password by supplying their
   * current password for verification.
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password updated successfully.' };
  }

  /**
   * POST /auth/forgot-password
   *
   * Generates a password reset token and (in a real app) dispatches an email.
   * Always returns 200 to prevent email enumeration.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const token = await this.authService.createPasswordResetToken(dto.email);

    // TODO: inject a MailService and send the token in a reset link
    // await this.mailService.sendPasswordReset(dto.email, token);

    // We log it here for development convenience — remove in production
    if (token) console.debug('[DEV] Reset token:', token);

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  /**
   * POST /auth/reset-password
   *
   * Validates the signed reset token and applies the new password.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successfully. You may now log in.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Auth  (/admin/auth/*)
// ─────────────────────────────────────────────────────────────────────────────

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /admin/auth/login
   *
   * AdminLocalStrategy validates credentials AND asserts role = ADMIN before
   * this handler runs. On success we issue a JWT access + refresh token pair.
   * No session is created for admin users.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('admin-local'))
  async login(@CurrentUser() user: AuthenticatedUser) {
    const tokens = await this.authService.issueAdminTokens(user);
    return {
      message: 'Admin login successful.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  /**
   * POST /admin/auth/refresh
   *
   * Accepts the refresh token in the request body, validates it, rotates it,
   * and returns a new token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshAdminTokens(dto.refreshToken);
    return tokens;
  }

  /**
   * POST /admin/auth/logout
   *
   * Revokes the refresh token so it cannot be used to obtain new access tokens.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
  ) {
    if (dto.refreshToken) {
      await this.authService.revokeRefreshToken(dto.refreshToken);
    } else {
      // Nuclear option: revoke all sessions for this admin
      await this.authService.revokeAllRefreshTokens(user.id);
    }
    return { message: 'Admin logged out successfully.' };
  }

  /**
   * GET /admin/auth/me
   *
   * Returns the currently authenticated admin's profile, validated via JWT.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private sanitize(user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Augment AuthController with the private sanitize helper
// ─────────────────────────────────────────────────────────────────────────────
declare module './auth.controller' {}
AuthController.prototype['sanitize'] = function (user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
};