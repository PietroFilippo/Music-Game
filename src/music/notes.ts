import type { Language, Notation } from '../types';

export type LetterNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export const LETTERS: LetterNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const PT_SOLFEGE: Record<LetterNote, string> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
};

const EN_SOLFEGE: Record<LetterNote, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Ti',
};

const SOLFEGE_BY_LANGUAGE: Record<Language, Record<LetterNote, string>> = {
  pt: PT_SOLFEGE,
  en: EN_SOLFEGE,
};

export function noteLabel(letter: LetterNote, notation: Notation, language: Language = 'pt'): string {
  const solfege = SOLFEGE_BY_LANGUAGE[language][letter];

  switch (notation) {
    case 'letter':
      return letter;
    case 'solfege':
      return solfege;
    case 'both':
      return `${letter} / ${solfege}`;
  }
}
