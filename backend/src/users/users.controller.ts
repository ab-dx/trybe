import { Controller, Get, Patch, Body, Req, UseGuards, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { Rsvp } from '../rsvp/entities/rsvp.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Rsvp)
    private rsvpRepository: Repository<Rsvp>,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.id);
    const rsvps = await this.rsvpRepository.find({
      where: { userId: req.user.id },
      relations: ['activity'],
    });
    return {
      ...user,
      activitiesHosted: rsvps.filter((r: any) => r.activity?.hostId === req.user.id).length,
      activitiesJoined: rsvps.length,
      checkIns: rsvps.filter((r: any) => r.checkedIn).length,
    };
  }

  @Get('me/rsvps')
  @UseGuards(AuthGuard)
  async getMyRsvps(@Req() req: AuthenticatedRequest) {
    return this.rsvpRepository.find({
      where: { userId: req.user.id },
      relations: ['activity', 'activity.host'],
    });
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() data: { displayName?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, data);
  }
}