'use client';

import React, { useRef, useEffect } from 'react';
import { AnalysedMove } from '@/lib/types';
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_SYMBOLS,
} from '@/lib/moveClassifier';
import styles from './MoveList.module.css';

interface MoveListProps {
  moves: AnalysedMove[];
  currentIndex: number;
  onMoveClick: (index: number) => void;
}

export default function MoveList({ moves, currentIndex, onMoveClick }: MoveListProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scroll active move into view
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      if (elBottom > container.scrollTop + container.clientHeight) {
        container.scrollTop = elBottom - container.clientHeight + 8;
      } else if (elTop < container.scrollTop) {
        container.scrollTop = elTop - 8;
      }
    }
  }, [currentIndex]);

  // Group moves into pairs for display
  const pairs: [AnalysedMove, AnalysedMove | null][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1] ?? null]);
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {pairs.length === 0 ? (
        <div className={styles.empty}>No moves yet</div>
      ) : (
        pairs.map(([white, black], pairIdx) => {
          const moveNum = pairIdx + 1;
          const whiteIdx = pairIdx * 2;
          const blackIdx = pairIdx * 2 + 1;

          return (
            <div key={pairIdx} className={styles.row}>
              {/* Move number */}
              <span className={styles.moveNum}>{moveNum}.</span>

              {/* White move */}
              <MoveButton
                move={white}
                isActive={currentIndex === whiteIdx}
                onClick={() => onMoveClick(whiteIdx)}
                ref={currentIndex === whiteIdx ? activeRef : null}
              />

              {/* Black move */}
              {black ? (
                <MoveButton
                  move={black}
                  isActive={currentIndex === blackIdx}
                  onClick={() => onMoveClick(blackIdx)}
                  ref={currentIndex === blackIdx ? activeRef : null}
                />
              ) : (
                <span className={styles.empty} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

interface MoveButtonProps {
  move: AnalysedMove;
  isActive: boolean;
  onClick: () => void;
}

const MoveButton = React.forwardRef<HTMLButtonElement, MoveButtonProps>(
  ({ move, isActive, onClick }, ref) => {
    const color = CLASSIFICATION_COLORS[move.classification];
    const symbol = CLASSIFICATION_SYMBOLS[move.classification];
    const label = CLASSIFICATION_LABELS[move.classification];

    return (
      <button
        ref={ref}
        onClick={onClick}
        title={`${label} (cp loss: ${move.cpLoss})`}
        className={`${styles.moveBtn} ${isActive ? styles.active : ''}`}
        style={isActive ? { background: `${color}22`, borderColor: color, color: '#e8edf3' } : {}}
      >
        {/* Classification dot */}
        <span className={styles.dot} style={{ background: color }} />

        {/* SAN + symbol */}
        <span className={styles.san}>{move.san}</span>
        {symbol && (
          <span className={styles.symbol} style={{ color }}>
            {symbol}
          </span>
        )}
      </button>
    );
  }
);
MoveButton.displayName = 'MoveButton';
