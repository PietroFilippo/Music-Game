export type GameId = 'pauta-i' | 'pauta-ii' | 'claves' | 'clave-sol';
export type Language = 'pt' | 'en';
export type Notation = 'letter' | 'solfege' | 'both';
export type AdvanceMode = 'auto' | 'manual';

export interface ScoreRecord {
  gameId: GameId;
  best: number;
  last: number;
  plays: number;
}

export interface Settings {
  language: Language;
  notation: Notation;
  advanceMode: AdvanceMode;
}
