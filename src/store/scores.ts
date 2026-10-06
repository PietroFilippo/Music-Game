import type { Difficulty, GameId, ScoreRecord } from '../types';
import { readStored, removeStored, writeStored } from './storage';

const KEY = 'musicgame.scores';

function readAll(): Partial<Record<GameId, ScoreRecord>> {
  const saved = readStored(KEY);
  if (!saved || typeof saved !== 'object') return {};
  const all = saved as Partial<Record<GameId, ScoreRecord>>;
  for (const rec of Object.values(all)) {
    if (rec && typeof rec === 'object' && !Array.isArray(rec.history)) rec.history = [];
  }
  return all;
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
  writeStored(KEY, all);
  return next;
}

export function resetScore(id: GameId): void {
  const all = readAll();
  delete all[id];
  writeStored(KEY, all);
}

export function resetAllScores(): void {
  removeStored(KEY);
}
