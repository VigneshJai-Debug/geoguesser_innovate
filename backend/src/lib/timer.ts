import { EVENT_TIME_LIMIT_MS } from '../constants/game.js';

/**
 * Computes the deadline for an event timer.
 * @param startedAt — The server time when the team entered the event.
 * @returns deadlineAt — exactly 30 minutes after startedAt.
 */
export function computeDeadline(startedAt: Date): Date {
  return new Date(startedAt.getTime() + EVENT_TIME_LIMIT_MS);
}

/**
 * Returns true if the current server time has passed the event deadline.
 * The server is always authoritative — never trust the frontend timer.
 */
export function hasDeadlinePassed(deadlineAt: Date): boolean {
  return Date.now() > deadlineAt.getTime();
}

/**
 * Returns remaining milliseconds until the deadline (floored at 0).
 */
export function timeRemainingMs(deadlineAt: Date): number {
  return Math.max(0, deadlineAt.getTime() - Date.now());
}
