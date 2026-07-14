import { Linking } from 'react-native';
import { router } from 'expo-router';

// Interpreta un action_url configurado desde el panel admin:
//   - Empieza con http(s):// -> abre en el navegador / app externa.
//   - Empieza con "/"        -> navega dentro de la app (ruta interna).
//   - Vacío / inválido       -> no hace nada.
export function openActionUrl(url?: string | null): void {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return;

  if (/^https?:\/\//i.test(u)) {
    Linking.openURL(u).catch((e) =>
      console.error('Error abriendo URL externa:', e),
    );
    return;
  }

  try {
    router.push(u as any);
  } catch (e) {
    console.error('Error navegando a ruta interna:', e);
  }
}
