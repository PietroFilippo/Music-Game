export type GameId = 'pauta-i' | 'pauta-ii' | 'claves' | 'clave-sol';
export type Language = 'pt' | 'en';
export type Notation = 'letter' | 'solfege' | 'both';

export interface ScoreRecord {
  gameId: GameId;
  best: number;
  last: number;
  plays: number;
}

export interface Settings {
  language: Language;
  notation: Notation;
}
