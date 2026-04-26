import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

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
      newUser.trustScore = 100;
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
}