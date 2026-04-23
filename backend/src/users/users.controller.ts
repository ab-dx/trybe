import { Controller, Get, NotFoundException, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { Rsvp } from '../rsvp/entities/rsvp.entity';
import { Activity } from '../activities/entities/activity.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';
import { isActivityPast } from '../activities/activity.utils';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Rsvp)
    private rsvpRepository: Repository<Rsvp>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: AuthenticatedRequest) {
    const [user, allRsvps, hostedActivities] = await Promise.all([
      this.usersService.findById(req.user.id),
      this.rsvpRepository.find({
        where: { userId: req.user.id },
        relations: ['activity', 'activity.host'],
      }),
      this.activityRepository.find({
        where: { hostId: req.user.id },
        relations: ['host'],
        order: { startTime: 'DESC' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const rsvps = allRsvps.filter(
      (rsvp) => rsvp.activity && rsvp.activity.hostId !== req.user.id,
    );
    const upcomingActivities = rsvps
      .filter((rsvp) => rsvp.activity && !isActivityPast(rsvp.activity, now))
      .map((rsvp) => rsvp.activity);

    const pastActivitiesMap = new Map<string, Activity>();

    for (const activity of hostedActivities) {
      if (isActivityPast(activity, now)) {
        pastActivitiesMap.set(activity.id, activity);
      }
    }

    for (const rsvp of rsvps) {
      if (rsvp.activity && isActivityPast(rsvp.activity, now)) {
        pastActivitiesMap.set(rsvp.activity.id, rsvp.activity);
      }
    }

    const pastActivities = [...pastActivitiesMap.values()].sort((left, right) => {
      return (
        new Date(right.startTime).getTime() - new Date(left.startTime).getTime()
      );
    });

    return {
      ...user,
      activitiesHosted: hostedActivities.length,
      activitiesJoined: rsvps.length,
      checkIns: rsvps.filter((rsvp) => rsvp.checkedIn).length,
      upcomingActivities,
      hostedActivities,
      pastActivities,
    };
  }

  @Get('me/rsvps')
  @UseGuards(AuthGuard)
  async getMyRsvps(@Req() req: AuthenticatedRequest) {
    const rsvps = await this.rsvpRepository.find({
      where: { userId: req.user.id },
      relations: ['activity', 'activity.host'],
    });

    return rsvps.filter(
      (rsvp) => rsvp.activity && rsvp.activity.hostId !== req.user.id,
    );
  }

  @Get('me/hosted')
  @UseGuards(AuthGuard)
  async getMyHosted(@Req() req: AuthenticatedRequest) {
    return this.activityRepository.find({
      where: { hostId: req.user.id },
      relations: ['host'],
      order: { startTime: 'DESC' },
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
