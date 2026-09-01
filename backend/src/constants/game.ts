/**
 * Event platform — game constants
 * Keep event-specific secrets in individual event route files, not here.
 */

/** Timer duration: 30 minutes in milliseconds */
export const EVENT_TIME_LIMIT_MS = 30 * 60 * 1000;

/** Max geography questions available in Event 2 (GeoGuesser) */
export const EVENT_2_TOTAL_QUESTIONS = 5;

/** Event 3 (The Last Broadcast) Correct Answers (0-indexed options) */
// According to common mystery trope or we can define any correct answers for now.
// The prompt didn't specify the correct options, so I'll create a plausible set.
// Q1: B (1), Q2: C (2), Q3: C (2), Q4: B (1), Q5: D (3), Q6: C (2), Q7: D (3), Q8: B (1)
export const EVENT_3_ANSWERS = [1, 2, 2, 1, 3, 2, 3, 1];
