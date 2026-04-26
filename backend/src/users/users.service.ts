import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface TrustBadge {
  emoji: string;
  label: string;
}

export function getTrustBadge(trustScore: number): TrustBadge {
  if (trustScore >= 76) return { emoji: '⭐', label: 'Veteran' };
  if (trustScore >= 51) return { emoji: '🟢', label: 'Trusted' };
  if (trustScore >= 26) return { emoji: '🟡', label: 'Regular' };
  return { emoji: '🔴', label: 'New' };
}

const MIN_TRUST = 0;
const MAX_TRUST = 100;

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.usersRepository.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  async findOrCreate(firebaseUid: string, profile?: { displayName?: string; email?: string; avatarUrl?: string }): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { firebaseUid } });

    if (!user) {
      const newUser = new User();
      newUser.firebaseUid = firebaseUid;
      newUser.displayName = profile?.displayName || profile?.email?.split('@')[0] || '';
      newUser.email = profile?.email || '';
      newUser.avatarUrl = profile?.avatarUrl || '';
      newUser.trustScore = 50;
      await this.usersRepository.save(newUser);
      user = newUser;
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { firebaseUid } });
  }

  async updateProfile(id: string, data: { displayName?: string; avatarUrl?: string }): Promise<User> {
    await this.usersRepository.update(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateTrustScore(id: string, delta: number): Promise<void> {
    await this.usersRepository.increment({ id }, 'trustScore', delta);
  }

  async modifyTrustScore(userId: string, delta: number): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const newScore = Math.min(MAX_TRUST, Math.max(MIN_TRUST, user.trustScore + delta));
    await this.usersRepository.update(userId, { trustScore: newScore });
    return newScore;
  }
}