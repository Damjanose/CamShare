import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectRealtime, disconnectRealtime } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export function useSocketLifecycle() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      disconnectRealtime();
      return;
    }

    connectRealtime(accessToken, () => queryClient.invalidateQueries());

    return () => disconnectRealtime();
  }, [accessToken, queryClient]);
}
