import type { GameId } from '../types';
import { readStored, removeStored, writeStored } from './storage';

// Per-question answer history, the basis for reviewing weak spots.
// Question IDs are stable, so an item's history survives across plays.
const KEY = 'musicgame.attempts';

export type AttemptResult = 'correct' | 'wrong' | 'timeout';
const RESULTS: readonly AttemptResult[] = ['correct', 'wrong', 'timeout'];

/** Leitner box: 1 holds new misses, 5 holds well-known items. */
export type Box = 1 | 2 | 3 | 4 | 5;

// Days until an item is due again, by box, counted in calendar days from its
// last answer: box 1 is due at once, box 2 the next day, then 3, 7 and 14 days.
// A correct answer moves an item up one box; a miss or timeout sends it back to
// box 1. Calendar days rather than 24-hour periods, so an item answered in the
// evening is due the next morning.
export const BOX_INTERVAL_DAYS: Readonly<Record<Box, number>> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

export interface ItemRecord {
  seen: number;
  correct: number;
  /** Consecutive correct answers; any miss resets it. */
  streak: number;
  last: AttemptResult;
  lastSeen: string;
  /** Average time to answer, in milliseconds. */
  avgMs: number;
  /** Saved since scheduling began; older records get one from their streak when read. */
  box: Box;
}

type Attempts = Partial<Record<GameId, Record<string, unknown>>>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const isBox = (value: unknown): value is Box => typeof value === 'number' && value in BOX_INTERVAL_DAYS;
const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);

/** Records saved before scheduling have no box: each correct answer since the last miss is one step up from box 1. */
export const boxFromStreak = (streak: number): Box => Math.min(5, 1 + Math.max(0, Math.floor(streak))) as Box;

export function nextBox(previous: Box | undefined, result: AttemptResult): Box {
  return result === 'correct' ? Math.min(5, (previous ?? 1) + 1) as Box : 1;
}

// Saved data may be hand-edited, partial or from an older version. Fill gaps
// with neutral values and skip anything that never recorded an answer.
function readItem(raw: unknown): ItemRecord | null {
  if (!isObject(raw)) return null;
  const seen = count(raw.seen);
  if (seen === 0) return null;
  const streak = Math.min(count(raw.streak), seen);
  return {
    seen,
    correct: Math.min(count(raw.correct), seen),
    streak,
    last: RESULTS.includes(raw.last as AttemptResult) ? raw.last as AttemptResult : streak > 0 ? 'correct' : 'wrong',
    lastSeen: typeof raw.lastSeen === 'string' ? raw.lastSeen : '',
    avgMs: count(raw.avgMs),
    box: isBox(raw.box) ? raw.box : boxFromStreak(streak),
  };
}

function readAll(): Attempts {
  const saved = readStored(KEY);
  return isObject(saved) ? saved as Attempts : {};
}

export function recordAttempt(gameId: GameId, itemId: string, result: AttemptResult, ms: number, now = Date.now()): ItemRecord {
  const all = readAll();
  const items = isObject(all[gameId]) ? all[gameId]! : {};
  const prev = readItem(items[itemId]) ?? undefined;
  const seen = (prev?.seen ?? 0) + 1;
  const next: ItemRecord = {
    seen,
    correct: (prev?.correct ?? 0) + (result === 'correct' ? 1 : 0),
    streak: result === 'correct' ? (prev?.streak ?? 0) + 1 : 0,
    last: result,
    lastSeen: new Date(now).toISOString(),
    avgMs: Math.round(((prev?.avgMs ?? 0) * (seen - 1) + Math.max(0, ms)) / seen),
    box: nextBox(prev?.box, result),
  };
  // Only this item is rewritten; other records keep their saved form.
  all[gameId] = { ...items, [itemId]: next };
  writeStored(KEY, all);
  return next;
}

export function getAttempts(gameId: GameId): Record<string, ItemRecord> {
  const items = readAll()[gameId];
  if (!isObject(items)) return {};
  const out: Record<string, ItemRecord> = {};
  for (const [id, raw] of Object.entries(items)) {
    const item = readItem(raw);
    if (item) out[id] = item;
  }
  return out;
}

export function hasAttempts(gameIds: readonly GameId[]): boolean {
  return gameIds.some(id => Object.keys(getAttempts(id)).length > 0);
}

/** When an item is next due, in epoch milliseconds; an unreadable date makes it due now. */
export function dueAt(item: ItemRecord): number {
  const seen = new Date(item.lastSeen);
  if (Number.isNaN(seen.getTime())) return 0;
  return new Date(seen.getFullYear(), seen.getMonth(), seen.getDate() + BOX_INTERVAL_DAYS[item.box]).getTime();
}

export interface ReviewCandidate {
  gameId: GameId;
  itemId: string;
  record: ItemRecord;
  due: boolean;
  accuracy: number;
}

const seenAt = (item: ItemRecord) => Date.parse(item.lastSeen) || 0;

/**
 * Every answered item of these games, weakest first: due items, then the lowest
 * box, then the lowest accuracy, then the longest since last seen.
 */
export function weakItems(gameIds: readonly GameId[], now = Date.now()): ReviewCandidate[] {
  const candidates = gameIds.flatMap(gameId => Object.entries(getAttempts(gameId)).map(([itemId, record]) => ({
    gameId, itemId, record, due: dueAt(record) <= now, accuracy: record.correct / record.seen,
  })));
  return candidates.sort((a, b) => Number(b.due) - Number(a.due) || a.record.box - b.record.box
    || a.accuracy - b.accuracy || seenAt(a.record) - seenAt(b.record));
}

/** Items due for review now, in the same order as `weakItems`. */
export function dueItems(gameIds: readonly GameId[], now = Date.now()): ReviewCandidate[] {
  return weakItems(gameIds, now).filter(c => c.due);
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
