export type GameId = 'pauta-i' | 'pauta-ii' | 'claves' | 'clave-sol';
export type Language = 'pt' | 'en';
export type Notation = 'letter' | 'solfege' | 'both';
export type AdvanceMode = 'auto' | 'manual';
export type Difficulty = 'none' | 'easy' | 'medium' | 'hard';

export const GAME_IDS: GameId[] = ['pauta-i', 'pauta-ii', 'claves', 'clave-sol'];

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
