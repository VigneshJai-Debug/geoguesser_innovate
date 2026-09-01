/**
 * Event platform — game constants
 * Keep event-specific secrets in individual event route files, not here.
 */

/** Timer duration: 30 minutes in milliseconds */
export const EVENT_TIME_LIMIT_MS = 30 * 60 * 1000;

/** Max geography questions available in Event 2 (GeoGuesser) */
export const EVENT_2_TOTAL_QUESTIONS = 5;

/** Event 3 (The Last Broadcast) Correct Answers (0-indexed options) */
export const EVENT_3_ANSWERS = [1, 2, 2, 1, 3, 2, 3, 1];

/** Event 5 (Three Locks) Correct Stage Answers (lowercase/trimmed) */
export const EVENT_5_STAGE_ANSWERS = {
  1: 'cipher',
  2: 'enigma',
  3: 'keystone',
};

/** Event 7 (Set Challenge) Secret Answer (lowercase/trimmed) */
export const EVENT_7_SECRET_ANSWER = 'innovate';
