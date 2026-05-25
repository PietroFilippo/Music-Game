import type { GameId, ScoreRecord } from '../types';

const KEY = 'musicgame.scores';

function readAll(): Partial<Record<GameId, ScoreRecord>> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getScore(id: GameId): ScoreRecord | undefined {
  return readAll()[id];
}

export function recordScore(id: GameId, percent: number): ScoreRecord {
  const all = readAll();
  const prev = all[id];
  const next: ScoreRecord = {
    gameId: id,
    last: percent,
    best: Math.max(percent, prev?.best ?? 0),
    plays: (prev?.plays ?? 0) + 1,
  };
  all[id] = next;
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}
