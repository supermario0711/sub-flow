/**
 * Returns a simulated "now" date.
 * If hoursUntilLock is null, returns the real current time.
 * Otherwise, computes a date that is `hoursUntilLock` hours before `lockAt`.
 */
export function getSimulatedNow(
  lockAt: string,
  hoursUntilLock: number | null
): Date {
  if (hoursUntilLock === null) return new Date();
  const lockDate = new Date(lockAt);
  return new Date(lockDate.getTime() - hoursUntilLock * 60 * 60 * 1000);
}
