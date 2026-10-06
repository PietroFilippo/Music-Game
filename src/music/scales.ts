import { intervalBySemitones, spellInterval } from './intervals';
import type { SpelledNote } from './notes';

export type ScaleKind = 'major' | 'minor';

export interface ScaleShape {
  /** Semitones from the root for degrees 1–7. */
  semitones: number[];
  degrees: string[];
  /** Whole (2) and half (1) steps between neighboring degrees, ending on the octave. */
  steps: number[];
}

export const SCALES: Record<ScaleKind, ScaleShape> = {
  major: { semitones: [0, 2, 4, 5, 7, 9, 11], degrees: ['1', '2', '3', '4', '5', '6', '7'], steps: [2, 2, 1, 2, 2, 2, 1] },
  minor: { semitones: [0, 2, 3, 5, 7, 8, 10], degrees: ['1', '2', '♭3', '4', '5', '♭6', '♭7'], steps: [2, 1, 2, 2, 1, 2, 2] },
};

/** The seven notes of a scale, spelled with one letter each (D major has F♯ and C♯). */
export function scaleNotes(root: SpelledNote, kind: ScaleKind): SpelledNote[] {
  return SCALES[kind].semitones.map(s => (s === 0 ? root : spellInterval(root, intervalBySemitones(s))!));
}
