'use client';

import React from 'react';
import { GameData } from '@/lib/types';
import { AnalysisResult } from '@/lib/types';
import styles from './GameHeader.module.css';

interface GameHeaderProps {
  game: GameData;
  analysis: AnalysisResult | null;
}

function AccuracyPill({ value, label }: { value: number; label: string }) {
  const color =
    value >= 90 ? '#96bc4b' :
    value >= 75 ? '#7fa650' :
    value >= 60 ? '#f0a45d' :
    '#ca3431';

  return (
    <div className={styles.accuracyPill}>
      <div className={styles.accuracyRing} style={{ '--color': color } as React.CSSProperties}>
        <span className={styles.accuracyValue} style={{ color }}>{value}%</span>
      </div>
      <span className={styles.accuracyLabel}>{label}</span>
    </div>
  );
}

function ratingColor(r?: number) {
  if (!r) return '#4a5568';
  if (r >= 2000) return '#f0a45d'; // expert/master
  if (r >= 1500) return '#7fba54'; // intermediate
  if (r >= 1200) return '#5a8bb0'; // beginner-intermediate
  return '#4a5568';
}

function PlayerRow({
  username, rating, result, accuracy, isWhite,
}: {
  username: string;
  rating?: number;
  result: 'win' | 'lose' | 'draw';
  accuracy?: number;
  isWhite: boolean;
}) {
  const resultIcon = result === 'win' ? '🏆' : result === 'draw' ? '½' : '✗';
  const resultColor = result === 'win' ? '#96bc4b' : result === 'draw' ? '#f0a45d' : '#ca3431';
  const rColor = ratingColor(rating);

  return (
    <div className={styles.playerRow}>
      <div className={`${styles.pieceIcon} ${isWhite ? styles.whitePiece : styles.blackPiece}`}>♛</div>
      <div className={styles.playerInfo}>
        <span className={styles.playerName}>{username}</span>
        {rating && (
          <span
            className={styles.ratingBadge}
            style={{ color: rColor, borderColor: `${rColor}44`, background: `${rColor}11` }}
          >
            {rating}
          </span>
        )}
      </div>
      <div className={styles.playerRight}>
        {accuracy !== undefined && (
          <span className={styles.accuracy} style={{ color: accuracy >= 80 ? '#96bc4b' : accuracy >= 60 ? '#f0a45d' : '#ca3431' }}>
            {accuracy}%
          </span>
        )}
        <span className={styles.result} style={{ color: resultColor }}>{resultIcon}</span>
      </div>
    </div>
  );
}

export default function GameHeader({ game, analysis }: GameHeaderProps) {
  const resultText =
    game.result === '1-0' ? 'White wins' :
    game.result === '0-1' ? 'Black wins' :
    game.result === '1/2-1/2' ? 'Draw' : 'Game in progress';

  const opening = analysis?.opening ?? game.opening;

  return (
    <div className={styles.container}>
      {/* Players */}
      <PlayerRow
        username={game.white.username}
        rating={game.white.rating}
        result={game.white.result}
        accuracy={analysis?.whiteAccuracy}
        isWhite
      />
      <div className={styles.divider}>
        <span className={styles.resultText}>{resultText}</span>
        <span className={styles.timeControl}>{game.timeControl}</span>
        <span className={styles.date}>{game.date}</span>
      </div>
      <PlayerRow
        username={game.black.username}
        rating={game.black.rating}
        result={game.black.result}
        accuracy={analysis?.blackAccuracy}
        isWhite={false}
      />

      {/* Opening */}
      {opening && (
        <div className={styles.opening}>
          <span className={styles.openingIcon}>♟</span>
          <span className={styles.openingName}>{opening}</span>
        </div>
      )}

      {/* Accuracy summary */}
      {analysis && (
        <div className={styles.accuracyRow}>
          <AccuracyPill value={analysis.whiteAccuracy} label={game.white.username} />
          <div className={styles.accuracySep}>vs</div>
          <AccuracyPill value={analysis.blackAccuracy} label={game.black.username} />
        </div>
      )}
    </div>
  );
}
