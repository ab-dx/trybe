import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async getMessagesForActivity(activityId: string, limit = 100): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { activityId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async createMessage(
    activityId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    const message = this.messagesRepository.create({
      activityId,
      senderId,
      content,
    });
    const saved = await this.messagesRepository.save(message);
    const result = await this.messagesRepository.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
    if (!result) {
      throw new Error('Failed to create message');
    }
    return result;
  }

  async deleteOldMessages(activityId: string): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    await this.messagesRepository.delete({
      activityId,
      createdAt: LessThan(cutoffDate),
    });
  }
}