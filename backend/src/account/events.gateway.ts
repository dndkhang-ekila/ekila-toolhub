import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      void client.join(`user:${userId}`);
    }
  }

  handleDisconnect() {}

  notifyLogoutOtherDevices(userId: string, currentSocketId?: string) {
    if (!this.server) return;

    const room = `user:${userId}`;
    if (currentSocketId) {
      this.server.to(room).except(currentSocketId).emit('FORCE_LOGOUT', {
        message: 'Bạn đã đăng xuất khỏi thiết bị này từ một nơi khác.',
      });
    } else {
      this.server.to(room).emit('FORCE_LOGOUT', {
        message: 'Bạn đã đăng xuất khỏi thiết bị này từ một nơi khác.',
      });
    }
  }
}
