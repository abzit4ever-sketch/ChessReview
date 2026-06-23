'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { GameData } from '@/lib/types';
import { useGameAnalysis } from '@/hooks/useGameAnalysis';
import { useGameNavigation } from '@/hooks/useGameNavigation';
import { CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from '@/lib/moveClassifier';
import { formatScore } from '@/lib/accuracyCalc';
import styles from './page.module.css';

// Dynamic imports for components that use browser APIs
const ChessBoard = dynamic(() => import('@/components/ChessBoard/ChessBoard'), { ssr: false });
const EvalBar = dynamic(() => import('@/components/EvalBar/EvalBar'), { ssr: false });
const MoveList = dynamic(() => import('@/components/MoveList/MoveList'), { ssr: false });
const AccuracyGraph = dynamic(() => import('@/components/AccuracyGraph/AccuracyGraph'), { ssr: false });
const GameHeader = dynamic(() => import('@/components/GameHeader/GameHeader'), { ssr: false });
const CoachReview = dynamic(() => import('@/components/CoachReview/CoachReview'), { ssr: false });

export default function AnalysePage() {
  const router = useRouter();
  const [game, setGame] = useState<GameData | null>(null);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const { analyseGame, cancelAnalysis, isAnalysing, progress, result, isReady } = useGameAnalysis();

  const analysedMoves = result?.moves ?? [];
  const {
    currentIndex, currentFen, currentMove,
    goToStart, goToEnd, goBack, goForward, goToMove,
    isAtStart, isAtEnd,
  } = useGameNavigation(analysedMoves);

  // Load game from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('chess-selected-game');
      if (!raw) { router.push('/'); return; }
      setGame(JSON.parse(raw) as GameData);
    } catch {
      router.push('/');
    }
  }, [router]);

  // Auto-start analysis when engine is ready and game is loaded
  useEffect(() => {
    if (game && isReady && !result && !isAnalysing) {
      analyseGame(game, 500); // 500ms per position — fast & accurate on WASM
    }
  }, [game, isReady, result, isAnalysing, analyseGame]);

  // Determine current eval score
  const currentEval = currentMove
    ? currentMove.engineAfter
    : (result?.moves[0]?.engineBefore ?? { score: 0, bestMove: '', depth: 0 });

  const evalScore = currentEval?.score ?? 0;
  const isMate = currentEval?.isMate;
  const mateIn = currentEval?.mateIn;

  if (!game) return null;

  return (
    <div className={styles.page}>
      {/* ── Top bar ──────────────────────────────────────── */}
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← Back
        </button>
        <div className={styles.topbarCenter}>
          <div className={styles.topbarBrand}>
            <Image
              src="/logo.png"
              alt="ChessReview"
              width={28}
              height={28}
              className={styles.topbarLogoImg}
            />
            <span className={styles.topbarTitle}>Chess<span className={styles.topbarAccent}>Review</span></span>
          </div>
          {result && (
            <span className={styles.openingTag}>{result.opening ?? game.opening ?? ''}</span>
          )}
        </div>
        <div className={styles.topbarRight}>
          {isAnalysing ? (
            <div className={styles.progress}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              <span className={styles.progressText}>Analysing… {progress}%</span>
            </div>
          ) : (
            result && (
              <span className={styles.doneBadge}>✓ Analysis complete</span>
            )
          )}
          <span className={styles.engineLabel}>⚡ SF18</span>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────── */}
      <div className={styles.layout}>
        {/* Left: board + eval bar + controls */}
        <div className={styles.boardCol}>
          <div className={styles.boardArea}>
            {/* Eval bar */}
            <div className={styles.evalBarWrap}>
              <EvalBar
                score={evalScore}
                isMate={isMate}
                mateIn={mateIn}
                orientation={orientation}
              />
            </div>

            {/* Board */}
            <div className={styles.boardWrap}>
              <ChessBoard
                fen={currentFen}
                orientation={orientation}
                currentMove={currentMove ?? undefined}
              />
            </div>
          </div>

          {/* Score display */}
          <div className={styles.scoreRow}>
            <span className={styles.evalText} style={{
              color: evalScore >= 0 ? '#d4e8c8' : '#e8c8c8',
            }}>
              {formatScore(evalScore, isMate, mateIn)}
            </span>
            {currentMove && (
              <span className={styles.classificationTag} style={{
                color: CLASSIFICATION_COLORS[currentMove.classification],
                borderColor: `${CLASSIFICATION_COLORS[currentMove.classification]}44`,
              }}>
                {CLASSIFICATION_LABELS[currentMove.classification]}
              </span>
            )}
          </div>

          {/* Navigation controls */}
          <div className={styles.controls}>
            <button
              id="nav-start"
              className={styles.navBtn}
              onClick={goToStart}
              disabled={isAtStart}
              title="Go to start (↑)"
            >⏮</button>
            <button
              id="nav-back"
              className={styles.navBtn}
              onClick={goBack}
              disabled={isAtStart}
              title="Previous move (←)"
            >◀</button>
            <button
              id="flip-board"
              className={styles.flipBtn}
              onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
              title="Flip board"
            >⇅</button>
            <button
              id="nav-forward"
              className={styles.navBtn}
              onClick={goForward}
              disabled={isAtEnd || analysedMoves.length === 0}
              title="Next move (→)"
            >▶</button>
            <button
              id="nav-end"
              className={styles.navBtn}
              onClick={goToEnd}
              disabled={isAtEnd || analysedMoves.length === 0}
              title="Go to end (↓)"
            >⏭</button>
          </div>

          {/* Keyboard hint */}
          <p className={styles.keyHint}>← → Arrow keys to navigate</p>

          {/* Best move hint */}
          {currentMove?.engineBefore?.bestMove && !currentMove.isBestMove && (
            <div className={styles.bestMoveHint}>
              <span>Best was</span>
              <strong>{currentMove.engineBefore.bestMoveSan ?? currentMove.engineBefore.bestMove}</strong>
            </div>
          )}
        </div>

        {/* Right: game info + moves + graph */}
        <div className={styles.sideCol}>
          {/* Game header (players + accuracy) */}
          <GameHeader game={game} analysis={result} />

          {/* Analysis progress or move list */}
          {isAnalysing ? (
            <div className={styles.analysingPanel}>
              <div className={styles.analysingSpinner} />
              <p className={styles.analysingText}>Running Stockfish 18 analysis…</p>
              <p className={styles.analysingSubtext}>Depth 18 · {game.moves.length} positions</p>
              <div className={styles.analysingBar}>
                <div className={styles.analysingFill} style={{ width: `${progress}%` }} />
              </div>
              <button className={styles.cancelBtn} onClick={cancelAnalysis}>Cancel</button>
            </div>
          ) : (
            <>
              <MoveList
                moves={analysedMoves}
                currentIndex={currentIndex}
                onMoveClick={goToMove}
              />
              {result && (
                <CoachReview
                  move={currentMove ?? null}
                  game={game}
                  moveIndex={currentIndex}
                />
              )}
            </>
          )}

          {/* Classification summary */}
          {result && (
            <div className={styles.summarySection}>
              <AccuracyGraph
                moves={analysedMoves}
                currentIndex={currentIndex}
                onSeek={goToMove}
              />
              <ClassificationSummary result={result} game={game} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Classification count summary
function ClassificationSummary({ result, game }: { result: import('@/lib/types').AnalysisResult; game: GameData }) {
  const { white: wc, black: bc } = result.classificationCounts;
  const classifications: Array<keyof typeof wc> = ['brilliant', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'];

  return (
    <div className={styles.classificationGrid}>
      <div className={styles.classificationHeader}>
        <span>{game.white.username}</span>
        <span>Move</span>
        <span>{game.black.username}</span>
      </div>
      {classifications.map((c) => {
        const color = CLASSIFICATION_COLORS[c];
        const wVal = wc[c];
        const bVal = bc[c];
        if (wVal === 0 && bVal === 0) return null;
        return (
          <div key={c} className={styles.classificationRow}>
            <span className={styles.countCell} style={{ color: wVal > 0 ? color : '#2d3a4a' }}>{wVal || '—'}</span>
            <span className={styles.classLabel} style={{ color }}>{CLASSIFICATION_LABELS[c]}</span>
            <span className={styles.countCell} style={{ color: bVal > 0 ? color : '#2d3a4a' }}>{bVal || '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
