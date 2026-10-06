import type { Language } from '../types';
import { LETTERS, PITCH_CLASS, type Accidental, type SpelledNote } from './notes';

export interface Interval {
  semitones: number;
  /** Letter-name distance counted inclusively (C to E is a 3rd). */
  number: number;
  /** Degree label used on diagrams, e.g. ♭3 or 5. */
  degree: string;
  pt: string;
  en: string;
}

// From the minor 2nd to the octave. The tritone is spelled as an augmented 4th.
export const INTERVALS: Interval[] = [
  { semitones: 1, number: 2, degree: '♭2', pt: '2ª menor', en: 'minor 2nd' },
  { semitones: 2, number: 2, degree: '2', pt: '2ª maior', en: 'major 2nd' },
  { semitones: 3, number: 3, degree: '♭3', pt: '3ª menor', en: 'minor 3rd' },
  { semitones: 4, number: 3, degree: '3', pt: '3ª maior', en: 'major 3rd' },
  { semitones: 5, number: 4, degree: '4', pt: '4ª justa', en: 'perfect 4th' },
  { semitones: 6, number: 4, degree: '♭5', pt: 'trítono', en: 'tritone' },
  { semitones: 7, number: 5, degree: '5', pt: '5ª justa', en: 'perfect 5th' },
  { semitones: 8, number: 6, degree: '♭6', pt: '6ª menor', en: 'minor 6th' },
  { semitones: 9, number: 6, degree: '6', pt: '6ª maior', en: 'major 6th' },
  { semitones: 10, number: 7, degree: '♭7', pt: '7ª menor', en: 'minor 7th' },
  { semitones: 11, number: 7, degree: '7', pt: '7ª maior', en: 'major 7th' },
  { semitones: 12, number: 8, degree: '8', pt: 'oitava', en: 'octave' },
];

export function intervalBySemitones(semitones: number): Interval {
  return INTERVALS.find(i => i.semitones === semitones)!;
}

export function intervalName(interval: Interval, language: Language): string {
  return interval[language];
}

const ACCIDENTAL_FOR: Record<number, Accidental> = { [-1]: 'b', 0: '', 1: '#' };

/**
 * The note an interval above a root, spelled by letter distance: a minor 3rd
 * above C is E♭, not D♯. Returns null when it would need a double sharp or flat.
 */
export function spellInterval(root: SpelledNote, interval: Interval): SpelledNote | null {
  const rootIndex = LETTERS.indexOf(root.letter);
  const letter = LETTERS[(rootIndex + interval.number - 1) % 7];
  const rootPitch = PITCH_CLASS[root.letter] + (root.accidental === '#' ? 1 : root.accidental === 'b' ? -1 : 0);
  let natural = (PITCH_CLASS[letter] - rootPitch + 12) % 12;
  if (interval.number === 8 && natural === 0) natural = 12;
  const accidental = ACCIDENTAL_FOR[interval.semitones - natural];
  return accidental === undefined ? null : { letter, accidental };
}
