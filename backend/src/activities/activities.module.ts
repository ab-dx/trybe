import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Rsvp } from '../rsvp/entities/rsvp.entity';
import { ActivityHype } from '../activity-hype/entities/activity-hype.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { FriendsModule } from '../friends/friends.module';
import { ActivityHypeModule } from '../activity-hype/activity-hype.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, Rsvp, ActivityHype]),
    UsersModule,
    forwardRef(() => AuthModule),
    FriendsModule,
    forwardRef(() => ActivityHypeModule),
  ],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}