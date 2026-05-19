import { create } from 'zustand';

type AuthState = {
  sessionReady: boolean;
  setSessionReady: (ready: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  sessionReady: false,
  setSessionReady: (ready) => set({ sessionReady: ready }),
}));
