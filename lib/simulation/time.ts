export type TimeMode = "urgent" | "balanced" | "relaxed";

/**
 * Determines the time mode based on hours until box lock.
 */
export function getTimeMode(hoursUntilLock: number): TimeMode {
  if (hoursUntilLock < 12) return "urgent";
  if (hoursUntilLock <= 72) return "balanced";
  return "relaxed";
}

/**
 * Calculates hours remaining until lock_at from a given "now" date.
 */
export function getHoursUntilLock(lockAt: string, now: Date): number {
  const lockDate = new Date(lockAt);
  const diff = lockDate.getTime() - now.getTime();
  return Math.max(0, diff / (1000 * 60 * 60));
}
