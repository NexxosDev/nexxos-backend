/**
 * Shared category icon mapping used by PartsAccordion and SelectInput renderers.
 * Keys are matched case-insensitively against category names.
 */
const CATEGORY_ICONS: Record<string, string> = {
  'Motor': 'cog',
  'Frenos': 'disc',
  'Suspensión': 'git-commit',
  'Eléctrico': 'flash',
  'Transmisión': 'settings',
  'Carrocería': 'car-sport',
  'Refrigeración': 'thermometer',
  'Dirección': 'navigate',
  'Escape': 'trail-sign',
  'Encendido': 'power',
  'Accesorios': 'grid',
  'Filtros': 'funnel',
  'Iluminación': 'bulb',
  'Interior': 'cube',
  'Neumáticos': 'ellipse',
};

export function getCategoryIcon(name: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name?.toLowerCase?.()?.includes?.(key?.toLowerCase?.())) return icon;
  }
  return 'build';
}
