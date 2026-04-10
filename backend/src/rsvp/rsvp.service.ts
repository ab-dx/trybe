import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rsvp } from './entities/rsvp.entity';
import { Activity, ActivityStatus } from '../activities/entities/activity.entity';
import { User } from '../users/entities/user.entity';

const CHECK_IN_THRESHOLD_METERS = 100;

@Injectable()
export class RsvpService {
  constructor(
    @InjectRepository(Rsvp)
    private rsvpRepository: Repository<Rsvp>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async rsvp(activityId: string, userId: string): Promise<Rsvp> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    const existing = await this.rsvpRepository.findOne({
      where: { activityId, userId },
    });

    if (existing) {
      return existing;
    }

    const rsvp = this.rsvpRepository.create({
      activityId,
      userId,
      checkedIn: false,
    });

    return this.rsvpRepository.save(rsvp);
  }

  async cancelRsvp(activityId: string, userId: string): Promise<void> {
    const result = await this.rsvpRepository.delete({ activityId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('RSVP not found');
    }
  }

  async getRsvpsForActivity(activityId: string): Promise<Rsvp[]> {
    return this.rsvpRepository.find({
      where: { activityId },
      relations: ['user'],
    });
  }

  async getUserRsvps(userId: string): Promise<Rsvp[]> {
    return this.rsvpRepository.find({
      where: { userId },
      relations: ['activity'],
    });
  }

  async getUserRsvpsFull(userId: string): Promise<Rsvp[]> {
    return this.rsvpRepository.find({
      where: { userId },
      relations: ['activity', 'activity.host'],
    });
  }

  async checkIn(
    activityId: string,
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<{ success: boolean; distance?: number }> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    if (activity.status !== ActivityStatus.LIVE) {
      throw new BadRequestException('Activity is not live for check-in');
    }

    const rsvp = await this.rsvpRepository.findOne({
      where: { activityId, userId },
    });

    if (!rsvp) {
      throw new NotFoundException('You have not RSVP\'d to this activity');
    }

    if (rsvp.checkedIn) {
      throw new BadRequestException('Already checked in');
    }

    const result = await this.rsvpRepository
      .createQueryBuilder('rsvp')
      .innerJoin('rsvp.activity', 'activity')
      .where('rsvp.activityId = :activityId', { activityId })
      .andWhere('rsvp.userId = :userId', { userId })
      .andWhere(
        'ST_DWithin(activity.location::geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geometry, :threshold)',
      )
      .setParameters({
        lng: longitude,
        lat: latitude,
        threshold: CHECK_IN_THRESHOLD_METERS / 111320,
      })
      .getOne();

    if (result) {
      await this.rsvpRepository.update({ activityId, userId }, { checkedIn: true });
      await this.userRepository.increment({ id: userId }, 'trustScore', 5);
      return { success: true, distance: 0 };
    }

    const distanceResult = await this.rsvpRepository.query(
      `SELECT ST_Distance(activity.location::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geometry) as distance 
       FROM activities activity WHERE activity.id = $3`,
      [longitude, latitude, activityId],
    );

    const distance = distanceResult[0]?.distance ? distanceResult[0].distance * 111320 : null;

    return { success: false, distance: distance ? Math.round(distance) : undefined };
  }
}