import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects routes that require a logged-in Customer.
 * Uses the Passport 'local' session strategy.
 */
@Injectable()
export class SessionAuthGuard extends AuthGuard('session') {
  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Please log in to continue.');
    }
    return user;
  }

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
