import type { Notation } from '../types';

export type LetterNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export const LETTERS: LetterNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const TO_SOLFEGE: Record<LetterNote, string> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
};

export function noteLabel(letter: LetterNote, notation: Notation): string {
  switch (notation) {
    case 'letter':
      return letter;
    case 'solfege':
      return TO_SOLFEGE[letter];
    case 'both':
      return `${letter} / ${TO_SOLFEGE[letter]}`;
  }
}
