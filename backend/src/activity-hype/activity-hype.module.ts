import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityHype } from './entities/activity-hype.entity';
import { ActivityHypeService } from './activity-hype.service';
import { ActivityHypeController } from './activity-hype.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityHype]),
    AuthModule,
  ],
  providers: [ActivityHypeService],
  controllers: [ActivityHypeController],
  exports: [ActivityHypeService],
})
export class ActivityHypeModule {}