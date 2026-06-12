import type { Difficulty, GameId, ScoreRecord } from '../types';

const KEY = 'musicgame.scores';

function readAll(): Partial<Record<GameId, ScoreRecord>> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Partial<Record<GameId, ScoreRecord>>;
    for (const rec of Object.values(all)) {
      if (rec && !Array.isArray(rec.history)) rec.history = [];
    }
    return all;
  } catch {
    return {};
  }
}

function writeAll(all: Partial<Record<GameId, ScoreRecord>>): void {
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getScore(id: GameId): ScoreRecord | undefined {
  return readAll()[id];
}

export function recordScore(id: GameId, percent: number, difficulty: Difficulty): ScoreRecord {
  const all = readAll();
  const prev = all[id];
  const next: ScoreRecord = {
    gameId: id,
    last: percent,
    best: Math.max(percent, prev?.best ?? 0),
    plays: (prev?.plays ?? 0) + 1,
    history: [...(prev?.history ?? []), { percent, date: new Date().toISOString(), difficulty }],
  };
  all[id] = next;
  writeAll(all);
  return next;
}

export function resetScore(id: GameId): void {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

export function resetAllScores(): void {
  localStorage.removeItem(KEY);
}
