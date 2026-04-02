import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
}

export interface GuestSession {
  guestId: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export interface RequestWithGuest extends Request {
  session: Request['session'] & {
    guestId?: string;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}