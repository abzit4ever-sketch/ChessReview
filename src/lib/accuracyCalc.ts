/**
 * Accuracy calculation matching chess.com's analysis formula.
 * Reference: https://www.chess.com/article/view/chess-com-accuracy
 */

/**
 * Convert centipawn score (white-relative) to win probability for white (0-100).
 * Uses the same logistic sigmoid formula as chess.com.
 */
export function winPercentage(cp: number): number {
  // Clamp to avoid overflow in exp
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
}

/**
 * Calculate the accuracy of a single move.
 * @param prevWinPct - win% for the player BEFORE they moved (0-100)
 * @param newWinPct  - win% for the player AFTER they moved (0-100)
 * @returns accuracy score 0-100
 */
export function moveAccuracy(prevWinPct: number, newWinPct: number): number {
  const delta = Math.max(0, prevWinPct - newWinPct);
  const accuracy = 103.1668 * Math.exp(-0.04354 * delta) - 3.1668;
  return Math.max(0, Math.min(100, accuracy));
}

/**
 * Calculate overall game accuracy from an array of per-move accuracies.
 * Returns a rounded value (1 decimal place).
 */
export function gameAccuracy(accuracies: number[]): number {
  if (accuracies.length === 0) return 100;
  const sum = accuracies.reduce((a, b) => a + b, 0);
  return Math.round((sum / accuracies.length) * 10) / 10;
}

/**
 * Format a centipawn score for display.
 * e.g. +2.5, -0.8, M4, -M3
 */
export function formatScore(cp: number, isMate?: boolean, mateIn?: number): string {
  if (isMate && mateIn !== undefined) {
    return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
  }
  const pawns = cp / 100;
  const sign = pawns >= 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}
