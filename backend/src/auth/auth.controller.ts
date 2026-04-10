import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; firebaseUid: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  @UseGuards(AuthGuard)
  async validate(@Req() req: AuthenticatedRequest) {
    return { valid: true, userId: req.user.id };
  }
}