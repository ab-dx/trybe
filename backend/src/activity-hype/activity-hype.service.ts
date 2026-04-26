import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityHype } from './entities/activity-hype.entity';

@Injectable()
export class ActivityHypeService {
  constructor(
    @InjectRepository(ActivityHype)
    private activityHypeRepository: Repository<ActivityHype>,
  ) {}

  async hype(activityId: string, userId: string): Promise<ActivityHype> {
    const existing = await this.activityHypeRepository.findOne({
      where: { activityId, userId },
    });

    if (existing) {
      return existing;
    }

    const hype = this.activityHypeRepository.create({ activityId, userId });
    return this.activityHypeRepository.save(hype);
  }

  async unhype(activityId: string, userId: string): Promise<void> {
    const result = await this.activityHypeRepository.delete({ activityId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Hype not found');
    }
  }

  async getUserHypeStatus(activityId: string, userId: string): Promise<boolean> {
    const hype = await this.activityHypeRepository.findOne({
      where: { activityId, userId },
    });
    return !!hype;
  }

  async getUserHypeStatusMany(activityIds: string[], userId: string): Promise<Map<string, boolean>> {
    const hypes = await this.activityHypeRepository.find({
      where: { userId },
    });

    const statusMap = new Map<string, boolean>();
    for (const activityId of activityIds) {
      statusMap.set(activityId, false);
    }
    for (const hype of hypes) {
      if (activityIds.includes(hype.activityId)) {
        statusMap.set(hype.activityId, true);
      }
    }
    return statusMap;
  }

  async getHypeCount(activityId: string): Promise<number> {
    const count = await this.activityHypeRepository.count({ where: { activityId } });
    return count;
  }
}