export const GAME_IDS = [
  'pauta-i', 'pauta-ii', 'claves', 'clave-sol', 'nome-notas',
  'notacao-alfabetica', 'nome-figuras', 'notas-descendentes',
  'propriedades-som', 'notas-teclado', 'cordas-afinacao', 'notas-braco', 'sustenidos-bemois',
] as const;
export type GameId = typeof GAME_IDS[number];

export const LANGUAGES = ['pt', 'en'] as const;
export type Language = typeof LANGUAGES[number];
export const NOTATIONS = ['letter', 'solfege', 'both'] as const;
export type Notation = typeof NOTATIONS[number];
export const ADVANCE_MODES = ['auto', 'manual'] as const;
export type AdvanceMode = typeof ADVANCE_MODES[number];
export const DIFFICULTIES = ['none', 'easy', 'medium', 'hard'] as const;
export type Difficulty = typeof DIFFICULTIES[number];

export interface PlayRecord {
  percent: number;
  date: string;
  difficulty: Difficulty;
}

export interface ScoreRecord {
  gameId: GameId;
  best: number;
  last: number;
  plays: number;
  history: PlayRecord[];
}

export interface Settings {
  language: Language;
  notation: Notation;
  advanceMode: AdvanceMode;
  autoAdvanceDelayMs: number;
  difficulty: Difficulty;
  sound: boolean;
}
