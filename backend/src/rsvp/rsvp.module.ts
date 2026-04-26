import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rsvp } from './entities/rsvp.entity';
import { RsvpService } from './rsvp.service';
import { RsvpController } from './rsvp.controller';
import { Activity } from '../activities/entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rsvp, Activity, User]), forwardRef(() => AuthModule), UsersModule],
  providers: [RsvpService],
  controllers: [RsvpController],
  exports: [RsvpService],
})
export class RsvpModule {}