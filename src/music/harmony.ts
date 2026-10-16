import { TRIAD_QUALITIES, TRIADS, type TriadQuality } from './chords';
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
