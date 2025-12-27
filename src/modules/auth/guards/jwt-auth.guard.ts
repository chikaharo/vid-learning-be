import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(
    err: unknown,
    user: unknown,
    info: unknown,
    context: ExecutionContext,
  ) {
    // Let the base class handle standard errors; customize hook if needed later
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return super.handleRequest(err, user, info, context);
  }
}
