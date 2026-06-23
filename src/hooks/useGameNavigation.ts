'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnalysedMove } from '@/lib/types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function useGameNavigation(moves: AnalysedMove[]) {
  // -1 = starting position (before any move)
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Reset to start when moves change (new game selected)
  useEffect(() => {
    setCurrentIndex(-1);
  }, [moves]);

  const goToStart = useCallback(() => setCurrentIndex(-1), []);
  const goToEnd = useCallback(() => setCurrentIndex(moves.length - 1), [moves.length]);

  const goBack = useCallback(
    () => setCurrentIndex((i) => Math.max(-1, i - 1)),
    []
  );
  const goForward = useCallback(
    () => setCurrentIndex((i) => Math.min(moves.length - 1, i + 1)),
    [moves.length]
  );
  const goToMove = useCallback((index: number) => setCurrentIndex(index), []);

  const currentFen =
    currentIndex === -1 ? START_FEN : (moves[currentIndex]?.fenAfter ?? START_FEN);

  const currentMove = currentIndex >= 0 ? (moves[currentIndex] ?? null) : null;

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      // Don't hijack arrow keys in inputs
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); goBack();    break;
        case 'ArrowRight': e.preventDefault(); goForward(); break;
        case 'ArrowUp':    e.preventDefault(); goToStart(); break;
        case 'ArrowDown':  e.preventDefault(); goToEnd();   break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack, goForward, goToStart, goToEnd]);

  return {
    currentIndex,
    currentFen,
    currentMove,
    goToStart,
    goToEnd,
    goBack,
    goForward,
    goToMove,
    isAtStart: currentIndex === -1,
    isAtEnd: currentIndex === moves.length - 1,
  };
}
