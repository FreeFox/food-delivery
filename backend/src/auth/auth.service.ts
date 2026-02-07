import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private users: UsersService) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new HttpException('User exists', HttpStatus.CONFLICT);
    const id = `user_${randomBytes(6).toString('hex')}`;
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.users.create(id, email, hashed);
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    return { user, token };
  }
}
