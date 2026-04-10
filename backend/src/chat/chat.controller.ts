import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('activities/:activityId/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getMessages(
    @Param('activityId') activityId: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessagesForActivity(
      activityId,
      limit ? parseInt(limit, 10) : 100,
    );
  }
}