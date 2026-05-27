import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';

// ── Active chat suppression (WhatsApp-style) ──
let _activeChatId: string | null = null;
let _appIsActive = AppState.currentState === 'active';

// Track app state changes — when app goes to background, clear backend presence
AppState.addEventListener('change', (state) => {
  const wasActive = _appIsActive;
  _appIsActive = state === 'active';

  if (!_appIsActive && wasActive && _activeChatId) {
    // App went to background — clear presence on backend so push resumes
    _reportPresenceToBackend(null).catch(() => {});
  } else if (_appIsActive && !wasActive && _activeChatId) {
    // App returned to foreground with chat still open — re-report presence
    _reportPresenceToBackend(_activeChatId).catch(() => {});
    // Also dismiss any notifications that arrived while backgrounded
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
  // Dismiss existing tray notifications for this chat immediately
  dismissNotificationsForContext({ chatId }).catch(() => {});
  // Tell backend to suppress push for this chat
  _reportPresenceToBackend(chatId).catch(() => {});
}

/** Call when the user leaves the chat screen */
export function clearActiveChatId() {
  _activeChatId = null;
  // Tell backend to resume sending push
  _reportPresenceToBackend(null).catch(() => {});
}

/** Check if a specific chat is currently active */
export function getActiveChatId(): string | null { return _activeChatId; }

// Configurar handler para notificaciones en foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification?.request?.content?.data as Record<string, any> | undefined;
    const incomingChatId = data?.chatId;
    const notifType = data?.type;

    // Suppress banner/sound/badge if user is viewing this exact chat AND app is in foreground
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

    // Default: show everything
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Solo funciona en dispositivos físicos, no en web ni simuladores
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    console.log('Push notifications requieren un dispositivo físico');
    return null;
  }

  try {
    // Configurar canales de Android
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

    // Verificar/solicitar permisos
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

    // Obtener Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData?.data;

    if (!token) return null;

    // Enviar token al backend
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
 * Only removes notifications for the exact chatId or requestId opened.
 */
export async function dismissNotificationsForContext(filter: {
  requestId?: string;
  chatId?: string;
}) {
  if (Platform.OS === 'web') return;
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
    // Update badge to reflect remaining notifications
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
