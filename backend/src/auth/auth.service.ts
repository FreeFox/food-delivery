import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const [existingUsers] = await this.db.execute<{ id: string }[]>(
      'SELECT id FROM users WHERE email = ?',
      [email],
    );
    if (existingUsers.length > 0) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Math.random().toString(36).slice(2, 9);

    await this.db.execute(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [userId, email, hashedPassword],
    );

    const token = this.jwt.sign({ userId, email });
    return { userId, email, token };
  }

  async login(email: string, password: string) {
    const [users] = await this.db.execute<{ id: string; password: string }>(
      'SELECT id, password FROM users WHERE email = ?',
      [email],
    );
    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({ userId: user.id, email });
    return { userId: user.id, email, token };
  }
}
