export type GameSource = 'chesscom' | 'lichess';

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'miss'
  | 'forced';

export interface GamePlayer {
  username: string;
  rating?: number;
  result: 'win' | 'lose' | 'draw';
}

export interface ParsedMove {
  san: string;       // Standard algebraic notation e.g. "e4"
  uci: string;       // UCI notation e.g. "e2e4"
  fen: string;       // FEN before this move
  fenAfter: string;  // FEN after this move
  ply: number;       // Half-move number (1 = white's first, 2 = black's first, ...)
  isCapture: boolean;
  isCheck: boolean;
}

export interface GameData {
  id: string;
  source: GameSource;
  pgn: string;
  white: GamePlayer;
  black: GamePlayer;
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  date: string;
  timeControl: string;
  opening?: string;
  moves: ParsedMove[];
}

export interface EngineAnalysis {
  score: number;       // centipawns, white-relative (+ve = white winning)
  bestMove: string;    // UCI notation
  bestMoveSan?: string;
  depth: number;
  pv?: string[];       // principal variation (UCI)
  isMate?: boolean;
  mateIn?: number;     // positive = white mates, negative = black mates
}

export interface AnalysedMove extends ParsedMove {
  engineBefore: EngineAnalysis; // engine eval of position BEFORE this move
  engineAfter: EngineAnalysis;  // engine eval of position AFTER this move
  cpLoss: number;               // centipawn loss (always >= 0, 0 = perfect)
  classification: MoveClassification;
  accuracy: number;             // 0-100 accuracy for this move
  isBestMove: boolean;
}

export interface AnalysisResult {
  moves: AnalysedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  opening?: string;
  classificationCounts: {
    white: Record<MoveClassification, number>;
    black: Record<MoveClassification, number>;
  };
}
