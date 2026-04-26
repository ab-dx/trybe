import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity]),
    UsersModule,
    forwardRef(() => AuthModule),
    FriendsModule,
  ],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}