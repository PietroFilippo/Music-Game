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
type Scores = Partial<Record<GameId, ScoreRecord>>;

/** The well-formed score records in saved or imported data. */
export function parseScores(saved: unknown): Scores {
  if (!isObject(saved)) return {};
  const all: Scores = {};
  for (const [id, rec] of Object.entries(saved)) {
    if (!isObject(rec) || !isNumber(rec.best) || !isNumber(rec.last) || !isNumber(rec.plays)) continue;
    all[id as GameId] = {
      gameId: id as GameId, best: rec.best, last: rec.last, plays: rec.plays, history: readHistory(rec.history),
    };
  }
  return all;
}

const readAll = (): Scores => parseScores(readStored(KEY));

/** Every saved score record, for exporting progress. */
export const allScores = readAll;

export function saveAllScores(all: Scores): void {
  writeStored(KEY, all);
}

/**
 * Adds imported scores to these. Play histories are combined by date, so a
 * file imported twice adds nothing; best keeps the higher value and last
 * follows the most recent play. Plays from before play history (counted but
 * not listed) are kept once, not added together.
 */
export function mergeScores(current: Scores, incoming: Scores): { merged: Scores; newPlays: number; topics: number } {
  const merged: Scores = { ...current };
  let newPlays = 0;
  let topics = 0;
  for (const [id, imported] of Object.entries(incoming) as [GameId, ScoreRecord][]) {
    const mine = current[id];
    if (!mine) {
      merged[id] = imported;
      newPlays += imported.plays;
      topics += 1;
      continue;
    }
    const byPlay = new Map([...mine.history, ...imported.history].map(p => [`${p.date}|${p.percent}`, p]));
    const history = [...byPlay.values()].sort((a, b) => a.date.localeCompare(b.date));
    const untracked = Math.max(mine.plays - mine.history.length, imported.plays - imported.history.length, 0);
    const added = history.length - mine.history.length;
    merged[id] = {
      gameId: id,
      best: Math.max(mine.best, imported.best),
      last: history.length ? history[history.length - 1].percent : mine.last,
      plays: history.length + untracked,
      history,
    };
    if (added > 0) {
      newPlays += added;
      topics += 1;
    }
  }
  return { merged, newPlays, topics };
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
