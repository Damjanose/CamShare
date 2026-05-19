import { create } from 'zustand';

type SocketState = {
  connected: boolean;
  setConnected: (v: boolean) => void;
};

export const useSocketStore = create<SocketState>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));
