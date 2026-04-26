import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. No token? Let them through as a guest.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true; 
    }

    // 2. Token exists? Validate it and attach the user to the request.
    try {
      const token = authHeader.substring(7);
      const user = await this.authService.validateToken(token);
      request.user = user;
    } catch (e) {
      // If the token is expired/invalid, we still let them through, 
      // but they are treated as a guest (request.user remains undefined).
    }

    return true;
  }
}