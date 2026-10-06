import { describe, expect, it } from 'vitest';
import { INTERVALS, intervalBySemitones, spellInterval } from './intervals';

const spelled = (letter: string, semitones: number) => {
  const note = spellInterval({ letter: letter as 'C', accidental: '' }, intervalBySemitones(semitones));
  return note && `${note.letter}${note.accidental}`;
};

describe('intervals', () => {
  it('covers every size from a minor 2nd to the octave once', () => {
    expect(INTERVALS.map(i => i.semitones)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('spells the upper note by letter distance', () => {
    expect(spelled('C', 3)).toBe('Eb');
    expect(spelled('C', 4)).toBe('E');
    expect(spelled('B', 4)).toBe('D#');
    expect(spelled('F', 5)).toBe('Bb');
    expect(spelled('B', 7)).toBe('F#');
    expect(spelled('F', 6)).toBe('B');
    expect(spelled('E', 1)).toBe('F');
    expect(spelled('A', 10)).toBe('G');
    expect(spelled('D', 11)).toBe('C#');
    expect(spelled('G', 12)).toBe('G');
  });
});
