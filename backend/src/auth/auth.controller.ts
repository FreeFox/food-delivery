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
// import { ProfilesService } from '../profiles/profiles.service';
// import { SessionAuthGuard } from '../common/guards/session-auth.guard';
// import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../common/guards/roles.guard';
// import { CurrentUser } from '../common/decorators/current-user.decorator';
// import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types';
import { Role } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  // RefreshTokenDto,
  // ForgotPasswordDto,
  // ResetPasswordDto,
  // ChangePasswordDto,
} from './dto/auth.dto';

const API_VERSION = 'v1';

@Controller(`api/${API_VERSION}/auth`)
export class AuthController {constructor(
    private readonly authService: AuthService,
    // private readonly profilesService: ProfilesService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Session() session?: Record<string, unknown>,
  ) {
    const guestId = session?.guestId as string | undefined;

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
    // await new Promise<void>((resolve, reject) => {
    //   req.login(profile, (err) => (err ? reject(err) : resolve()));
    // });

    delete session?.guestId;

    return {
      message: 'Account created successfully.',
      user: this.sanitize(profile),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Augment AuthController with the private sanitize helper
// ─────────────────────────────────────────────────────────────────────────────
declare module './auth.controller' {
  interface AuthController {
    sanitize(user: AuthenticatedUser): {
      id: string;
      email: string;
      firstName: string | null | undefined;
      lastName: string | null | undefined;
      role: Role;
    };
  }
}

AuthController.prototype.sanitize = function (user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
};