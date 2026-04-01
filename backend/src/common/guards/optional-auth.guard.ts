import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Silently attaches req.user if the session is authenticated.
 * Does NOT throw if the request is unauthenticated — used on public
 * routes that behave differently for guests vs logged-in customers
 * (e.g. cart, product pages).
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('session') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest<TUser>(_err: any, user: TUser): TUser {
    // Return user if authenticated, otherwise return null (no throw)
    return user ?? null;
  }

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}