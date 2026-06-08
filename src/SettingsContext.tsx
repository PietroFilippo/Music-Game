import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdvanceMode, Settings, Language, Notation } from './types';

const DEFAULTS: Settings = { language: 'pt', notation: 'both', advanceMode: 'auto' };
const KEY = 'musicgame.settings';

interface Ctx {
  settings: Settings;
  setLanguage: (l: Language) => void;
  setNotation: (n: Notation) => void;
  setAdvanceMode: (m: AdvanceMode) => void;
}

const SettingsContext = createContext<Ctx | null>(null);

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);
  const value: Ctx = {
    settings,
    setLanguage: l => setSettings(s => ({ ...s, language: l })),
    setNotation: n => setSettings(s => ({ ...s, notation: n })),
    setAdvanceMode: m => setSettings(s => ({ ...s, advanceMode: m })),
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside provider');
  return ctx;
}
