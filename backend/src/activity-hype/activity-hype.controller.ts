import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ActivityHypeService } from './activity-hype.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('activities')
export class ActivityHypeController {
  constructor(private readonly activityHypeService: ActivityHypeService) {}

  @Post(':id/hype')
  @UseGuards(AuthGuard)
  async hypeActivity(
    @Param('id') activityId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.activityHypeService.hype(activityId, req.user.id);
    return { hyped: true };
  }

  @Delete(':id/hype')
  @UseGuards(AuthGuard)
  async unhypeActivity(
    @Param('id') activityId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.activityHypeService.unhype(activityId, req.user.id);
    return { hyped: false };
  }

  @Get(':id/hype')
  @UseGuards(AuthGuard)
  async getHypeStatus(
    @Param('id') activityId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isHyped = await this.activityHypeService.getUserHypeStatus(activityId, req.user.id);
    return { isHyped };
  }
}