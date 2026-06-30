// ============================================
// NEXXOS - Backend Configuration
// ============================================
// INTERRUPTOR ÚNICO: cambia SOLO esta palabra entre 'PROD' y 'DEV'.
//   "apunta a PROD" -> ENV = 'PROD'  (Render + Supabase, producción)
//   "apunta a DEV"  -> ENV = 'DEV'   (Abacus, pruebas)

const ENV: 'PROD' | 'DEV' = 'PROD';

// ---- No tocar de aquí para abajo ----
const BACKENDS: Record<'PROD' | 'DEV', string> = {
  PROD: 'https://api.nexxos.app/',          // Producción (Render + Supabase)
  DEV: 'https://nexxos-api.abacusai.app/',  // Dev (Abacus)
};

export const BACKEND_ENV = ENV;
export const BACKEND_URL = BACKENDS[ENV];

// Nombre limpio para mostrar en el login (se genera automáticamente)
export const BACKEND_LABEL = BACKEND_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
