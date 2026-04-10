import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, userId);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('joinActivity')
  handleJoinActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string },
  ) {
    client.join(`activity:${data.activityId}`);
    return { joined: true, activityId: data.activityId };
  }

  @SubscribeMessage('leaveActivity')
  handleLeaveActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string },
  ) {
    client.leave(`activity:${data.activityId}`);
    return { left: true, activityId: data.activityId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string; content: string; senderId: string },
  ) {
    const message = await this.chatService.createMessage(
      data.activityId,
      data.senderId,
      data.content,
    );

    this.server.to(`activity:${data.activityId}`).emit('newMessage', message);
    return message;
  }
}