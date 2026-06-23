import { GameData, GamePlayer, GameSource } from './types';
import { parsePGN } from './pgnParser';

const CHESS_COM_API = 'https://api.chess.com/pub';
const HEADERS = {
  'User-Agent': 'ChessAnalyser/1.0 (browser); contact: open-source',
};

interface ChessComPlayerInfo {
  username: string;
  rating?: number;
  result: string;
}

interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: ChessComPlayerInfo;
  black: ChessComPlayerInfo;
}

function mapPlayerResult(result: string): 'win' | 'lose' | 'draw' {
  if (result === 'win') return 'win';
  const drawResults = ['agreed', 'stalemate', 'repetition', 'insufficient', '50move', 'timevsinsufficient'];
  if (drawResults.includes(result)) return 'draw';
  return 'lose';
}

function formatTimeControl(tc: string): string {
  if (!tc || tc === '-') return 'Unknown';
  if (tc.includes('+')) {
    const [base, inc] = tc.split('+');
    const mins = Math.floor(Number(base) / 60);
    return `${mins}+${inc}`;
  }
  const mins = Math.floor(Number(tc) / 60);
  const secs = Number(tc) % 60;
  return secs > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins} min`;
}

export async function fetchChessComGames(username: string, count: number = 10): Promise<GameData[]> {
  // 1. Get archives list
  const archivesRes = await fetch(`${CHESS_COM_API}/player/${username.toLowerCase()}/games/archives`, {
    headers: HEADERS,
  });
  
  if (archivesRes.status === 404) throw new Error(`User "${username}" not found on chess.com`);
  if (!archivesRes.ok) throw new Error(`chess.com API error: ${archivesRes.status}`);
  
  const { archives } = (await archivesRes.json()) as { archives: string[] };
  if (!archives || archives.length === 0) throw new Error('No games found for this user');

  const allGames: GameData[] = [];

  // 2. Fetch months from newest to oldest until we have enough
  for (let i = archives.length - 1; i >= 0 && allGames.length < count; i--) {
    const monthUrl = archives[i];
    
    let gamesInMonth: ChessComGame[];
    try {
      const res = await fetch(monthUrl, { headers: HEADERS });
      if (!res.ok) continue;
      const body = (await res.json()) as { games: ChessComGame[] };
      gamesInMonth = body.games ?? [];
    } catch {
      continue;
    }

    // Process from newest to oldest
    for (let j = gamesInMonth.length - 1; j >= 0 && allGames.length < count; j--) {
      const game = gamesInMonth[j];
      if (!game.pgn) continue;

      const parsed = parsePGN(game.pgn);
      if (!parsed || parsed.moves.length === 0) continue;

      const h = parsed.headers;
      const id = game.url.split('/').pop() || `${i}-${j}`;
      const date = h['Date'] || new Date(game.end_time * 1000).toISOString().split('T')[0];

      let result: '1-0' | '0-1' | '1/2-1/2' | '*' = '*';
      if (h['Result'] === '1-0') result = '1-0';
      else if (h['Result'] === '0-1') result = '0-1';
      else if (h['Result'] === '1/2-1/2') result = '1/2-1/2';

      const white: GamePlayer = {
        username: game.white.username,
        rating: game.white.rating,
        result: mapPlayerResult(game.white.result),
      };
      const black: GamePlayer = {
        username: game.black.username,
        rating: game.black.rating,
        result: mapPlayerResult(game.black.result),
      };

      // Extract opening name from ECOUrl header if available
      const ecoUrl = h['ECOUrl'] || '';
      const opening = ecoUrl ? ecoUrl.split('openings/')[1]?.replace(/-/g, ' ') : (h['Opening'] || undefined);

      allGames.push({
        id,
        source: 'chesscom' as GameSource,
        pgn: game.pgn,
        white,
        black,
        result,
        date,
        timeControl: formatTimeControl(game.time_control),
        opening,
        moves: parsed.moves,
      });
    }
  }

  return allGames.slice(0, count);
}
