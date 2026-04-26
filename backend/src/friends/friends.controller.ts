import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('search')
  async search(
    @Query('q') query: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.friendsService.search(query, req.user.id);
  }

  @Post('request/:userId')
  async sendRequest(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.friendsService.sendRequest(req.user.id, userId);
  }

  @Post('accept/:requestId')
  async acceptRequest(
    @Param('requestId') requestId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.friendsService.acceptRequest(requestId, req.user.id);
  }

  @Post('reject/:requestId')
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.friendsService.rejectRequest(requestId, req.user.id);
  }

  @Delete(':userId')
  async removeFriend(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.friendsService.removeFriend(req.user.id, userId);
    return { removed: true };
  }

  @Get()
  async getFriends(@Req() req: AuthenticatedRequest) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('requests/incoming')
  async getIncomingRequests(@Req() req: AuthenticatedRequest) {
    return this.friendsService.getIncomingRequests(req.user.id);
  }

  @Get('requests/outgoing')
  async getOutgoingRequests(@Req() req: AuthenticatedRequest) {
    return this.friendsService.getOutgoingRequests(req.user.id);
  }
}