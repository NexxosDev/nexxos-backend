import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface UnreadState {
  totalUnread: number;
  byRequestId: Record<string, number>;
  refresh: () => Promise<void>;
}

const UnreadContext = createContext<UnreadState>({
  totalUnread: 0,
  byRequestId: {},
  refresh: async () => {},
});

export function useUnread() {
  return useContext(UnreadContext);
}

const POLL_INTERVAL = 15000;

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [byRequestId, setByRequestId] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!user?.id) {
      setTotalUnread(0);
      setByRequestId({});
      return;
    }
    try {
      const res = await api.get('/chats/unread-summary');
      const data = res?.data;
      setTotalUnread(data?.totalUnread ?? 0);
      setByRequestId(data?.byRequestId ?? {});
    } catch {
      // silently fail — network hiccup, auth expired, etc.
    }
  }, [user?.id]);

  // Poll when authenticated
  useEffect(() => {
    if (!user?.id) {
      setTotalUnread(0);
      setByRequestId({});
      return;
    }

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL);

    // Refresh when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchUnread();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub?.remove?.();
    };
  }, [user?.id, fetchUnread]);

  return (
    <UnreadContext.Provider value={{ totalUnread, byRequestId, refresh: fetchUnread }}>
      {children}
    </UnreadContext.Provider>
  );
}
