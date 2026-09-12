export function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function hasCompletedSessionOnDate(
  sessions: Array<{ status?: string; completedAt?: Date | null }>,
  dateKey: string,
): boolean {
  return sessions.some((session) => (
    session.status === 'completed' &&
    session.completedAt &&
    getLocalDateKey(session.completedAt) === dateKey
  ));
}
