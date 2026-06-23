'use client';

import React from 'react';
import { winPercentage, formatScore } from '@/lib/accuracyCalc';
import styles from './EvalBar.module.css';

interface EvalBarProps {
  score: number;
  isMate?: boolean;
  mateIn?: number;
  orientation?: 'white' | 'black';
}

export default function EvalBar({ score, isMate, mateIn, orientation = 'white' }: EvalBarProps) {
  // Clamp score display
  const clampedScore = Math.max(-1500, Math.min(1500, score));
  const whitePct = winPercentage(clampedScore);
  const blackPct = 100 - whitePct;

  // If oriented from black's perspective, flip
  const topPct = orientation === 'white' ? blackPct : whitePct;
  const botPct = orientation === 'white' ? whitePct : blackPct;

  // Choose which colour dominates
  const whiteWinning = score >= 0;
  const scoreStr = formatScore(score, isMate, mateIn);

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        {/* Black section (top) */}
        <div
          className={styles.black}
          style={{ height: `${topPct}%`, transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* White section (bottom) */}
        <div
          className={styles.white}
          style={{ height: `${botPct}%`, transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </div>
      {/* Score label */}
      <div
        className={`${styles.label} ${whiteWinning ? styles.labelLight : styles.labelDark}`}
        style={{ bottom: whiteWinning ? 'auto' : '4px', top: whiteWinning ? '4px' : 'auto' }}
      >
        {scoreStr}
      </div>
    </div>
  );
}
