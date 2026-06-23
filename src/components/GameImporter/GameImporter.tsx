'use client';

import React, { useState } from 'react';
import { GameData } from '@/lib/types';
import { fetchChessComGames } from '@/lib/chesscom';
import { fetchLichessGames } from '@/lib/lichess';
import styles from './GameImporter.module.css';

type Platform = 'chesscom' | 'lichess';

interface GameImporterProps {
  onGameSelect: (game: GameData) => void;
}

function GameCard({ game, onClick }: { game: GameData; onClick: () => void }) {
  const isWhiteWin = game.result === '1-0';
  const isBlackWin = game.result === '0-1';
  const isDraw = game.result === '1/2-1/2';
  const moveCount = Math.ceil(game.moves.length / 2);

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.cardPlayers}>
        <div className={`${styles.playerChip} ${isWhiteWin ? styles.winner : ''}`}>
          <span className={styles.chipColor}>♔</span>
          <span className={styles.chipName}>{game.white.username}</span>
          {game.white.rating && <span className={styles.chipRating}>{game.white.rating}</span>}
        </div>
        <div className={styles.resultChip} style={{
          color: isDraw ? '#f0a45d' : isWhiteWin ? '#96bc4b' : '#ca3431',
        }}>
          {isDraw ? '½-½' : isWhiteWin ? '1-0' : '0-1'}
        </div>
        <div className={`${styles.playerChip} ${isBlackWin ? styles.winner : ''}`}>
          <span className={styles.chipColor}>♚</span>
          <span className={styles.chipName}>{game.black.username}</span>
          {game.black.rating && <span className={styles.chipRating}>{game.black.rating}</span>}
        </div>
      </div>
      <div className={styles.cardMeta}>
        {game.opening && <span className={styles.cardOpening}>{game.opening}</span>}
        <span className={styles.cardInfo}>{game.timeControl} · {moveCount} moves · {game.date}</span>
      </div>
    </button>
  );
}

export default function GameImporter({ onGameSelect }: GameImporterProps) {
  const [platform, setPlatform] = useState<Platform>('chesscom');
  const [username, setUsername] = useState('');
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setGames([]);

    try {
      const result =
        platform === 'chesscom'
          ? await fetchChessComGames(trimmed, 10)
          : await fetchLichessGames(trimmed, 10);
      setGames(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFetch();
  };

  return (
    <div className={styles.container}>
      {/* Platform selector */}
      <div className={styles.platforms}>
        <button
          id="platform-chesscom"
          className={`${styles.platformBtn} ${platform === 'chesscom' ? styles.active : ''}`}
          onClick={() => { setPlatform('chesscom'); setGames([]); setError(null); }}
        >
          <span className={styles.platformIcon}>♛</span>
          chess.com
        </button>
        <button
          id="platform-lichess"
          className={`${styles.platformBtn} ${platform === 'lichess' ? styles.active : ''}`}
          onClick={() => { setPlatform('lichess'); setGames([]); setError(null); }}
        >
          <span className={styles.platformIcon}>♞</span>
          lichess
        </button>
      </div>

      {/* Username input */}
      <div className={styles.inputRow}>
        <input
          id="username-input"
          type="text"
          className={styles.input}
          placeholder={`Enter ${platform === 'chesscom' ? 'Chess.com' : 'Lichess'} username…`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          id="fetch-games-btn"
          className={styles.fetchBtn}
          onClick={handleFetch}
          disabled={loading || !username.trim()}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            'Load Games →'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Games list */}
      {games.length > 0 && (
        <div className={styles.gamesList}>
          <p className={styles.gamesCount}>
            {games.length} recent game{games.length !== 1 ? 's' : ''} — click to analyse
          </p>
          <div className={styles.gamesGrid}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} onClick={() => onGameSelect(game)} />
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className={styles.skeletonWrap}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}
