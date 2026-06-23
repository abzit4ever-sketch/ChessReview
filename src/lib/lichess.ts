import { GameData, GamePlayer, GameSource } from './types';
import { parsePGN, extractGamesFromPGN } from './pgnParser';

function formatTimeControl(tc: string): string {
  if (!tc || tc === '-' || tc === '0') return 'Correspondence';
  if (tc.includes('+')) {
    const [base, inc] = tc.split('+');
    const mins = Math.floor(Number(base) / 60);
    const secs = Number(base) % 60;
    const baseStr = secs > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins}`;
    return `${baseStr}+${inc}`;
  }
  const secs = Number(tc);
  if (isNaN(secs)) return tc;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}:${String(rem).padStart(2, '0')}` : `${mins} min`;
}

export async function fetchLichessGames(username: string, count: number = 10): Promise<GameData[]> {
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${count}&opening=true&clocks=false&evals=false`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/x-chess-pgn',
    },
  });

  if (res.status === 404) throw new Error(`User "${username}" not found on lichess`);
  if (!res.ok) throw new Error(`Lichess API error: ${res.status}`);

  const pgnText = await res.text();
  if (!pgnText.trim()) throw new Error('No games found for this user on lichess');

  const pgnGames = extractGamesFromPGN(pgnText);
  const games: GameData[] = [];

  for (const pgn of pgnGames.slice(0, count)) {
    const parsed = parsePGN(pgn);
    if (!parsed || parsed.moves.length === 0) continue;

    const h = parsed.headers;
    const siteUrl = h['Site'] || '';
    const id = siteUrl.split('/').pop() || `game-${games.length}`;

    const whiteElo = h['WhiteElo'] ? parseInt(h['WhiteElo']) : undefined;
    const blackElo = h['BlackElo'] ? parseInt(h['BlackElo']) : undefined;

    const whiteResult = parsed.result === '1-0' ? 'win' : parsed.result === '1/2-1/2' ? 'draw' : 'lose';
    const blackResult = parsed.result === '0-1' ? 'win' : parsed.result === '1/2-1/2' ? 'draw' : 'lose';

    const white: GamePlayer = {
      username: h['White'] || 'Unknown',
      rating: whiteElo,
      result: whiteResult,
    };
    const black: GamePlayer = {
      username: h['Black'] || 'Unknown',
      rating: blackElo,
      result: blackResult,
    };

    let result: '1-0' | '0-1' | '1/2-1/2' | '*' = '*';
    if (parsed.result === '1-0') result = '1-0';
    else if (parsed.result === '0-1') result = '0-1';
    else if (parsed.result === '1/2-1/2') result = '1/2-1/2';

    const date = h['UTCDate'] || h['Date'] || 'Unknown';
    const tc = h['TimeControl'] || '-';

    games.push({
      id,
      source: 'lichess' as GameSource,
      pgn,
      white,
      black,
      result,
      date,
      timeControl: formatTimeControl(tc),
      opening: h['Opening'] || undefined,
      moves: parsed.moves,
    });
  }

  return games;
}
