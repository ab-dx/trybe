import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity, ActivityStatus, Visibility } from './entities/activity.entity';
import { UsersService } from '../users/users.service';
import { ENDED_ACTIVITY_STATUSES } from './activity.utils';
import { FriendsService } from '../friends/friends.service';

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
    @Inject(forwardRef(() => FriendsService))
    private friendsService: FriendsService,
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
    friendsOnly: boolean = false,
    userId?: string,
  ): Promise<Activity[]> {
    const now = new Date();

    const query = this.activitiesRepository
      .createQueryBuilder('activity')
      .where('ST_Contains(ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326), activity.location::geometry)')
      .setParameters({ minLat, maxLat, minLng, maxLng })
      .andWhere('activity.status NOT IN (:...endedStatuses)', {
        endedStatuses: ENDED_ACTIVITY_STATUSES,
      })
      .andWhere('(activity.endTime IS NULL OR activity.endTime > :now)', { now })
      .leftJoinAndSelect('activity.host', 'host')
      .orderBy('activity.startTime', 'ASC');

    if (friendsOnly && userId) {
      const friendIds = await this.friendsService.getFriendIdsList(userId);
      if (friendIds.length === 0) {
        return [];
      }
      query.andWhere('activity.hostId IN (:...friendIds)', { friendIds });
    } else {
      query.andWhere('activity.visibility = :visibility', { visibility: Visibility.PUBLIC });
    }

    return query.getMany();
  }

  async findUpcoming(userId?: string, friendsOnly: boolean = false): Promise<Activity[]> {
    const now = new Date();

    const query = this.activitiesRepository
      .createQueryBuilder('activity')
      .where('activity.status NOT IN (:...endedStatuses)', {
        endedStatuses: ENDED_ACTIVITY_STATUSES,
      })
      .andWhere('(activity.endTime IS NULL OR activity.endTime > :now)', { now })
      .leftJoinAndSelect('activity.host', 'host')
      .orderBy('activity.startTime', 'ASC')
      .take(50);

    if (friendsOnly && userId) {
      const friendIds = await this.friendsService.getFriendIdsList(userId);
      if (friendIds.length === 0) {
        return [];
      }
      query.andWhere('activity.hostId IN (:...friendIds)', { friendIds });
    } else {
      query.andWhere('activity.visibility = :visibility', { visibility: Visibility.PUBLIC });
    }

    return query.getMany();
  }

  async findLive(): Promise<Activity[]> {
    const now = new Date();

    return this.activitiesRepository
      .createQueryBuilder('activity')
      .where('activity.status = :status', { status: ActivityStatus.LIVE })
      .andWhere('(activity.endTime IS NULL OR activity.endTime > :now)', { now })
      .leftJoinAndSelect('activity.host', 'host')
      .getMany();
  }

  async update(id: string, dto: UpdateActivityDto, userId: string): Promise<Activity> {
    const activity = await this.findById(id);
    
    if (activity.hostId !== userId) {
      throw new UnauthorizedException('Not the host of this activity');
    }

    if (
      dto.status !== undefined &&
      !Object.values(ActivityStatus).includes(dto.status)
    ) {
      throw new BadRequestException('Invalid activity status');
    }

    if (dto.title !== undefined) activity.title = dto.title;
    if (dto.description !== undefined) activity.description = dto.description;
    if (dto.startTime !== undefined) activity.startTime = dto.startTime;
    if (dto.endTime !== undefined) activity.endTime = dto.endTime;
    if (dto.visibility !== undefined) activity.visibility = dto.visibility;

    if (dto.status !== undefined) {
      activity.status = dto.status;

      if (
        dto.status === ActivityStatus.COMPLETED &&
        (!activity.endTime || new Date(activity.endTime) > new Date())
      ) {
        activity.endTime = new Date();
      }
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      activity.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    return this.activitiesRepository.save(activity);
  }

  async endActivity(id: string, userId: string): Promise<Activity> {
    const activity = await this.findById(id);

    if (activity.hostId !== userId) {
      throw new UnauthorizedException('Not the host of this activity');
    }

    activity.status = ActivityStatus.COMPLETED;
    activity.endTime = new Date();

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
