import { naturalForPitchClass, PITCH_CLASS, spell, type LetterNote } from './notes';

// Strings are indexed 0 = 1st string (high E) ... 5 = 6th string (low E), the
// top-to-bottom order of tablature. Sounding pitches as MIDI numbers:
// E4=64, B3=59, G3=55, D3=50, A2=45, E2=40.
export const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40] as const;
export const OPEN_STRING_LETTERS: readonly LetterNote[] = ['E', 'B', 'G', 'D', 'A', 'E'];
export const STRING_COUNT = 6;

// Guitar music is written one octave above the sounding pitch, so the treble
// staff's bottom line (written E4) is the 4th string at fret 2, and the open
// 1st string is written in the top space (E5).
export const GUITAR_WRITTEN_OFFSET = 12;

export interface FretPosition {
  string: number; // 0 = high E (1st), 5 = low E (6th)
  fret: number;
}

export function samePosition(a: FretPosition, b: FretPosition): boolean {
  return a.string === b.string && a.fret === b.fret;
}

export function positionKey(p: FretPosition): string {
  return `${p.string}:${p.fret}`;
}

export function parsePositionKey(key: string): FretPosition {
  const [string, fret] = key.split(':').map(Number);
  return { string, fret };
}

export function soundingMidi(p: FretPosition): number {
  return OPEN_STRING_MIDI[p.string] + p.fret;
}

export function pitchClassAt(p: FretPosition): number {
  return soundingMidi(p) % 12;
}

export function naturalAt(p: FretPosition): LetterNote | null {
  return naturalForPitchClass(pitchClassAt(p));
}

// VexFlow key for how the position is written on a guitar staff, e.g. 'e/3'
// for the open 6th string. Notes between naturals use sharps unless flats are
// preferred.
export function writtenVexKey(p: FretPosition, prefer: '#' | 'b' = '#'): string {
  const midi = soundingMidi(p) + GUITAR_WRITTEN_OFFSET;
  const note = spell(midi % 12, prefer);
  return `${note.letter.toLowerCase()}${note.accidental}/${Math.floor(midi / 12) - 1}`;
}

// Accepts naturals and accidentals, e.g. 'e/4', 'a#/3', 'bb/3'.
export function vexKeyToMidi(vexKey: string): number {
  const [name, oct] = vexKey.split('/');
  const letter = name[0].toUpperCase() as LetterNote;
  const shift = [...name.slice(1)].reduce((n, c) => n + (c === '#' ? 1 : c === 'b' ? -1 : 0), 0);
  return 12 * (parseInt(oct, 10) + 1) + PITCH_CLASS[letter] + shift;
}

// Where a note written on a guitar staff is played, lowest fret first.
export function fretsForVexKey(vexKey: string, maxFret = 14): FretPosition[] {
  const midi = vexKeyToMidi(vexKey) - GUITAR_WRITTEN_OFFSET;
  const out: FretPosition[] = [];
  OPEN_STRING_MIDI.forEach((openMidi, stringIdx) => {
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= maxFret) out.push({ string: stringIdx, fret });
  });
  return out.sort((a, b) => a.fret - b.fret);
}

// Frets on one string that play a natural note, e.g. A string: 0, 2, 3, 5, 7, 8, 10, 12.
export function naturalFrets(string: number, maxFret = 12): number[] {
  return Array.from({ length: maxFret + 1 }, (_, fret) => fret)
    .filter(fret => naturalAt({ string, fret }) !== null);
}

export function fretsForLetter(letter: LetterNote, string: number, maxFret = 12): number[] {
  return naturalFrets(string, maxFret).filter(fret => naturalAt({ string, fret }) === letter);
}
