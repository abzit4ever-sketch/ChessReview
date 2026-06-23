import { Chess } from 'chess.js';
import { ParsedMove } from './types';

export interface PGNData {
  headers: Record<string, string>;
  moves: ParsedMove[];
  result: string;
}

/**
 * Parse a single PGN string into structured data with FENs for each move.
 */
export function parsePGN(pgn: string): PGNData | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn.trim(), { strict: false });

    const headers: Record<string, string> = chess.header() as Record<string, string>;
    const result = headers['Result'] || '*';

    // Get the verbose history (includes from/to squares, flags)
    const history = chess.history({ verbose: true });

    // Replay from scratch to collect per-move FENs
    const replayChess = new Chess();
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const moves: ParsedMove[] = history.map((move, index) => {
      const fenBefore = replayChess.fen();
      replayChess.move(move.san);
      const fenAfter = replayChess.fen();

      // Build UCI notation (from + to + optional promotion piece)
      const uci = move.from + move.to + (move.promotion ?? '');

      // 'c' = regular capture, 'e' = en passant
      const isCapture = !!(move.flags && (move.flags.includes('c') || move.flags.includes('e')));
      const isCheck = move.san.includes('+') || move.san.includes('#');

      return {
        san: move.san,
        uci,
        fen: fenBefore,
        fenAfter,
        ply: index + 1, // 1 = white's first move
        isCapture,
        isCheck,
      };
    });

    return { headers, moves, result };
  } catch (err) {
    console.error('[pgnParser] Failed to parse PGN:', err);
    return null;
  }
}

/**
 * Split a PGN file containing multiple games into individual PGN strings.
 */
export function extractGamesFromPGN(pgn: string): string[] {
  const games: string[] = [];
  const lines = pgn.split('\n');
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith('[Event ') && current.length > 0) {
      const game = current.join('\n').trim();
      if (game) games.push(game);
      current = [];
    }
    current.push(line);
  }

  if (current.length > 0) {
    const game = current.join('\n').trim();
    if (game) games.push(game);
  }

  return games.filter(g => g.includes('[') && g.length > 20);
}
