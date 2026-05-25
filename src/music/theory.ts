import type { LetterNote } from './notes';

export interface StaffPosition {
  letter: LetterNote;
  vexKey: string;
  kind: 'line' | 'space';
  index: number;
}

export const TREBLE_POSITIONS: StaffPosition[] = [
  { letter: 'E', vexKey: 'e/4', kind: 'line', index: 1 },
  { letter: 'F', vexKey: 'f/4', kind: 'space', index: 1 },
  { letter: 'G', vexKey: 'g/4', kind: 'line', index: 2 },
  { letter: 'A', vexKey: 'a/4', kind: 'space', index: 2 },
  { letter: 'B', vexKey: 'b/4', kind: 'line', index: 3 },
  { letter: 'C', vexKey: 'c/5', kind: 'space', index: 3 },
  { letter: 'D', vexKey: 'd/5', kind: 'line', index: 4 },
  { letter: 'E', vexKey: 'e/5', kind: 'space', index: 4 },
  { letter: 'F', vexKey: 'f/5', kind: 'line', index: 5 },
];

export type ClefId = 'treble' | 'alto' | 'bass';

export interface ClefInfo {
  id: ClefId;
  vexClef: 'treble' | 'alto' | 'bass';
  anchorLetter: LetterNote;
}

export const CLEFS: ClefInfo[] = [
  { id: 'treble', vexClef: 'treble', anchorLetter: 'G' },
  { id: 'alto', vexClef: 'alto', anchorLetter: 'C' },
  { id: 'bass', vexClef: 'bass', anchorLetter: 'F' },
];

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
