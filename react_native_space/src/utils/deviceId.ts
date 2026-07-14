import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// expo-secure-store no está disponible en web; se importa perezosamente solo en nativo.
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    SecureStore = null;
  }
}

const KEY = 'nexxos_device_id';

function newId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback simple si randomUUID no estuviera disponible.
    return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Devuelve un identificador de dispositivo estable y persistente.
// Se usa como "sujeto" del capping cuando el usuario no está logueado.
export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'web' || !SecureStore) {
      let id = await AsyncStorage.getItem(KEY);
      if (!id) {
        id = newId();
        await AsyncStorage.setItem(KEY, id);
      }
      return id;
    }
    let id = await SecureStore.getItemAsync(KEY);
    if (!id) {
      id = newId();
      await SecureStore.setItemAsync(KEY, id);
    }
    return id;
  } catch {
    // Último recurso: id efímero (no rompe la app).
    return newId();
  }
}
