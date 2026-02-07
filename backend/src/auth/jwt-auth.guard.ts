import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return false;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev');
      req.user = decoded;
      return true;
    } catch (e) {
      return false;
    }
  }
}
