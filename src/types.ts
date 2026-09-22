export const GAME_IDS = [
  'pauta-i', 'pauta-ii', 'claves', 'clave-sol', 'nome-notas',
  'notacao-alfabetica', 'nome-figuras', 'notas-descendentes',
  'propriedades-som', 'notas-teclado',
] as const;
export type GameId = typeof GAME_IDS[number];
export type Language = 'pt' | 'en';
export type Notation = 'letter' | 'solfege' | 'both';
export type AdvanceMode = 'auto' | 'manual';
export type Difficulty = 'none' | 'easy' | 'medium' | 'hard';

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
}
