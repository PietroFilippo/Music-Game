import { describe, expect, it } from 'vitest';
import { fretsForLetter, fretsForVexKey, naturalAt, naturalFrets, vexKeyToMidi, writtenVexKey } from './guitar';

describe('guitar positions', () => {
  it('reads the treble staff as written guitar pitch, an octave above the sound', () => {
    const firstPosition = (vexKey: string) => fretsForVexKey(vexKey)[0];
    expect(firstPosition('e/4')).toEqual({ string: 3, fret: 2 });
    expect(firstPosition('f/4')).toEqual({ string: 3, fret: 3 });
    expect(firstPosition('g/4')).toEqual({ string: 2, fret: 0 });
    expect(firstPosition('a/4')).toEqual({ string: 2, fret: 2 });
    expect(firstPosition('b/4')).toEqual({ string: 1, fret: 0 });
    expect(firstPosition('c/5')).toEqual({ string: 1, fret: 1 });
    expect(firstPosition('d/5')).toEqual({ string: 1, fret: 3 });
    expect(firstPosition('e/5')).toEqual({ string: 0, fret: 0 });
    expect(firstPosition('f/5')).toEqual({ string: 0, fret: 1 });
    expect(fretsForVexKey('e/4')).toEqual([
      { string: 3, fret: 2 }, { string: 4, fret: 7 }, { string: 5, fret: 12 },
    ]);
  });

  it('writes open strings from the E below three ledger lines up to the top space', () => {
    expect([5, 4, 3, 2, 1, 0].map(string => writtenVexKey({ string, fret: 0 })))
      .toEqual(['e/3', 'a/3', 'd/4', 'g/4', 'b/4', 'e/5']);
    expect(writtenVexKey({ string: 0, fret: 12 })).toBe('e/6');
    expect(writtenVexKey({ string: 4, fret: 1 })).toBe('a#/3');
    expect(writtenVexKey({ string: 4, fret: 1 }, 'b')).toBe('bb/3');
    expect(writtenVexKey({ string: 1, fret: 2 }, 'b')).toBe('db/5');
  });

  it('maps every written note, including sharps and flats, back to its position', () => {
    expect(vexKeyToMidi('a#/3')).toBe(58);
    expect(vexKeyToMidi('bb/3')).toBe(58);
    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret <= 12; fret++) {
        expect(fretsForVexKey(writtenVexKey({ string, fret }), 12)).toContainEqual({ string, fret });
      }
    }
  });

  it('finds the natural notes on each string up to fret 12', () => {
    expect(naturalFrets(4)).toEqual([0, 2, 3, 5, 7, 8, 10, 12]);
    expect(naturalFrets(1)).toEqual([0, 1, 3, 5, 6, 8, 10, 12]);
    expect(naturalAt({ string: 5, fret: 8 })).toBe('C');
    expect(naturalAt({ string: 5, fret: 2 })).toBeNull();
    expect(fretsForLetter('E', 0)).toEqual([0, 12]);
    expect([0, 1, 2, 3, 4, 5].map(string => fretsForLetter('C', string))).toEqual([[8], [1], [5], [10], [3], [8]]);
  });
});
