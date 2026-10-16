import { SEVENTH_QUALITIES, SEVENTHS, TRIAD_QUALITIES, TRIADS, type SeventhQuality, type TriadQuality } from './chords';
import { spelledPitchClass, type SpelledNote } from './notes';
import { scaleNotes } from './scales';
import type { Language } from '../types';

export interface DiatonicTriad {
  root: SpelledNote;
  quality: TriadQuality;
  degree: number;
}

export const MAJOR_ROMANS: Record<Language, readonly string[]> = {
  pt: ['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm', 'VIIm(♭5)'],
  en: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
};

/** Stack alternate scale notes, preserving the key's letter spellings. */
export function majorTriads(tonic: SpelledNote): DiatonicTriad[] {
  const notes = scaleNotes(tonic, 'major');
  return notes.map((root, i) => {
    const offsets = [0, 2, 4].map(n => (spelledPitchClass(notes[(i + n) % 7]) - spelledPitchClass(root) + 12) % 12);
    const quality = TRIAD_QUALITIES.find(q => TRIADS[q].tones.every((t, j) => t.semitones === offsets[j]))!;
    return { root, quality, degree: i + 1 };
  });
}

export const MAJOR_SEVENTH_ROMANS: Record<Language, readonly string[]> = {
  pt: ['I7M', 'IIm7', 'IIIm7', 'IV7M', 'V7', 'VIm7', 'VIIm7(♭5)'],
  en: ['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viim7♭5'],
};

export interface DiatonicSeventh {
  root: SpelledNote;
  quality: SeventhQuality;
  degree: number;
}

/** Derive the quality from four alternate scale notes rather than a hardcoded quality sequence. */
export function majorSevenths(tonic: SpelledNote): DiatonicSeventh[] {
  const notes = scaleNotes(tonic, 'major');
  return notes.map((root, i) => {
    const offsets = [0, 2, 4, 6].map(n => (spelledPitchClass(notes[(i + n) % 7]) - spelledPitchClass(root) + 12) % 12);
    const quality = SEVENTH_QUALITIES.find(q => SEVENTHS[q].tones.every((t, j) => t.semitones === offsets[j]))!;
    return { root, quality, degree: i + 1 };
  });
}
