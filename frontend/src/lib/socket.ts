import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(userId = 'usr_demo_123'): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    socket = io(socketUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function getCurrentSocketId(): string | undefined {
  return socket?.id;
}

