import { Activity, ActivityStatus } from './entities/activity.entity';

export const ENDED_ACTIVITY_STATUSES: ActivityStatus[] = [
  ActivityStatus.COMPLETED,
  ActivityStatus.CANCELLED,
];

export function isActivityPast(
  activity: Pick<Activity, 'status' | 'endTime'>,
  now = new Date(),
): boolean {
  if (ENDED_ACTIVITY_STATUSES.includes(activity.status)) {
    return true;
  }

  if (!activity.endTime) {
    return false;
  }

  const endTime = new Date(activity.endTime);

  if (Number.isNaN(endTime.getTime())) {
    return false;
  }

  return endTime.getTime() <= now.getTime();
}
