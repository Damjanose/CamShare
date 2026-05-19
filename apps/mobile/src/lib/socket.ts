import { io, type Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { useNotificationStore } from '../stores/notificationStore';
import { useSocketStore } from '../stores/socketStore';

let socket: Socket | null = null;

export function connectRealtime(accessToken: string, onInvalidate: () => void) {
  if (socket?.connected) return;

  socket = io(ENV.socketUrl, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    useSocketStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    useSocketStore.getState().setConnected(false);
  });

  socket.on('order:created', onInvalidate);
  socket.on('order:status_updated', onInvalidate);
  socket.on('notification:new', () => {
    useNotificationStore.getState().bump();
    onInvalidate();
  });
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
  useSocketStore.getState().setConnected(false);
}
