'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { EngineAnalysis } from '@/lib/types';

type PendingResolve = (result: EngineAnalysis) => void;

export function useStockfish() {
  const workerRef   = useRef<Worker | null>(null);
  const pendingRef  = useRef<PendingResolve | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Accumulated best line for the current search
  const infoRef = useRef({
    score: 0,
    depth: 0,
    bestMove: '',
    pv: [] as string[],
    isMate: false,
    mateIn: 0,
  });

  useEffect(() => {
    const worker = new Worker('/stockfish.js');
    workerRef.current = worker;

    const resetInfo = () => {
      infoRef.current = { score: 0, depth: 0, bestMove: '', pv: [], isMate: false, mateIn: 0 };
    };

    worker.addEventListener('message', (e: MessageEvent<string>) => {
      const msg = typeof e.data === 'string' ? e.data : String(e.data);

      if (msg === 'uciok') { worker.postMessage('isready'); return; }
      if (msg === 'readyok') { setIsReady(true); return; }

      // Parse info lines — only keep the deepest complete pv line
      if (msg.startsWith('info') && msg.includes('depth') && !msg.includes('currmove')) {
        const depthMatch = msg.match(/\bdepth (\d+)/);
        const depth = depthMatch ? parseInt(depthMatch[1]) : 0;

        // Ignore low-depth lines to avoid noise
        if (depth < 1) return;

        const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          if (scoreMatch[1] === 'cp') {
            infoRef.current.score  = parseInt(scoreMatch[2]);
            infoRef.current.isMate = false;
          } else {
            const mateIn = parseInt(scoreMatch[2]);
            infoRef.current.isMate  = true;
            infoRef.current.mateIn  = mateIn;
            // Represent forced mate as a large centipawn value
            infoRef.current.score   = mateIn > 0 ? 30000 : -30000;
          }
          infoRef.current.depth = depth;
        }

        const pvMatch = msg.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?(?:\s[a-h][1-8][a-h][1-8][qrbn]?)*)/);
        if (pvMatch) {
          const moves = pvMatch[1].trim().split(/\s+/).filter(Boolean);
          infoRef.current.pv       = moves;
          infoRef.current.bestMove = moves[0] ?? infoRef.current.bestMove;
        }
        return;
      }

      // Engine finished — resolve the promise
      if (msg.startsWith('bestmove') && pendingRef.current) {
        const parts    = msg.split(/\s+/);
        const bestMove = (parts[1] && parts[1] !== '(none)')
          ? parts[1]
          : infoRef.current.bestMove;

        const result: EngineAnalysis = {
          score:    infoRef.current.score,
          bestMove,
          depth:    infoRef.current.depth,
          pv:       infoRef.current.pv,
          isMate:   infoRef.current.isMate,
          mateIn:   infoRef.current.isMate ? infoRef.current.mateIn : undefined,
        };

        const resolve      = pendingRef.current;
        pendingRef.current = null;
        resetInfo();
        resolve(result);
      }
    });

    // UCI handshake
    worker.postMessage('uci');
    worker.postMessage('setoption name Skill Level value 20');
    worker.postMessage('setoption name MultiPV value 1');
    worker.postMessage('setoption name Threads value 1');

    return () => {
      worker.postMessage('quit');
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Analyse a single position.
   *
   * @param fen       - the position FEN
   * @param movetime  - milliseconds budget (default 500ms → ~depth 12-16 on WASM)
   *
   * The returned score is FROM THE SIDE TO MOVE'S perspective (standard UCI).
   * Callers must negate when it is black to move to get white-relative values.
   */
  const analysePosition = useCallback(
    (fen: string, movetime = 500): Promise<EngineAnalysis> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) { resolve({ score: 0, bestMove: '', depth: 0 }); return; }

        // Cancel any ongoing search immediately
        if (pendingRef.current) {
          worker.postMessage('stop');
          pendingRef.current({ score: 0, bestMove: '', depth: 0 });
          pendingRef.current = null;
        }

        pendingRef.current = resolve;
        worker.postMessage('stop');
        worker.postMessage(`position fen ${fen}`);
        // Use movetime instead of fixed depth — far faster for WASM single-threaded
        worker.postMessage(`go movetime ${movetime}`);
      });
    },
    [],
  );

  const stopAnalysis = useCallback(() => {
    workerRef.current?.postMessage('stop');
    if (pendingRef.current) {
      pendingRef.current({ score: 0, bestMove: '', depth: 0 });
      pendingRef.current = null;
    }
  }, []);

  return { analysePosition, stopAnalysis, isReady };
}
