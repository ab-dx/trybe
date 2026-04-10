import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityStatus, Visibility } from './entities/activity.entity';
import { UsersService } from '../users/users.service';

export interface CreateActivityDto {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  startTime: Date;
  endTime?: Date;
  visibility?: Visibility;
}

export interface UpdateActivityDto {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  startTime?: Date;
  endTime?: Date;
  visibility?: Visibility;
  status?: ActivityStatus;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateActivityDto, hostId: string): Promise<Activity> {
    const host = await this.usersService.findById(hostId);
    if (!host) throw new NotFoundException('Host not found');

    const activity = this.activitiesRepository.create({
      hostId,
      title: dto.title,
      description: dto.description,
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude], 
      },
      startTime: dto.startTime,
      endTime: dto.endTime,
      visibility: dto.visibility || Visibility.PUBLIC,
      status: ActivityStatus.UPCOMING,
    });

    return this.activitiesRepository.save(activity);
  }

  async findById(id: string): Promise<Activity> {
    const activity = await this.activitiesRepository.findOne({
      where: { id },
      relations: ['host'],
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async findInBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
  ): Promise<Activity[]> {
    return this.activitiesRepository
      .createQueryBuilder('activity')
      .where('ST_Contains(ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat), activity.location::geometry)')
      .setParameters({ minLat, maxLat, minLng, maxLng })
      .andWhere('activity.status != :status', { status: ActivityStatus.CANCELLED })
      .andWhere('activity.visibility = :visibility', { visibility: Visibility.PUBLIC })
      .leftJoinAndSelect('activity.host', 'host')
      .orderBy('activity.startTime', 'ASC')
      .getMany();
  }

  async findUpcoming(userId?: string): Promise<Activity[]> {
    const query = this.activitiesRepository
      .createQueryBuilder('activity')
      .where('activity.startTime > :now', { now: new Date() })
      .andWhere('activity.status != :status', { status: ActivityStatus.CANCELLED })
      .leftJoinAndSelect('activity.host', 'host')
      .orderBy('activity.startTime', 'ASC')
      .take(50);

    if (userId) {
      query.andWhere('activity.hostId = :userId', { userId });
    }

    return query.getMany();
  }

  async findLive(): Promise<Activity[]> {
    return this.activitiesRepository
      .createQueryBuilder('activity')
      .where('activity.status = :status', { status: ActivityStatus.LIVE })
      .leftJoinAndSelect('activity.host', 'host')
      .getMany();
  }

  async update(id: string, dto: UpdateActivityDto, userId: string): Promise<Activity> {
    const activity = await this.findById(id);
    
    if (activity.hostId !== userId) {
      throw new UnauthorizedException('Not the host of this activity');
    }

    // Safely apply standard fields
    if (dto.title) activity.title = dto.title;
    if (dto.description) activity.description = dto.description;
    if (dto.startTime) activity.startTime = dto.startTime;
    if (dto.endTime) activity.endTime = dto.endTime;
    if (dto.visibility) activity.visibility = dto.visibility;
    if (dto.status) activity.status = dto.status;

    // Handle coordinate updates by reconstructing the GeoJSON Point
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      activity.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    return this.activitiesRepository.save(activity);

  }

  async delete(id: string, userId: string): Promise<void> {
    const activity = await this.findById(id);
    
    if (activity.hostId !== userId) {
      throw new UnauthorizedException('Not the host of this activity');
    }

    await this.activitiesRepository.remove(activity);
  }

  async setStatus(id: string, status: ActivityStatus): Promise<Activity> {
    const activity = await this.findById(id);
    activity.status = status;
    return this.activitiesRepository.save(activity);
  }
}
