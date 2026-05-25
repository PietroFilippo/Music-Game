import type { LetterNote } from './notes';

// Standard tuning, indexed 0=high E (1st string) ... 5=low E (6th string)
// MIDI values: E4=64, B3=59, G3=55, D3=50, A2=45, E2=40
const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40];

const LETTER_TO_SEMITONE: Record<LetterNote, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export interface FretPosition {
  string: number; // 0 = high E (1st), 5 = low E (6th)
  fret: number;
}

export function vexKeyToMidi(vexKey: string): number {
  const [letter, oct] = vexKey.split('/');
  const semi = LETTER_TO_SEMITONE[letter.toUpperCase() as LetterNote];
  return 12 * (parseInt(oct, 10) + 1) + semi;
}

export function fretsForVexKey(vexKey: string, maxFret = 14): FretPosition[] {
  const midi = vexKeyToMidi(vexKey);
  const out: FretPosition[] = [];
  OPEN_STRING_MIDI.forEach((openMidi, stringIdx) => {
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= maxFret) out.push({ string: stringIdx, fret });
  });
  return out.sort((a, b) => a.fret - b.fret);
}
