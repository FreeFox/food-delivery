import { Role } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}