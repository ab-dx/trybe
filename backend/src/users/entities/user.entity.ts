import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';
import { Rsvp } from '../../rsvp/entities/rsvp.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  firebaseUid: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: 100 })
  trustScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Activity, (activity) => activity.host)
  hostedActivities: Activity[];

  @OneToMany(() => Rsvp, (rsvp) => rsvp.user)
  rsvps: Rsvp[];
}
