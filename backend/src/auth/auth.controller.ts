import { Body, Controller, Post, Res, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    try {
      const { user, token } = await this.auth.register(body.email, body.password);
      res.cookie('token', token, { httpOnly: true });
      return { success: true, data: user, error: null };
    } catch (e: any) {
      throw new HttpException({ success: false, data: null, error: e.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const { user, token } = await this.auth.login(body.email, body.password);
      res.cookie('token', token, { httpOnly: true });
      return { success: true, data: user, error: null };
    } catch (e: any) {
      throw new HttpException({ success: false, data: null, error: e.message }, HttpStatus.UNAUTHORIZED);
    }
  }
}
import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }, @Res() res) {
    try {
      const { user, token } = await this.auth.register(body.email, body.password);
      res.cookie('token', token, { httpOnly: true });
      return res.status(201).json({ success: true, data: { user, token }, error: null });
    } catch (err) {
      return res.status(400).json({ success: false, data: null, error: err.message });
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res() res) {
    try {
      const { user, token } = await this.auth.login(body.email, body.password);
      res.cookie('token', token, { httpOnly: true });
      return res.json({ success: true, data: { user, token }, error: null });
    } catch (err) {
      return res.status(401).json({ success: false, data: null, error: err.message });
    }
  }
}
