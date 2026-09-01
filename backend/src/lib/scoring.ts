/**
 * Placement-based scoring.
 *
 * Scoring table:
 *   1st  = 20 pts
 *   2nd  = 19 pts
 *   ...
 *   20th =  1 pt
 *   21st+ = 0 pts
 *
 * Formula: max(21 - completionNumber, 0)
 */
export function calculatePlacementScore(completionNumber: number): number {
  if (completionNumber <= 0) return 0;
  return Math.max(21 - completionNumber, 0);
}
