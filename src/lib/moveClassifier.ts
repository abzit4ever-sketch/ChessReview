import { MoveClassification } from './types';
import { winPercentage } from './accuracyCalc';

export interface ClassificationInput {
  winPctLoss:  number;   // win% lost by the moving player (always ≥ 0)
  isBestMove:  boolean;  // played the engine's top choice (or within 0.5% win%)
  isSacrifice: boolean;  // moved a piece to an unprotected square without capture
  evalBefore:  number;   // WHITE-RELATIVE eval before the move (centipawns)
  evalAfter:   number;   // WHITE-RELATIVE eval after the move (centipawns)
  isWhite:     boolean;
}

/**
 * Classify a chess move using win-percentage loss — the same approach
 * chess.com uses so that a 50cp drop in a +800 position is not called a
 * blunder, but a 50cp drop in an equal position is correctly flagged.
 *
 * Thresholds (approximate chess.com values):
 *   Brilliant  : best move, sacrifice, dramatically improves a tough position
 *   Best       : engine's top move (or win% loss < 0.5%)
 *   Excellent  : win% loss < 2%
 *   Good       : win% loss < 5%
 *   Inaccuracy : win% loss < 10%
 *   Mistake    : win% loss < 20%
 *   Blunder    : win% loss ≥ 20%
 */
export function classifyMove({
  winPctLoss,
  isBestMove,
  isSacrifice,
  evalBefore,
  evalAfter,
  isWhite,
}: ClassificationInput): MoveClassification {

  // ── Forced move (only one legal option — very rare, not yet detected) ──
  // Kept as a future hook; for now we skip this classification.

  // ── Brilliant ──────────────────────────────────────────────────────────
  // Best move + non-capture sacrifice + position was equal or worse before,
  // and the move significantly improves the eval.
  if (isBestMove && isSacrifice) {
    const prevEvalFromPlayer = isWhite ? evalBefore : -evalBefore;
    const nextEvalFromPlayer = isWhite ? evalAfter  : -evalAfter;
    // Position was difficult (≤ +0.5 for the moving player) and the move
    // wins by at least a pawn (≥ +100cp gain).
    if (prevEvalFromPlayer <= 50 && nextEvalFromPlayer >= 150) {
      return 'brilliant';
    }
  }

  // ── Best ───────────────────────────────────────────────────────────────
  if (isBestMove || winPctLoss < 0.5) return 'best';

  // ── Excellent ──────────────────────────────────────────────────────────
  if (winPctLoss < 2) return 'excellent';

  // ── Good ───────────────────────────────────────────────────────────────
  if (winPctLoss < 5) return 'good';

  // ── Inaccuracy ─────────────────────────────────────────────────────────
  if (winPctLoss < 10) return 'inaccuracy';

  // ── Mistake ────────────────────────────────────────────────────────────
  if (winPctLoss < 20) return 'mistake';

  // ── Blunder ────────────────────────────────────────────────────────────
  return 'blunder';
}

// ── Colour / label maps (unchanged) ────────────────────────────────────────

export const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant:  '#1baca6',
  great:      '#5c8bb0',
  best:       '#96bc4b',
  excellent:  '#96bc4b',
  good:       '#7fa650',
  inaccuracy: '#f0a45d',
  mistake:    '#e58f2a',
  blunder:    '#ca3431',
  miss:       '#db5c5c',
  forced:     '#6b7280',
};

export const CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant:  'rgba(27, 172, 166, 0.15)',
  great:      'rgba(92, 139, 176, 0.15)',
  best:       'rgba(150, 188, 75, 0.15)',
  excellent:  'rgba(150, 188, 75, 0.12)',
  good:       'rgba(127, 166, 80, 0.12)',
  inaccuracy: 'rgba(240, 164, 93, 0.15)',
  mistake:    'rgba(229, 143, 42, 0.15)',
  blunder:    'rgba(202, 52, 49, 0.18)',
  miss:       'rgba(219, 92, 92, 0.15)',
  forced:     'rgba(107, 114, 128, 0.12)',
};

export const CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
  brilliant:  'Brilliant',
  great:      'Great',
  best:       'Best',
  excellent:  'Excellent',
  good:       'Good',
  inaccuracy: 'Inaccuracy',
  mistake:    'Mistake',
  blunder:    'Blunder',
  miss:       'Miss',
  forced:     'Forced',
};

export const CLASSIFICATION_SYMBOLS: Record<MoveClassification, string> = {
  brilliant:  '!!',
  great:      '!',
  best:       '',
  excellent:  '',
  good:       '',
  inaccuracy: '?!',
  mistake:    '?',
  blunder:    '??',
  miss:       '⊘',
  forced:     '□',
};

export const CLASSIFICATION_EMOJI: Record<MoveClassification, string> = {
  brilliant:  '🌟',
  great:      '⚡',
  best:       '✓',
  excellent:  '✓',
  good:       '·',
  inaccuracy: '△',
  mistake:    '?',
  blunder:    '✕',
  miss:       '⊘',
  forced:     '□',
};
