// Formats a seconds count as "M:SS" (e.g. 135 -> "2:15").
// Used for the rate-limit countdown shown on auth submit buttons.
export function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
