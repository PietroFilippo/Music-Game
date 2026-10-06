import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { readStored, writeStored } from './store/storage';
import {
  ADVANCE_MODES, DIFFICULTIES, LANGUAGES, NOTATIONS,
  type AdvanceMode, type Difficulty, type Settings, type Language, type Notation,
} from './types';

export const AUTO_DELAY_MIN_MS = 500;
export const AUTO_DELAY_MAX_MS = 2000;

const DEFAULTS: Settings = {
  language: 'pt',
  notation: 'both',
  advanceMode: 'auto',
  autoAdvanceDelayMs: 900,
  difficulty: 'none',
  sound: true,
};
const KEY = 'musicgame.settings';

interface Ctx {
  settings: Settings;
  setLanguage: (l: Language) => void;
  setNotation: (n: Notation) => void;
  setAdvanceMode: (m: AdvanceMode) => void;
  setAutoAdvanceDelayMs: (ms: number) => void;
  setDifficulty: (d: Difficulty) => void;
  setSound: (on: boolean) => void;
}

const SettingsContext = createContext<Ctx | null>(null);

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

// Saved values come from an earlier version or a hand-edited browser entry, so
// keep only values the app can use.
export function loadSettings(): Settings {
  const saved = readStored(KEY);
  const s = (saved && typeof saved === 'object' ? saved : {}) as Partial<Record<keyof Settings, unknown>>;
  const delay = s.autoAdvanceDelayMs;
  return {
    language: oneOf(s.language, LANGUAGES, DEFAULTS.language),
    notation: oneOf(s.notation, NOTATIONS, DEFAULTS.notation),
    advanceMode: oneOf(s.advanceMode, ADVANCE_MODES, DEFAULTS.advanceMode),
    autoAdvanceDelayMs: typeof delay === 'number' && delay >= AUTO_DELAY_MIN_MS && delay <= AUTO_DELAY_MAX_MS
      ? delay : DEFAULTS.autoAdvanceDelayMs,
    difficulty: oneOf(s.difficulty, DIFFICULTIES, DEFAULTS.difficulty),
    sound: typeof s.sound === 'boolean' ? s.sound : DEFAULTS.sound,
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  useEffect(() => {
    writeStored(KEY, settings);
  }, [settings]);
  const value: Ctx = {
    settings,
    setLanguage: l => setSettings(s => ({ ...s, language: l })),
    setNotation: n => setSettings(s => ({ ...s, notation: n })),
    setAdvanceMode: m => setSettings(s => ({ ...s, advanceMode: m })),
    setAutoAdvanceDelayMs: ms => setSettings(s => ({ ...s, autoAdvanceDelayMs: ms })),
    setDifficulty: d => setSettings(s => ({ ...s, difficulty: d })),
    setSound: on => setSettings(s => ({ ...s, sound: on })),
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside provider');
  return ctx;
}
