import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectRealtime, disconnectRealtime } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../stores/authStore';

export function useSocketLifecycle() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const sessionReady = useAuthStore((s) => s.sessionReady);

  useEffect(() => {
    if (!sessionReady || !accessToken) {
      disconnectRealtime();
      return;
    }

    connectRealtime(accessToken, () => queryClient.invalidateQueries());

    return () => disconnectRealtime();
  }, [accessToken, queryClient, sessionReady]);
}
