'use client';

import { useState, useCallback, useRef } from 'react';
import { useStockfish } from './useStockfish';
import {
  AnalysedMove, AnalysisResult, GameData, MoveClassification,
} from '@/lib/types';
import { classifyMove } from '@/lib/moveClassifier';
import { winPercentage, moveAccuracy, gameAccuracy } from '@/lib/accuracyCalc';
import { lookupOpening } from '@/lib/ecoOpenings';
import { Chess } from 'chess.js';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function makeEmptyCounts(): Record<MoveClassification, number> {
  return {
    brilliant: 0, great: 0, best: 0, excellent: 0, good: 0,
    inaccuracy: 0, mistake: 0, blunder: 0, miss: 0, forced: 0,
  };
}

/**
 * Determine if it is black to move from the FEN string.
 * FEN format: <pieces> <side> <castling> <ep> <halfmove> <fullmove>
 */
function isBlackToMove(fen: string): boolean {
  return fen.split(' ')[1] === 'b';
}

export function useGameAnalysis() {
  const { analysePosition, stopAnalysis, isReady } = useStockfish();
  const [isAnalysing, setIsAnalysing]  = useState(false);
  const [progress,    setProgress]     = useState(0);
  const [result,      setResult]       = useState<AnalysisResult | null>(null);
  const cancelledRef = useRef(false);

  const analyseGame = useCallback(
    async (game: GameData, movetime = 500) => {
      if (!isReady || isAnalysing) return;

      cancelledRef.current = false;
      setIsAnalysing(true);
      setProgress(0);
      setResult(null);

      const moves = game.moves;

      // All positions: starting FEN + one FEN after each move
      const positions: string[] = [START_FEN, ...moves.map(m => m.fenAfter)];

      // ── Step 1: Evaluate every position ─────────────────────────────
      // Stockfish score is ALWAYS from the side-to-move's perspective.
      // We immediately convert to white-relative by negating when black to move.
      const evals: {
        score: number;   // WHITE-RELATIVE centipawn score
        bestMove: string;
        isMate?: boolean;
        mateIn?: number;
      }[] = [];

      for (let i = 0; i < positions.length; i++) {
        if (cancelledRef.current) break;

        const eng = await analysePosition(positions[i], movetime);

        // ★ KEY FIX: negate score when black is to move, converting to white-relative
        const blackTurn     = isBlackToMove(positions[i]);
        const whiteRelScore = blackTurn ? -eng.score : eng.score;
        // Also negate mate signs
        const whiteRelMateIn = (eng.isMate && eng.mateIn !== undefined)
          ? (blackTurn ? -eng.mateIn : eng.mateIn)
          : undefined;

        evals.push({
          score:    whiteRelScore,
          bestMove: eng.bestMove,
          isMate:   eng.isMate,
          mateIn:   whiteRelMateIn,
        });

        setProgress(Math.round(((i + 1) / positions.length) * 100));
      }

      if (cancelledRef.current) { setIsAnalysing(false); return; }

      // ── Step 2: Classify each move ───────────────────────────────────
      const analysedMoves: AnalysedMove[] = [];
      const whiteAcc: number[] = [];
      const blackAcc: number[] = [];
      const whiteC = makeEmptyCounts();
      const blackC = makeEmptyCounts();
      const uciMoveList: string[] = [];

      // Helper: convert UCI move to SAN
      const chess = new Chess();
      function uciToSan(fen: string, uci: string): string {
        try {
          chess.load(fen);
          const from  = uci.slice(0, 2) as `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'}`;
          const to    = uci.slice(2, 4) as `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'}`;
          const promo = uci[4] as 'q' | 'r' | 'b' | 'n' | undefined;
          return chess.move({ from, to, promotion: promo })?.san ?? uci;
        } catch { return uci; }
      }

      for (let i = 0; i < moves.length; i++) {
        if (cancelledRef.current) break;

        const move    = moves[i];
        const isWhite = move.ply % 2 === 1;

        // Both scores are now consistently WHITE-RELATIVE
        const evalBefore = evals[i].score;       // score BEFORE this move
        const evalAfter  = evals[i + 1]?.score ?? evalBefore; // score AFTER this move
        const bestMoveUCI = evals[i].bestMove;

        // ── Win-percentage change (player's perspective) ──────────────
        // White wants high white-relative score; black wants low.
        const prevWinPct = isWhite
          ? winPercentage(evalBefore)
          : winPercentage(-evalBefore);   // black's win% = white's loss%
        const nextWinPct = isWhite
          ? winPercentage(evalAfter)
          : winPercentage(-evalAfter);

        // Win% LOST by the player who moved (always ≥ 0 after clamping)
        const winPctLoss = Math.max(0, prevWinPct - nextWinPct);

        // Per-move accuracy (chess.com formula)
        const acc = moveAccuracy(prevWinPct, nextWinPct);

        // Best-move detection
        const playedBest = move.uci === bestMoveUCI || winPctLoss < 0.5;

        // Detect sacrifice: piece moves to a square not protected, dropping material
        const isSacrifice = !move.isCapture && move.uci === bestMoveUCI;

        const classification = classifyMove({
          winPctLoss,
          isBestMove:  playedBest,
          isSacrifice,
          evalBefore,
          evalAfter,
          isWhite,
        });

        const bestMoveSan = bestMoveUCI ? uciToSan(move.fen, bestMoveUCI) : undefined;

        uciMoveList.push(move.uci);
        analysedMoves.push({
          ...move,
          engineBefore: {
            score:       evalBefore,
            bestMove:    bestMoveUCI,
            bestMoveSan,
            depth:       evals[i].isMate ? 0 : 0,  // depth not tracked with movetime
            isMate:      evals[i].isMate,
            mateIn:      evals[i].mateIn,
          },
          engineAfter: {
            score:    evalAfter,
            bestMove: evals[i + 1]?.bestMove ?? '',
            depth:    0,
            isMate:   evals[i + 1]?.isMate,
            mateIn:   evals[i + 1]?.mateIn,
          },
          cpLoss:       Math.round(winPctLoss * 100) / 100, // store win% loss for display
          classification,
          accuracy:     acc,
          isBestMove:   playedBest,
        });

        if (isWhite) { whiteAcc.push(acc); whiteC[classification]++; }
        else         { blackAcc.push(acc); blackC[classification]++; }
      }

      const opening = lookupOpening(uciMoveList) ?? game.opening;

      setResult({
        moves:                analysedMoves,
        whiteAccuracy:        gameAccuracy(whiteAcc),
        blackAccuracy:        gameAccuracy(blackAcc),
        opening,
        classificationCounts: { white: whiteC, black: blackC },
      });
      setIsAnalysing(false);
    },
    [analysePosition, isReady, isAnalysing],
  );

  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
    stopAnalysis();
    setIsAnalysing(false);
  }, [stopAnalysis]);

  return { analyseGame, cancelAnalysis, isAnalysing, progress, result, isReady };
}
