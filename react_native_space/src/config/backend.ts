// ============================================
// NEXXOS - Backend Configuration
// ============================================
// Descomenta la línea del backend que quieras usar:

// export const BACKEND_URL = 'https://api.nexxos.app/';          // Producción (Render)
export const BACKEND_URL = 'https://nexxos-api.abacusai.app/'; // Dev (Abacus)

// Nombre limpio para mostrar en el login (se genera automáticamente)
export const BACKEND_LABEL = BACKEND_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
