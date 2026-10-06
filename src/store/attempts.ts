import type { GameId } from '../types';
import { readStored, removeStored, writeStored } from './storage';

// Per-question answer history, the basis for reviewing weak spots later.
// Question IDs are stable, so an item's history survives across plays.
const KEY = 'musicgame.attempts';

export type AttemptResult = 'correct' | 'wrong' | 'timeout';

export interface ItemRecord {
  seen: number;
  correct: number;
  /** Consecutive correct answers; any miss resets it. */
  streak: number;
  last: AttemptResult;
  lastSeen: string;
  /** Average time to answer, in milliseconds. */
  avgMs: number;
}

type Attempts = Partial<Record<GameId, Record<string, ItemRecord>>>;

function readAll(): Attempts {
  const saved = readStored(KEY);
  return saved && typeof saved === 'object' ? saved as Attempts : {};
}

export function recordAttempt(gameId: GameId, itemId: string, result: AttemptResult, ms: number): ItemRecord {
  const all = readAll();
  const items = all[gameId] ?? {};
  const prev = items[itemId];
  const seen = (prev?.seen ?? 0) + 1;
  const next: ItemRecord = {
    seen,
    correct: (prev?.correct ?? 0) + (result === 'correct' ? 1 : 0),
    streak: result === 'correct' ? (prev?.streak ?? 0) + 1 : 0,
    last: result,
    lastSeen: new Date().toISOString(),
    avgMs: Math.round(((prev?.avgMs ?? 0) * (seen - 1) + Math.max(0, ms)) / seen),
  };
  all[gameId] = { ...items, [itemId]: next };
  writeStored(KEY, all);
  return next;
}

export function getAttempts(gameId: GameId): Record<string, ItemRecord> {
  return readAll()[gameId] ?? {};
}

export function resetAttempts(gameId?: GameId): void {
  if (!gameId) {
    removeStored(KEY);
    return;
  }
  const all = readAll();
  delete all[gameId];
  writeStored(KEY, all);
}
