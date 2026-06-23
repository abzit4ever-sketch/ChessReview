'use client';

import React from 'react';
import { Chessboard } from 'react-chessboard';
import { AnalysedMove } from '@/lib/types';
import { CLASSIFICATION_COLORS } from '@/lib/moveClassifier';
import type { Arrow } from 'react-chessboard';
import styles from './ChessBoard.module.css';

interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  currentMove?: AnalysedMove | null;
  size?: number;
}

export default function ChessBoard({
  fen,
  orientation = 'white',
  currentMove,
  size,
}: ChessBoardProps) {
  // Best-move arrow
  const arrows: Arrow[] = React.useMemo(() => {
    if (!currentMove?.engineBefore?.bestMove) return [];
    const bm = currentMove.engineBefore.bestMove;
    if (bm.length < 4) return [];
    return [
      {
        startSquare: bm.slice(0, 2),
        endSquare: bm.slice(2, 4),
        color: 'rgba(0, 160, 255, 0.65)',
      },
    ];
  }, [currentMove?.engineBefore?.bestMove]);

  // Highlight from/to squares of the last move
  const squareStyles = React.useMemo<Record<string, React.CSSProperties>>(() => {
    if (!currentMove) return {};
    const color = CLASSIFICATION_COLORS[currentMove.classification];
    const from = currentMove.uci.slice(0, 2);
    const to = currentMove.uci.slice(2, 4);

    return {
      [from]: {
        backgroundColor: `${color}33`,
        boxShadow: `inset 0 0 0 2px ${color}66`,
      },
      [to]: {
        backgroundColor: `${color}55`,
        boxShadow: `inset 0 0 0 2px ${color}99`,
      },
    };
  }, [currentMove]);

  return (
    <div className={styles.wrapper} style={size ? { width: size, height: size } : {}}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          arrows,
          squareStyles,
          allowDragging: false,
          allowDrawingArrows: false,
          showAnimations: true,
          animationDurationInMs: 200,
          showNotation: true,
          darkSquareStyle: { backgroundColor: '#b58863' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
          darkSquareNotationStyle: { color: 'rgba(120,70,30,0.55)', fontSize: '10px' },
          lightSquareNotationStyle: { color: 'rgba(181,136,99,0.55)', fontSize: '10px' },
          boardStyle: {
            borderRadius: '6px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          },
        }}
      />

      {/* Classification badge overlay */}
      {currentMove && (
        <div className={styles.badge} style={{ '--badge-color': CLASSIFICATION_COLORS[currentMove.classification] } as React.CSSProperties}>
          <span className={styles.badgeLabel}>
            {currentMove.classification.charAt(0).toUpperCase() + currentMove.classification.slice(1)}
          </span>
          <span className={styles.badgeCp}>
            {currentMove.cpLoss === 0 ? '±0' : `−${currentMove.cpLoss}`} cp
          </span>
        </div>
      )}
    </div>
  );
}
