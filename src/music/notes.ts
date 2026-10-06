import type { Language, Notation } from '../types';

export type LetterNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export const LETTERS: LetterNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Semitones above C.
export const PITCH_CLASS: Record<LetterNote, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

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

// Compact label for small diagram markers: solfege when requested, otherwise the letter.
export function shortNoteLabel(letter: LetterNote, notation: Notation, language: Language = 'pt'): string {
  return noteLabel(letter, notation === 'solfege' ? 'solfege' : 'letter', language);
}

export function naturalForPitchClass(pitchClass: number): LetterNote | null {
  return LETTERS.find(l => PITCH_CLASS[l] === pitchClass) ?? null;
}

// Name any of the 12 pitch classes. Notes between naturals get both spellings, e.g. C♯ / D♭.
export function pitchClassLabel(pitchClass: number, notation: Notation, language: Language = 'pt'): string {
  const natural = naturalForPitchClass(pitchClass);
  if (natural) return noteLabel(natural, notation, language);
  const below = naturalForPitchClass(pitchClass - 1)!;
  const above = naturalForPitchClass(pitchClass + 1)!;
  const spell = (format: 'letter' | 'solfege') =>
    `${noteLabel(below, format, language)}♯ / ${noteLabel(above, format, language)}♭`;
  return notation === 'both' ? `${spell('letter')} · ${spell('solfege')}` : spell(notation);
}

export function shortPitchClassLabel(pitchClass: number, notation: Notation, language: Language = 'pt'): string {
  const natural = naturalForPitchClass(pitchClass);
  if (natural) return shortNoteLabel(natural, notation, language);
  return `${shortNoteLabel(naturalForPitchClass(pitchClass - 1)!, notation, language)}♯`;
}
