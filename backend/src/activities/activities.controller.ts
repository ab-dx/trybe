import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req,
  ForbiddenException 
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';
import { Visibility } from './entities/activity.entity';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(
    @Query('minLat') minLat?: string,
    @Query('maxLat') maxLat?: string,
    @Query('minLng') minLng?: string,
    @Query('maxLng') maxLng?: string,
  ) {
    if (minLat && maxLat && minLng && maxLng) {
      return this.activitiesService.findInBounds(
        parseFloat(minLat),
        parseFloat(maxLat),
        parseFloat(minLng),
        parseFloat(maxLng),
      );
    }
    return this.activitiesService.findUpcoming();
  }

  @Get('live')
  async getLiveActivities() {
    return this.activitiesService.findLive();
  }

  @Get(':id')
  async getActivity(@Param('id') id: string) {
    return this.activitiesService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createActivity(
    @Req() req: AuthenticatedRequest,
    @Body() data: {
      title: string;
      description?: string;
      latitude: number;
      longitude: number;
      startTime: string;
      endTime?: string;
      visibility?: Visibility;
    },
  ) {
    return this.activitiesService.create(
      {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      req.user.id,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateActivity(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() data: {
      title?: string;
      description?: string;
      latitude?: number;
      longitude?: number;
      startTime?: string;
      endTime?: string;
      visibility?: Visibility;
      status?: string;
    },
  ) {
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    return this.activitiesService.update(id, updateData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteActivity(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.activitiesService.delete(id, req.user.id);
    return { deleted: true };
  }
}