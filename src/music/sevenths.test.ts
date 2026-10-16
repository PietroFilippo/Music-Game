import { describe, expect, it } from 'vitest';
import { inversionOf, orderedVoicings } from './chord-shapes';
import { chordNotes, SEVENTH_QUALITIES, SEVENTHS, spellsCleanly } from './chords';
import { pitchClassAt, soundingMidi } from './guitar';
import { majorSevenths } from './harmony';
import { spelledPitchClass } from './notes';
import { scaleNotes } from './scales';
import { ROOTS, VOICING_LAYOUTS } from '../games/module-four/common';
import { MAJOR_KEYS } from '../games/module-three/progressions';

describe('seventh-chord theory', () => {
  it('generates each tone exactly once in the requested pitch order, with a root bass', () => {
    for (const layout of VOICING_LAYOUTS) {
      let count = 0;
      for (const root of ROOTS) for (const q of SEVENTH_QUALITIES) {
        if (!spellsCleanly(root, SEVENTHS[q])) continue;
        for (const shape of orderedVoicings(root, SEVENTHS[q], layout.strings, layout.order)) {
          count++;
          expect(shape.map(t => t.position.string)).toEqual([...layout.strings]);
          expect(shape.map(t => t.toneIndex)).toEqual([...layout.order]);
          expect(new Set(shape.map(t => t.toneIndex)).size).toBe(4);
          expect(inversionOf(root, SEVENTHS[q], shape.map(t => t.position))).toBe(0);
          const midi = shape.map(t => soundingMidi(t.position));
          expect(midi.every((m, i) => i === 0 || m > midi[i - 1])).toBe(true);
          const frets = shape.map(t => t.position.fret);
          expect(Math.max(...frets) - Math.min(...frets)).toBeLessThanOrEqual(5);
          shape.forEach(t => {
            expect(t.position.fret >= 0 && t.position.fret <= 12).toBe(true);
            expect(pitchClassAt(t.position)).toBe((spelledPitchClass(root) + SEVENTHS[q].tones[t.toneIndex].semitones) % 12);
          });
        }
      }
      expect(count).toBeGreaterThan(0);
    }
    const root = ROOTS[0];
    for (const [strings, order] of [[[3, 2, 1, 0], [1, 0, 2, 3]], [[3, 2, 1, 0], [0, 1, 1, 3]], [[3, 2, 1, 1], [0, 1, 2, 3]], [[6, 2, 1, 0], [0, 1, 2, 3]]]) {
      expect(orderedVoicings(root, SEVENTHS.maj7, strings, order)).toEqual([]);
    }
    expect(orderedVoicings(root, SEVENTHS.maj7, [3, 2, 1, 0], [0, 1, 2, 3], { maxFret: 0 })).toEqual([]);
  });

  it('stacks diatonic thirds with the chord spelling of every course key', () => {
    for (const key of MAJOR_KEYS) {
      const scale = scaleNotes(key, 'major');
      const chords = majorSevenths(key);
      expect(chords.map(c => c.quality)).toEqual(['maj7', 'm7', 'm7', 'maj7', 'dom7', 'm7', 'm7b5']);
      chords.forEach((c, i) => {
        expect(c.degree).toBe(i + 1);
        expect(chordNotes(c.root, SEVENTHS[c.quality])).toEqual([0, 2, 4, 6].map(n => scale[(i + n) % 7]));
      });
    }
  });
});
