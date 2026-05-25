/**
 * Shared category icon mapping used by PartsAccordion and SelectInput renderers.
 * Keys are matched case-insensitively against category names.
 */
const CATEGORY_ICONS: Record<string, string> = {
  'Electricas': 'flash',
  'Tiempos': 'time',
  'Frenos': 'disc',
  'Motor': 'cog',
  'Rodamientos': 'sync',
  'Suspension': 'git-commit',
  'Cajas': 'settings',
  'Filtros': 'funnel',
  'Direccion': 'navigate',
  'Estoperas': 'ellipse',
  'Empacaduras': 'layers',
  'Lubricantes': 'water',
  'Seguridad': 'shield-checkmark',
  'Accesorios': 'grid',
  'Mangueras': 'git-branch',
  'Gomas': 'radio-button-off',
  'Carroceria': 'car-sport',
  'Guayas': 'link',
  'Faros': 'bulb',
  'Inyeccion': 'flame',
};

export function getCategoryIcon(name: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name?.toLowerCase?.()?.includes?.(key?.toLowerCase?.())) return icon;
  }
  return 'build';
}
