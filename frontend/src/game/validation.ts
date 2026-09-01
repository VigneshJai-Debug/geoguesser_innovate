/**
 * Normalizes input strings for flexible and resilient geographic matching:
 * - Case-insensitive
 * - Removes accents / diacritics (e.g. Boyacá -> Boyaca, Soatá -> Soata)
 * - Collapses extra whitespaces and trims
 * - Strips non-alphanumeric punctuation where appropriate
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics / accents
    .toLowerCase()
    .replace(/[\(\),.\-_/]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Validates a user guess against the target geographical name and optional aliases.
 */
export function validateGuess(guess: string, targetName: string, aliases: string[] = []): boolean {
  const normalizedGuess = normalizeText(guess);
  if (!normalizedGuess) return false;

  const normalizedTarget = normalizeText(targetName);
  if (normalizedGuess === normalizedTarget) {
    return true;
  }

  // Check aliases
  for (const alias of aliases) {
    if (normalizedGuess === normalizeText(alias)) {
      return true;
    }
  }

  return false;
}
