import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activity_hypes')
@Unique(['activityId', 'userId'])
export class ActivityHype {
  @PrimaryColumn('uuid', { name: 'activityId' })
  activityId: string;

  @PrimaryColumn('uuid', { name: 'userId' })
  userId: string;

  @ManyToOne(() => Activity, (activity) => activity.hypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}