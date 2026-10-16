import type { Language } from '../types';
import { allAttempts, mergeAttempts, parseAttempts, saveAllAttempts } from './attempts';
import { allScores, mergeScores, parseScores, saveAllScores } from './scores';
import { readStored, writeStored } from './storage';

// Moving progress between the browser and the desktop app, which keep separate
// storage. An export holds scores and answer history, not settings: those
// belong to each device. Importing merges and never replaces; Stats already
// has Reset all for starting over.

export const EXPORT_VERSION = 1;
const LAST_EXPORT_KEY = 'musicgame.lastExport';

export interface ProgressExport {
  app: 'musicgame';
  version: number;
  exportedAt: string;
  language: Language;
  scores: unknown;
  attempts: unknown;
}

export function buildExport(language: Language, now = new Date()): ProgressExport {
  return { app: 'musicgame', version: EXPORT_VERSION, exportedAt: now.toISOString(), language, scores: allScores(), attempts: allAttempts() };
}

/** musicgame-progress-YYYY-MM-DD.json, in local time. */
export function exportFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `musicgame-progress-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export function markExported(now = new Date()): void {
  writeStored(LAST_EXPORT_KEY, now.toISOString());
}

export function lastExport(): Date | null {
  const saved = readStored(LAST_EXPORT_KEY);
  const date = typeof saved === 'string' ? new Date(saved) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export type ImportCheck =
  | { ok: true; plays: number; topics: number; answers: number; apply: () => void }
  | { ok: false; error: 'notExport' | 'newer' };

/** Reads an export and reports what importing it would add, without saving anything yet. */
export function checkImport(text: string): ImportCheck {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notExport' };
  }
  if (!data || typeof data !== 'object') return { ok: false, error: 'notExport' };
  const file = data as Partial<ProgressExport>;
  if (file.app !== 'musicgame' || typeof file.version !== 'number') return { ok: false, error: 'notExport' };
  if (file.version > EXPORT_VERSION) return { ok: false, error: 'newer' };
  const scores = mergeScores(allScores(), parseScores(file.scores));
  const attempts = mergeAttempts(allAttempts(), parseAttempts(file.attempts));
  return {
    ok: true,
    plays: scores.newPlays,
    topics: scores.topics,
    answers: attempts.changed,
    apply: () => {
      saveAllScores(scores.merged);
      saveAllAttempts(attempts.merged);
      window.dispatchEvent(new Event(PROGRESS_CHANGED));
    },
  };
}

/** Dispatched on window after an import, so open screens can read progress again. */
export const PROGRESS_CHANGED = 'musicgame:progress-changed';
