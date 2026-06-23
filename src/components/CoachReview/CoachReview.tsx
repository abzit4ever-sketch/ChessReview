'use client';

import React, { useMemo } from 'react';
import { AnalysedMove, GameData } from '@/lib/types';
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_SYMBOLS,
} from '@/lib/moveClassifier';
import { winPercentage } from '@/lib/accuracyCalc';
import styles from './CoachReview.module.css';

interface CoachReviewProps {
  move: AnalysedMove | null;
  game: GameData;
  moveIndex: number;
}

function generateCoachComment(move: AnalysedMove, playerName: string): string {
  const { classification, san, isBestMove, engineBefore, engineAfter, isCapture, isCheck } = move;
  const wpBefore = winPercentage(engineBefore.score);
  const wpAfter = winPercentage(engineAfter.score);
  const isWhite = move.ply % 2 === 1;
  const cpLoss = Math.round(Math.abs(move.cpLoss));

  const bestSan = engineBefore.bestMoveSan ?? engineBefore.bestMove;

  // Situation flavours
  const isWinning = (isWhite ? wpBefore : 100 - wpBefore) > 70;
  const isLosing = (isWhite ? wpBefore : 100 - wpBefore) < 30;
  const isEqual = Math.abs(wpBefore - 50) < 10;

  switch (classification) {
    case 'brilliant':
      return `Brilliant! ${san} is a spectacular find — a sacrifice that seizes the initiative and puts ${playerName} firmly in control. Engines applaud this.`;

    case 'great':
      return `Great move! ${san} is sharp and precise.${isCapture ? ' The capture is well-timed.' : ''} ${playerName} demonstrates excellent tactical vision here.`;

    case 'best':
      if (isBestMove) {
        if (isLosing)
          return `${san} is the best try in a tough position. ${playerName} is fighting hard — this keeps practical chances alive.`;
        if (isWinning)
          return `${san} maintains the advantage perfectly. ${playerName} is converting the winning position efficiently.`;
        return `${san} is the engine's top choice. Accurate and purposeful.${isCheck ? ' The check adds pressure.' : ''}`;
      }
      return `${san} is essentially as good as the engine's suggestion. No meaningful difference in evaluation.`;

    case 'excellent':
      return `${san} is an excellent move. Only marginally behind the engine's first choice, and entirely consistent with good chess principles.`;

    case 'good':
      if (isEqual)
        return `${san} is a solid, practical choice in this balanced position. Keeps the game competitive.`;
      return `${san} is a reasonable continuation. Slightly suboptimal compared to ${bestSan}, but nothing serious.`;

    case 'inaccuracy':
      return `${san} is a small inaccuracy. ${bestSan ? `The engine preferred ${bestSan}` : 'A more precise move was available'}${cpLoss > 0 ? ` — roughly ${cpLoss} centipawns lost` : ''}. Worth reviewing in the opening/middlegame phase.`;

    case 'mistake':
      return `${san} is a mistake. This gives away a clear edge — the engine suggests ${bestSan ?? 'a different move'} instead. ${isWinning ? 'From a winning position, this lets the opponent back in.' : isLosing ? 'In a difficult position this makes things harder.' : 'In a balanced game, this tips the scales against ' + playerName + '.'}`;

    case 'blunder':
      if (isLosing)
        return `${san} blunders in an already difficult position. ${bestSan ? `${bestSan} was the best try to stay in the game.` : 'The position was already very hard but this makes it critical.'}`;
      if (isWinning)
        return `A major blunder! ${san} throws away a winning advantage in just one move. ${bestSan ? `${bestSan} would have maintained control.` : ''} This is the move to study most carefully.`;
      return `${san} is a blunder — this swings the evaluation significantly. ${bestSan ? `${bestSan} was necessary.` : ''} The position now strongly favours the opponent.`;

    case 'miss':
      return `${san} misses a powerful opportunity. ${bestSan ? `${bestSan} would have been far stronger.` : ''} Easy to overlook in time pressure.`;

    case 'forced':
      return `${san} is essentially the only move in this position — ${playerName} had no better option available.`;

    default:
      return `${san} continues the game.`;
  }
}

function PrincipalVariation({ pv }: { pv?: string[] }) {
  if (!pv || pv.length === 0) return null;
  return (
    <div className={styles.pvLine}>
      <span className={styles.pvLabel}>Engine line:</span>
      <span className={styles.pvMoves}>{pv.slice(0, 5).join(' ')}</span>
    </div>
  );
}

export default function CoachReview({ move, game, moveIndex }: CoachReviewProps) {
  const isWhite = move ? move.ply % 2 === 1 : false;
  const playerName = isWhite ? game.white.username : game.black.username;
  const moveNumber = move ? Math.ceil(move.ply / 2) : 0;
  const halfMove = isWhite ? '' : '...';

  const comment = useMemo(
    () => (move ? generateCoachComment(move, playerName) : null),
    [move, playerName]
  );

  if (!move || moveIndex === -1) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎓</span>
          <p className={styles.emptyText}>Navigate to a move to get coach feedback</p>
        </div>
      </div>
    );
  }

  const color = CLASSIFICATION_COLORS[move.classification];
  const symbol = CLASSIFICATION_SYMBOLS[move.classification];
  const label = CLASSIFICATION_LABELS[move.classification];
  const wpAfter = Math.round(winPercentage(move.engineAfter.score));
  const wpWhite = wpAfter;
  const wpBlack = 100 - wpAfter;

  return (
    <div className={styles.container}>
      {/* Coach header */}
      <div className={styles.header}>
        <div className={styles.coachBadge}>🎓 Coach Review</div>
        <div className={styles.movePill} style={{ borderColor: `${color}55`, background: `${color}11` }}>
          <span className={styles.moveNum}>{moveNumber}{halfMove}.</span>
          <span className={styles.moveSan}>{move.san}</span>
          {symbol && <span className={styles.moveSymbol} style={{ color }}>{symbol}</span>}
          <span className={styles.moveLabel} style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Comment */}
      <p className={styles.comment}>{comment}</p>

      {/* Win probability bar */}
      <div className={styles.winBar}>
        <span className={styles.winLabel} style={{ color: '#d4e8c8' }}>⬜ {wpWhite}%</span>
        <div className={styles.winBarTrack}>
          <div
            className={styles.winBarFill}
            style={{ width: `${wpWhite}%` }}
          />
        </div>
        <span className={styles.winLabel} style={{ color: '#6b7280' }}>⬛ {wpBlack}%</span>
      </div>

      {/* Best move hint (only show when not best) */}
      {!move.isBestMove && move.engineBefore.bestMove && (
        <div className={styles.bestMove}>
          <span className={styles.bestMoveLabel}>💡 Best was</span>
          <code className={styles.bestMoveSan}>
            {move.engineBefore.bestMoveSan ?? move.engineBefore.bestMove}
          </code>
        </div>
      )}

      {/* Principal variation */}
      <PrincipalVariation pv={move.engineBefore.pv?.map(String)} />
    </div>
  );
}
