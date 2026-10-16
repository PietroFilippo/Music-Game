import { DIFFICULTIES, type Difficulty, type GameId, type PlayRecord, type ScoreRecord } from '../types';
import { readStored, removeStored, writeStored } from './storage';

const KEY = 'musicgame.scores';

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function readHistory(value: unknown): PlayRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).filter(p => isNumber(p.percent) && typeof p.date === 'string')
    .map(p => ({
      percent: p.percent as number,
      date: p.date as string,
      difficulty: DIFFICULTIES.includes(p.difficulty as Difficulty) ? p.difficulty as Difficulty : 'none',
    }));
}

// Saved data may be edited, corrupted or written by an older version. Keep
// every well-formed record (scores from before play history get an empty
// history) and skip the rest, so the menu and Stats never do math on bad values.
function readAll(): Partial<Record<GameId, ScoreRecord>> {
  const saved = readStored(KEY);
  if (!isObject(saved)) return {};
  const all: Partial<Record<GameId, ScoreRecord>> = {};
  for (const [id, rec] of Object.entries(saved)) {
    if (!isObject(rec) || !isNumber(rec.best) || !isNumber(rec.last) || !isNumber(rec.plays)) continue;
    all[id as GameId] = {
      gameId: id as GameId, best: rec.best, last: rec.last, plays: rec.plays, history: readHistory(rec.history),
    };
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
