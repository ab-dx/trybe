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

  @ManyToOne(() => User, (user) => user.rsvps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Activity, (activity) => activity.rsvps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column({ default: false })
  checkedIn: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
