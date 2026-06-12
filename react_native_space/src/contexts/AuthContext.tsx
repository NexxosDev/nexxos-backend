import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, signupApi, getMeApi } from '../services/auth';
import { getToken, setToken, removeToken } from '../services/token';
import { setOnUnauthorized } from '../services/api';
import { registerForPushNotifications, unregisterPushToken } from '../services/pushNotifications';
import type { User } from '../types';

const CACHED_USER_KEY = 'nexxos_cached_user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Parameters<typeof signupApi>[0]) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

  const clearAuth = useCallback(async () => {
    await unregisterPushToken(pushTokenRef.current);
    pushTokenRef.current = null;
    await removeToken();
    await AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearAuth();
    });
  }, [clearAuth]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          try {
            const data = await getMeApi();
            if (mounted && data?.user) {
              setUser(data.user);
              // Cache user for offline bootstrap
              AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user)).catch(() => {});
            }
          } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
              // Token expired/revoked — clear everything
              await removeToken();
              await AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
            } else {
              // Network error — restore cached user so session persists offline
              try {
                const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
                if (cached && mounted) {
                  const parsed = JSON.parse(cached);
                  if (parsed?.id) setUser(parsed);
                }
              } catch { /* no cached user available */ }
            }
          }
        }
      } catch { /* getToken failed */ }
      if (mounted) setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Registrar push token cuando el usuario está autenticado
  useEffect(() => {
    if (user && !pushTokenRef.current) {
      registerForPushNotifications().then((token) => {
        pushTokenRef.current = token;
      }).catch(() => {});
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password);
    if (data?.token) {
      await setToken(data.token);
    }
    const u = data?.user ?? null;
    setUser(u);
    if (u) AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(u)).catch(() => {});
  }, []);

  const signup = useCallback(async (signupData: Parameters<typeof signupApi>[0]) => {
    const data = await signupApi(signupData);
    if (data?.token) {
      await setToken(data.token);
    }
    const u = data?.user ?? null;
    setUser(u);
    if (u) AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(u)).catch(() => {});
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMeApi();
      if (data?.user) {
        setUser(data.user);
        AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user)).catch(() => {});
      }
    } catch (err: any) {
      // Only clear auth on real 401/403, not on network errors
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        await clearAuth();
      }
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
