// ============================================================
// SCORING CONFIGURATION — Change round scoring values here.
// ============================================================

/**
 * Round Time Limit in Minutes
 */
export const ROUND_TIME_LIMIT_MINUTES = 30;

/**
 * Maximum configured rounds for the current event
 */
export const TOTAL_CONFIGURED_ROUNDS = 2;

/**
 * Completion order scoring rules:
 * 1st team to complete = 20 points
 * 2nd = 19 points
 * ...
 * 20th = 1 point
 * 21st and beyond = 0 points
 */
export function getCompletionScoreDisplay(completionNumber: number | null): number {
  if (!completionNumber || completionNumber <= 0) return 0;
  return Math.max(21 - completionNumber, 0);
}
