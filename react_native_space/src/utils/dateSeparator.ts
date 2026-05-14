/**
 * Returns a human-friendly date label for chat separators.
 * Rules:
 *  - Today → "Hoy"
 *  - Yesterday → "Ayer"
 *  - This week (Mon–Sun, excluding today/yesterday) → "Esta semana"
 *  - Last week → "Semana pasada"
 *  - Last month → "Mes pasado"
 *  - Older → "DD/MM/AAAA"
 */
export function getDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const today = stripTime(now);
    const msgDay = stripTime(date);
    const diffMs = today.getTime() - msgDay.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';

    // This week: same ISO week as today (Mon-based), excluding today/yesterday
    const todayDow = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    if (diffDays <= todayDow && diffDays >= 2) return 'Esta semana';

    // Last week: 7 days back from start of this week
    const daysToLastWeekStart = todayDow + 7;
    if (diffDays <= daysToLastWeekStart && diffDays > todayDow) return 'Semana pasada';

    // Last month
    const thisMonth = now.getFullYear() * 12 + now.getMonth();
    const msgMonth = date.getFullYear() * 12 + date.getMonth();
    if (thisMonth - msgMonth === 1) return 'Mes pasado';

    // Older: DD/MM/AAAA
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '';
  }
}

/** Returns a date-only key (YYYY-MM-DD) for grouping. */
export function getDateKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
