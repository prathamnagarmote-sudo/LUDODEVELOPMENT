/**
 * clockSync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * EMA-smoothed server–client clock offset.
 *
 * The offset is defined as:
 *   serverTime ≈ Date.now() + offset
 *   localTime  ≈ serverTime - offset
 *
 * Updated on every OpCode 102 heartbeat response via `updateClockOffset`.
 * Read via `serverToLocal(serverMs)` to convert a server timestamp to the
 * equivalent local time so animations can be scheduled correctly.
 */

let _offset = 0;        // milliseconds: server - local_midpoint
let _sampleCount = 0;
const EMA_ALPHA = 0.2;  // smoothing factor (lower = smoother, slower to adapt)

/**
 * Call this on every heartbeat (OpCode 102) response.
 * @param clientSentMs  - `Date.now()` recorded when the ping was sent
 * @param serverMs      - `serverTime` from the Nakama server response
 * @param clientRecvMs  - `Date.now()` recorded when the pong was received
 */
export function updateClockOffset(
  clientSentMs: number,
  serverMs: number,
  clientRecvMs: number
): void {
  if (clientSentMs <= 0 || serverMs <= 0) return;
  const rtt = clientRecvMs - clientSentMs;
  // NTP-style midpoint estimate of the server time at mid-flight
  const sample = serverMs - (clientSentMs + rtt / 2);
  if (_sampleCount === 0) {
    _offset = sample;
  } else {
    _offset = EMA_ALPHA * sample + (1 - EMA_ALPHA) * _offset;
  }
  _sampleCount++;
}

/**
 * Convert a server-wall-clock timestamp to the equivalent local time.
 * Use this to anchor server-timestamped events to local setTimeout calls.
 */
export function serverToLocal(serverMs: number): number {
  return serverMs - _offset;
}

/** Raw offset value (for debugging / storing in a ref). */
export function getClockOffset(): number {
  return _offset;
}

/** Reset state (useful for tests or reconnect). */
export function resetClockSync(): void {
  _offset = 0;
  _sampleCount = 0;
}
