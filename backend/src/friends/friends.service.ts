import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  async search(query: string, currentUserId: string): Promise<User[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return [];
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere(
        '(LOWER(user.email) LIKE :query OR LOWER(user.displayName) LIKE :query)',
        { query: `%${normalizedQuery}%` },
      )
      .take(10)
      .getMany();

    const friendIds = await this.getFriendIds(currentUserId);
    const pendingRequestMap = await this.getPendingRequestMap(currentUserId);

    return users.map((user) => ({
      ...user,
      friendStatus: this.getFriendStatus(user.id, friendIds, pendingRequestMap),
    }));
  }

  private getFriendStatus(
    userId: string,
    friendIds: Set<string>,
    pendingMap: Map<string, FriendRequest>,
  ): 'none' | 'pending' | 'outgoing' | 'friends' {
    if (friendIds.has(userId)) return 'friends';
    const request = pendingMap.get(userId);
    if (!request) return 'none';
    return request.requesterId === userId ? 'outgoing' : 'pending';
  }

  private async getFriendIds(userId: string): Promise<Set<string>> {
    const requests = await this.friendRequestRepository.find({
      where: [
        { requesterId: userId, status: FriendRequestStatus.ACCEPTED },
        { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
    });

    const friendIds = new Set<string>();
    for (const req of requests) {
      if (req.requesterId === userId) {
        friendIds.add(req.receiverId);
      } else {
        friendIds.add(req.requesterId);
      }
    }
    return friendIds;
  }

  private async getPendingRequestMap(
    userId: string,
  ): Promise<Map<string, FriendRequest>> {
    const requests = await this.friendRequestRepository.find({
      where: [
        { requesterId: userId, status: FriendRequestStatus.PENDING },
        { receiverId: userId, status: FriendRequestStatus.PENDING },
      ],
    });

    const map = new Map<string, FriendRequest>();
    for (const req of requests) {
      const otherUserId =
        req.requesterId === userId ? req.receiverId : req.requesterId;
      map.set(otherUserId, req);
    }
    return map;
  }

  async sendRequest(requesterId: string, receiverId: string): Promise<FriendRequest> {
    if (requesterId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    const existingRequest = await this.friendRequestRepository.findOne({
      where: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.ACCEPTED) {
        throw new BadRequestException('You are already friends');
      }
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        if (existingRequest.requesterId === requesterId) {
          throw new BadRequestException('Friend request already sent');
        }
        existingRequest.status = FriendRequestStatus.ACCEPTED;
        return this.friendRequestRepository.save(existingRequest);
      }
      if (existingRequest.status === FriendRequestStatus.REJECTED) {
        existingRequest.status = FriendRequestStatus.PENDING;
        existingRequest.requesterId = requesterId;
        existingRequest.receiverId = receiverId;
        return this.friendRequestRepository.save(existingRequest);
      }
    }

    const request = this.friendRequestRepository.create({
      requesterId,
      receiverId,
      status: FriendRequestStatus.PENDING,
    });

    return this.friendRequestRepository.save(request);
  }

  async acceptRequest(requestId: string, userId: string): Promise<FriendRequest> {
    const request = await this.friendRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Request is no longer pending');
    }

    request.status = FriendRequestStatus.ACCEPTED;
    const saved = await this.friendRequestRepository.save(request);

    await this.usersService.modifyTrustScore(request.requesterId, 5);
    await this.usersService.modifyTrustScore(request.receiverId, 5);

    return saved;
  }

  async rejectRequest(requestId: string, userId: string): Promise<FriendRequest> {
    const request = await this.friendRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Request is no longer pending');
    }

    request.status = FriendRequestStatus.REJECTED;
    return this.friendRequestRepository.save(request);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const request = await this.friendRequestRepository.findOne({
      where: [
        { requesterId: userId, receiverId: friendId, status: FriendRequestStatus.ACCEPTED },
        { requesterId: friendId, receiverId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
    });

    if (!request) {
      throw new NotFoundException('Friend relationship not found');
    }

    await this.friendRequestRepository.remove(request);
    await this.usersService.modifyTrustScore(friendId, -10);
  }

  async getFriends(userId: string): Promise<User[]> {
    const requests = await this.friendRequestRepository.find({
      where: { status: FriendRequestStatus.ACCEPTED },
      relations: ['requester', 'receiver'],
    });

    const friendIds: string[] = [];
    for (const req of requests) {
      if (req.requesterId === userId) {
        friendIds.push(req.receiverId);
      } else if (req.receiverId === userId) {
        friendIds.push(req.requesterId);
      }
    }

    if (friendIds.length === 0) {
      return [];
    }

    return this.userRepository.find({
      where: { id: In(friendIds) },
    });
  }

  async getFriendIdsList(userId: string): Promise<string[]> {
    const friends = await this.getFriends(userId);
    return friends.map((f) => f.id);
  }

  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: { requesterId: userId, status: FriendRequestStatus.PENDING },
      relations: ['receiver'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserProfile(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'displayName', 'avatarUrl', 'trustScore', 'createdAt'],
    });
    return user;
  }
}