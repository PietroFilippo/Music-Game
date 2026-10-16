import { describe, expect, it } from 'vitest';
import { arpeggioShapes, closeVoicings, inversionOf, voiceLeadingDistance } from './chord-shapes';
import { chordNotes, SEVENTHS, spellsCleanly, TRIAD_QUALITIES, TRIADS } from './chords';
import { pitchClassAt, soundingMidi } from './guitar';
import { majorTriads } from './harmony';
import { spelledPitchClass, type SpelledNote } from './notes';
import { scaleNotes } from './scales';

const roots: SpelledNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(letter => ({ letter: letter as SpelledNote['letter'], accidental: '' }));
roots.push({ letter: 'B', accidental: 'b' }, { letter: 'E', accidental: 'b' }, { letter: 'F', accidental: '#' });

describe('chord shapes', () => {
  it('enumerates close, playable voicings with each tone once on all four string sets', () => {
    for (const root of roots) for (const q of TRIAD_QUALITIES) {
      if (!spellsCleanly(root, TRIADS[q])) continue;
      for (let high = 0; high < 4; high++) {
        const strings = [high, high + 1, high + 2];
        const shapes = closeVoicings(root, TRIADS[q], strings);
        expect(shapes.length).toBeGreaterThan(0);
        const inversions = new Set<number>();
        for (const shape of shapes) {
          const positions = shape.map(t => t.position);
          const midi = positions.map(soundingMidi);
          expect([...positions.map(p => p.string)].sort()).toEqual(strings);
          expect(new Set(shape.map(t => t.toneIndex)).size).toBe(3);
          expect(Math.max(...positions.map(p => p.fret)) - Math.min(...positions.map(p => p.fret))).toBeLessThanOrEqual(4);
          expect(Math.max(...midi) - Math.min(...midi)).toBeLessThan(12);
          shape.forEach(t => {
            expect(pitchClassAt(t.position)).toBe((spelledPitchClass(root) + TRIADS[q].tones[t.toneIndex].semitones) % 12);
            expect(t.position.fret).toBeGreaterThanOrEqual(0);
            expect(t.position.fret).toBeLessThanOrEqual(12);
          });
          const inversion = inversionOf(root, TRIADS[q], positions);
          expect(inversion).toBe(shape[0].toneIndex);
          expect(inversionOf(root, TRIADS[q], [...positions].reverse())).toBe(inversion);
          inversions.add(inversion);
        }
        expect(inversions.size).toBeGreaterThanOrEqual(2);
      }
    }
    for (let high = 0; high < 4; high++) {
      const shapes = closeVoicings(roots[0], TRIADS.major, [high, high + 1, high + 2]);
      expect([...new Set(shapes.map(s => inversionOf(roots[0], TRIADS.major, s.map(t => t.position))))].sort()).toEqual([0, 1, 2]);
    }
  });

  it('generates major and minor root–third–fifth–octave arpeggios from strings 6, 5 and 4', () => {
    for (const string of [5, 4, 3]) for (let fret = 0; fret <= 8; fret++) for (const quality of [TRIADS.major, TRIADS.minor]) {
      const root = { string, fret };
      const shapes = arpeggioShapes(root, quality);
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) {
        expect(shape.map(t => soundingMidi(t.position) - soundingMidi(root))).toEqual([0, quality.tones[1].semitones, 7, 12]);
        expect(new Set(shape.map(t => t.toneIndex)).size).toBe(3);
        expect(shape.map(t => t.degree)).toEqual(['R', quality.tones[1].degree, '5', 'R']);
        const frets = shape.map(t => t.position.fret);
        expect(Math.max(...frets) - Math.min(...frets)).toBeLessThanOrEqual(4);
        expect(frets.every(f => f >= 0 && f <= 12)).toBe(true);
        for (let s = 0; s < 6; s++) expect(shape.filter(t => t.position.string === s).length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('moves a closed arpeggio to a new root by shifting every fret equally', () => {
    for (const string of [5, 4, 3]) for (const quality of [TRIADS.major, TRIADS.minor]) {
      const a = arpeggioShapes({ string, fret: 3 }, quality)[0];
      const shifted = a.map(t => ({ ...t.position, fret: t.position.fret + 2 }));
      expect(arpeggioShapes({ string, fret: 5 }, quality).some(b => JSON.stringify(b.map(t => t.position)) === JSON.stringify(shifted))).toBe(true);
    }
  });

  it('supports four-tone arpeggios and voicings, and handles impossible shapes explicitly', () => {
    expect(arpeggioShapes({ string: 5, fret: 3 }, SEVENTHS.maj7)[0]).toHaveLength(5);
    expect(closeVoicings(roots[0], SEVENTHS.maj7, [0, 1, 2, 3]).length).toBeGreaterThan(0);
    expect(arpeggioShapes({ string: 0, fret: 12 }, TRIADS.major)).toEqual([]);
    expect(closeVoicings(roots[0], TRIADS.major, [0, 0, 1])).toEqual([]);
    expect(inversionOf(roots[0], TRIADS.major, [])).toBe(-1);
    expect(voiceLeadingDistance([], [])).toBe(Infinity);
    expect(voiceLeadingDistance([{ string: 2, fret: 0 }, { string: 1, fret: 1 }, { string: 0, fret: 0 }],
      [{ string: 2, fret: 2 }, { string: 1, fret: 1 }, { string: 0, fret: 1 }])).toBe(3);
  });
});

describe('harmonized major scale', () => {
  it('stacks scale thirds with the same spelling as chords.ts in every course key', () => {
    for (const key of roots.filter(r => !(r.letter === 'F' && r.accidental === '#'))) {
      const scale = scaleNotes(key, 'major');
      const chords = majorTriads(key);
      expect(chords.map(c => c.quality)).toEqual(['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']);
      chords.forEach((chord, i) => {
        expect(chord.degree).toBe(i + 1);
        expect(chordNotes(chord.root, TRIADS[chord.quality])).toEqual([scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7]]);
      });
    }
  });
});
