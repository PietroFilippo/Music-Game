import { describe, expect, it } from 'vitest';
import { KEYS, scaleShape } from '../games/module-two/scales';
import { soundingMidi } from './guitar';
import type { SpelledNote } from './notes';
import { SCALES, scaleNotes } from './scales';

const names = (notes: SpelledNote[]) => notes.map(n => `${n.letter}${n.accidental}`).join(' ');

describe('scales', () => {
  it('spell each scale with one of each letter', () => {
    expect(names(scaleNotes({ letter: 'C', accidental: '' }, 'major'))).toBe('C D E F G A B');
    expect(names(scaleNotes({ letter: 'D', accidental: '' }, 'major'))).toBe('D E F# G A B C#');
    expect(names(scaleNotes({ letter: 'B', accidental: 'b' }, 'major'))).toBe('Bb C D Eb F G A');
    expect(names(scaleNotes({ letter: 'A', accidental: '' }, 'minor'))).toBe('A B C D E F G');
    expect(names(scaleNotes({ letter: 'C', accidental: '' }, 'minor'))).toBe('C D Eb F G Ab Bb');
    for (const key of KEYS) {
      expect(new Set(scaleNotes(key.root, key.kind).map(n => n.letter)).size).toBe(7);
    }
  });

  it('follow the whole- and half-step patterns', () => {
    for (const kind of ['major', 'minor'] as const) {
      const { semitones, steps } = SCALES[kind];
      expect([...semitones.slice(1), 12].map((s, i) => s - semitones[i])).toEqual(steps);
    }
  });

  it('place every degree of each fretboard shape at the right pitch', () => {
    for (const key of KEYS) {
      const shape = scaleShape(key.position, key.kind);
      const expected = [...SCALES[key.kind].semitones, 12].map(s => soundingMidi(key.position) + s);
      expect(shape.map(s => soundingMidi(s.position))).toEqual(expected);
      for (const { position } of shape) {
        expect(position.fret).toBeGreaterThanOrEqual(Math.max(0, key.position.fret - 1));
        expect(position.fret).toBeLessThanOrEqual(key.position.fret + 4);
      }
    }
  });
});
