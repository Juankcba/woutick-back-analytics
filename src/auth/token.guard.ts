import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

const API_TOKEN = process.env.API_TOKEN || 'wk_analytics_s3cr3t_t0k3n_2026';

/**
 * Simple Bearer token guard. The token is hardcoded/env-based.
 *
 * Usage: add @UseGuards(TokenGuard) to controllers or set it globally.
 * Frontend sends: Authorization: Bearer <token>
 */
@Injectable()
export class TokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7); // Remove 'Bearer '

    if (token !== API_TOKEN) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
