import { Platform, AppState } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';

// expo-notifications crashes Expo Go on SDK 53+; conditionally import
const isExpoGo = Constants.appOwnership === 'expo';
let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try { Notifications = require('expo-notifications'); } catch { }
}

// ── Active chat suppression (WhatsApp-style) ──
let _activeChatId: string | null = null;
let _appIsActive = AppState.currentState === 'active';

// Track app state changes — when app goes to background, clear backend presence
AppState.addEventListener('change', (state) => {
  const wasActive = _appIsActive;
  _appIsActive = state === 'active';

  if (!_appIsActive && wasActive && _activeChatId) {
    _reportPresenceToBackend(null).catch(() => {});
  } else if (_appIsActive && !wasActive && _activeChatId) {
    _reportPresenceToBackend(_activeChatId).catch(() => {});
    dismissNotificationsForContext({ chatId: _activeChatId }).catch(() => {});
  }
});

/** Report active chat to backend so it can skip sending push */
async function _reportPresenceToBackend(chatId: string | null) {
  try {
    if (chatId) {
      await api.post('/chat-presence', { chatId });
    } else {
      await api.delete('/chat-presence');
    }
  } catch {
    // Non-critical — frontend foreground handler is the fallback
  }
}

/** Call when the user opens a specific chat screen */
export function setActiveChatId(chatId: string) {
  _activeChatId = chatId;
  dismissNotificationsForContext({ chatId }).catch(() => {});
  _reportPresenceToBackend(chatId).catch(() => {});
}

/** Call when the user leaves the chat screen */
export function clearActiveChatId() {
  _activeChatId = null;
  _reportPresenceToBackend(null).catch(() => {});
}

/** Check if a specific chat is currently active */
export function getActiveChatId(): string | null { return _activeChatId; }

// Configurar handler para notificaciones en foreground (only when Notifications available)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification: any) => {
      const data = notification?.request?.content?.data as Record<string, any> | undefined;
      const incomingChatId = data?.chatId;
      const notifType = data?.type;

      if (
        _appIsActive &&
        _activeChatId &&
        incomingChatId &&
        incomingChatId === _activeChatId &&
        notifType === 'NEW_MESSAGE'
      ) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) return null;
  if (!Device.isDevice) {
    console.log('Push notifications requieren un dispositivo físico');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Mensajes',
        description: 'Mensajes del chat con vendedores y clientes',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('requests', {
        name: 'Solicitudes',
        description: 'Nuevas solicitudes, respuestas y cierres',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('ratings', {
        name: 'Calificaciones',
        description: 'Calificaciones recibidas y recordatorios',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData?.data;

    if (!token) return null;

    await api.post('/push-tokens', {
      token,
      platform: Platform.OS,
    });

    console.log('Push token registrado:', token);
    return token;
  } catch (error) {
    console.error('Error registrando push token:', error);
    return null;
  }
}

/**
 * Dismiss system-tray notifications matching a specific context (like WhatsApp).
 */
export async function dismissNotificationsForContext(filter: {
  requestId?: string;
  chatId?: string;
}) {
  if (Platform.OS === 'web' || !Notifications) return;
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const notif of presented) {
      const data = notif?.request?.content?.data as Record<string, any> | undefined;
      if (!data) continue;
      const matchesChat = filter.chatId && data.chatId === filter.chatId;
      const matchesRequest = filter.requestId && data.requestId === filter.requestId;
      if (matchesChat || matchesRequest) {
        await Notifications.dismissNotificationAsync(notif.request.identifier);
      }
    }
    const remaining = await Notifications.getPresentedNotificationsAsync();
    await Notifications.setBadgeCountAsync(remaining?.length ?? 0);
  } catch (err) {
    console.error('Error dismissing notifications:', err);
  }
}

export async function unregisterPushToken(token: string | null) {
  if (!token) return;
  try {
    await api.delete('/push-tokens', { data: { token } });
  } catch {
    // Silently ignore
  }
}