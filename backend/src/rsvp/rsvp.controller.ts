import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('activities/:activityId/rsvp')
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Post()
  @UseGuards(AuthGuard)
  async rsvp(
    @Param('activityId') activityId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rsvpService.rsvp(activityId, req.user.id);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async cancelRsvp(
    @Param('activityId') activityId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.rsvpService.cancelRsvp(activityId, req.user.id);
    return { cancelled: true };
  }

  @Get()
  async getRsvps(@Param('activityId') activityId: string) {
    return this.rsvpService.getRsvpsForActivity(activityId);
  }

  @Post('checkin')
  @UseGuards(AuthGuard)
  async checkIn(
    @Param('activityId') activityId: string,
    @Req() req: AuthenticatedRequest,
    @Body() data: { latitude: number; longitude: number },
  ) {
    return this.rsvpService.checkIn(
      activityId,
      req.user.id,
      data.latitude,
      data.longitude,
    );
  }
}