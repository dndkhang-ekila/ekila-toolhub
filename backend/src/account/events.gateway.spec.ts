import { describe, it, expect, jest } from '@jest/globals';
import type { Server, Socket } from 'socket.io';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  it('joins user-specific room on connection', () => {
    const gateway = new EventsGateway();
    const join = jest.fn();
    const client = {
      handshake: { query: { userId: 'user-A' } },
      join,
    } as unknown as Socket;

    gateway.handleConnection(client);
    expect(join).toHaveBeenCalledWith('user:user-A');
  });

  it('emits FORCE_LOGOUT only to target user room excluding current socket', () => {
    const gateway = new EventsGateway();
    const emit = jest.fn();
    const except = jest.fn(() => ({ emit }));
    const to = jest.fn(() => ({ except, emit }));

    gateway.server = { to } as unknown as Server;

    gateway.notifyLogoutOtherDevices('user-A', 'socket-A1');

    expect(to).toHaveBeenCalledWith('user:user-A');
    expect(except).toHaveBeenCalledWith('socket-A1');
    expect(emit).toHaveBeenCalledWith(
      'FORCE_LOGOUT',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
