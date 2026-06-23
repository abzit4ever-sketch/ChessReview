'use client';

import React, { useMemo, useState } from 'react';
import { AnalysedMove } from '@/lib/types';
import { winPercentage } from '@/lib/accuracyCalc';
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_SYMBOLS,
} from '@/lib/moveClassifier';
import styles from './AccuracyGraph.module.css';

interface AccuracyGraphProps {
  moves: AnalysedMove[];
  currentIndex: number;
  onSeek?: (index: number) => void;
}

const WIDTH = 500;
const HEIGHT = 90;
const PAD_X = 8;
const PAD_Y = 6;
const DOT_RADIUS = 5;

// Only show badges for notable moves, not best/excellent/good
const SHOW_BADGE_FOR = new Set(['brilliant', 'great', 'inaccuracy', 'mistake', 'blunder', 'miss']);

export default function AccuracyGraph({ moves, currentIndex, onSeek }: AccuracyGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = useMemo(() => {
    const pts: Array<{ x: number; y: number; idx: number }> = [
      { x: PAD_X, y: HEIGHT / 2, idx: -1 },
    ];
    const total = moves.length;
    moves.forEach((m, i) => {
      const wp = winPercentage(m.engineAfter.score);
      const x = PAD_X + ((i + 1) / (total + 1)) * (WIDTH - PAD_X * 2) + PAD_X;
      const y = PAD_Y + (1 - wp / 100) * (HEIGHT - PAD_Y * 2);
      pts.push({ x, y, idx: i });
    });
    if (moves.length > 0) {
      pts.push({ x: WIDTH - PAD_X, y: pts[pts.length - 1].y, idx: moves.length - 1 });
    }
    return pts;
  }, [moves]);

  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      d += ` C ${cx} ${points[i - 1].y} ${cx} ${points[i].y} ${points[i].x} ${points[i].y}`;
    }
    return d;
  }, [points]);

  const whiteArea = useMemo(() => {
    if (points.length < 2) return '';
    const mid = HEIGHT / 2;
    let d = `M ${points[0].x} ${mid}`;
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      d += ` C ${cx} ${points[i - 1].y} ${cx} ${points[i].y} ${points[i].x} ${points[i].y}`;
    }
    d += ` L ${points[points.length - 1].x} ${mid} Z`;
    return d;
  }, [points]);

  const blackArea = useMemo(() => {
    if (points.length < 2) return '';
    const mid = HEIGHT / 2;
    let d = `M ${points[0].x} ${mid}`;
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      d += ` C ${cx} ${points[i - 1].y} ${cx} ${points[i].y} ${points[i].x} ${points[i].y}`;
    }
    d += ` L ${points[points.length - 1].x} ${mid}`;
    d += ` L ${points[points.length - 1].x} 0 L ${points[0].x} 0 Z`;
    return d;
  }, [points]);

  const currentX = useMemo(() => {
    if (currentIndex === -1) return PAD_X;
    const p = points.find((p) => p.idx === currentIndex);
    return p ? p.x : PAD_X;
  }, [currentIndex, points]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeek || moves.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = -1;
    let minDist = Infinity;
    points.forEach((p) => {
      if (p.idx === -1) return;
      const d = Math.abs(p.x - relX);
      if (d < minDist) { minDist = d; closest = p.idx; }
    });
    if (closest >= 0) onSeek(closest);
  };

  if (moves.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>Eval graph will appear after analysis</div>
      </div>
    );
  }

  const hoveredMove = hoveredIndex !== null ? moves[hoveredIndex] : null;
  const hoveredPoint = hoveredIndex !== null ? points.find(p => p.idx === hoveredIndex) : null;

  return (
    <div className={styles.container}>
      {/* Tooltip */}
      {hoveredMove && hoveredPoint && (
        <div
          className={styles.tooltip}
          style={{
            left: `${(hoveredPoint.x / WIDTH) * 100}%`,
            borderColor: CLASSIFICATION_COLORS[hoveredMove.classification],
          }}
        >
          <span className={styles.tooltipMove}>{hoveredMove.san}</span>
          <span
            className={styles.tooltipLabel}
            style={{ color: CLASSIFICATION_COLORS[hoveredMove.classification] }}
          >
            {CLASSIFICATION_SYMBOLS[hoveredMove.classification]
              ? `${CLASSIFICATION_SYMBOLS[hoveredMove.classification]} `
              : ''}
            {CLASSIFICATION_LABELS[hoveredMove.classification]}
          </span>
          <span className={styles.tooltipPly}>
            {Math.floor(hoveredMove.ply / 2) + (hoveredMove.ply % 2 === 1 ? 1 : 0)}.
            {hoveredMove.ply % 2 === 0 ? '..' : ''}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.svg}
        onClick={handleSvgClick}
        style={{ cursor: onSeek ? 'crosshair' : 'default' }}
      >
        <defs>
          <clipPath id="white-clip-ag">
            <rect x="0" y={HEIGHT / 2} width={WIDTH} height={HEIGHT / 2} />
          </clipPath>
          <clipPath id="black-clip-ag">
            <rect x="0" y="0" width={WIDTH} height={HEIGHT / 2} />
          </clipPath>
        </defs>

        {/* White territory */}
        <path d={whiteArea} fill="rgba(240,237,224,0.12)" clipPath="url(#white-clip-ag)" />
        {/* Black territory */}
        <path d={blackArea} fill="rgba(0,0,0,0.22)" clipPath="url(#black-clip-ag)" />
        {/* Midline */}
        <line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Eval curve */}
        <path d={pathD} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

        {/* Move markers — show ALL moves, highlight notable ones */}
        {moves.map((m, i) => {
          const p = points.find((pt) => pt.idx === i);
          if (!p) return null;
          const color = CLASSIFICATION_COLORS[m.classification];
          const isSelected = currentIndex === i;
          const isHovered = hoveredIndex === i;
          const isNotable = SHOW_BADGE_FOR.has(m.classification);
          const symbol = CLASSIFICATION_SYMBOLS[m.classification];

          return (
            <g
              key={i}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSeek?.(i);
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible hit area */}
              <circle cx={p.x} cy={p.y} r={8} fill="transparent" />

              {isNotable || isSelected || isHovered ? (
                <>
                  {/* Glow for blunders/mistakes */}
                  {(m.classification === 'blunder' || m.classification === 'mistake') && (
                    <circle
                      cx={p.x} cy={p.y}
                      r={DOT_RADIUS + 4}
                      fill={`${color}22`}
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? DOT_RADIUS + 1 : DOT_RADIUS}
                    fill={isSelected ? color : `${color}cc`}
                    stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.6)'}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  {/* Badge symbol for notable moves */}
                  {symbol && (
                    <text
                      x={p.x}
                      y={p.y - DOT_RADIUS - 3}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill={color}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {symbol}
                    </text>
                  )}
                </>
              ) : (
                /* Small dot for normal moves */
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={2}
                  fill={isHovered ? color : 'rgba(255,255,255,0.15)'}
                />
              )}
            </g>
          );
        })}

        {/* Current position indicator line */}
        <line
          x1={currentX} y1={0}
          x2={currentX} y2={HEIGHT}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
      </svg>

      {/* Move index ruler */}
      <div className={styles.ruler}>
        <span className={styles.rulerLabel}>1</span>
        <span className={styles.rulerLabel} style={{ textAlign: 'center' }}>
          Move {currentIndex >= 0 ? Math.ceil((currentIndex + 1) / 2) : 0}
        </span>
        <span className={styles.rulerLabel} style={{ textAlign: 'right' }}>
          {Math.ceil(moves.length / 2)}
        </span>
      </div>
    </div>
  );
}
