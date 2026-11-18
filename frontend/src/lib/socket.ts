import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let activeUserId: string | null = null;

export function getSocket(userId: string): Socket {
  if (socket && activeUserId !== userId) {
    socket.disconnect();
    socket = null;
    activeUserId = null;
  }

  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    socket = io(socketUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });
    activeUserId = userId;
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    activeUserId = null;
  }
}

export function getCurrentSocketId(): string | undefined {
  return socket?.id;
}
