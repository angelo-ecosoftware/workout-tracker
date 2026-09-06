/**
 * Standardized Date Formatting and Time Helpers
 */

/**
 * Formats an ISO date string (YYYY-MM-DD) into a friendly label (e.g. 'Today', 'Mon, Sep 6').
 */
export function formatDateTitle(dateStr: string, todayStr?: string): string {
  const effectiveToday = todayStr || new Date().toISOString().split('T')[0];
  if (dateStr === effectiveToday) return 'Today';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return dateStr;
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) in local time.
 */
export function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely shifts an ISO date string by a number of days (+1 or -1).
 */
export function shiftIsoDate(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
