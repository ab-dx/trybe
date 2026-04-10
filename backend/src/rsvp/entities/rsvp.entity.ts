import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  CreateDateColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('rsvps')
export class Rsvp {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  activityId: string;

  @ManyToOne(() => User, (user) => user.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Activity, (activity) => activity.rsvps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ default: false })
  checkedIn: boolean;

  @CreateDateColumn()
  createdAt: Date;
}