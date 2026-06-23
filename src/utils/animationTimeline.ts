/**
 * animationTimeline.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight scheduler that fires a callback at a specific local wall-clock
 * time (as returned by `serverToLocal()` from clockSync.ts).
 *
 * Usage:
 *   const cancel = scheduleAt(serverToLocal(parsed.rollStartedAtMs), () => {
 *     // start animation
 *   });
 *   // call cancel() to abort if needed
 */

/**
 * Schedule `callback` to run at `targetLocalMs`.
 * - If `targetLocalMs` is in the past (or within 4ms), fires immediately
 *   via a zero-delay setTimeout (yields to the browser's event loop once).
 * - Returns a cancel function that clears the timer.
 */
export function scheduleAt(targetLocalMs: number, callback: () => void): () => void {
  const delay = Math.max(0, targetLocalMs - Date.now());
  const id = setTimeout(callback, delay);
  return () => clearTimeout(id);
}
