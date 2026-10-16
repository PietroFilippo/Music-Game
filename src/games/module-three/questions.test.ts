import { describe, expect, it } from 'vitest';
import { inversionOf, voiceLeadingDistance } from '../../music/chord-shapes';
import { chordNotes, spellsCleanly, TRIADS } from '../../music/chords';
import { parsePositionKey, pitchClassAt, soundingMidi, type FretPosition } from '../../music/guitar';
import { majorTriads } from '../../music/harmony';
import { spelledPitchClass } from '../../music/notes';
import { noteKey } from '../fretboard/model';
import { MAJOR_KEYS, PROGRESSIONS } from './progressions';
import { createQuestionDeck, createQuestionGroups, createQuestionPool, MODULE_THREE_IDS } from './questions';

describe('module 3 banks', () => {
  it.each(MODULE_THREE_IDS)('%s has stable IDs, four distinct choices and valid musical feedback in every language/notation', id => {
    const ids = createQuestionPool(id, 'en', 'letter').map(q => q.id);
    for (const lang of ['pt', 'en'] as const) for (const notation of ['letter', 'solfege', 'both'] as const) {
      const pool = createQuestionPool(id, lang, notation);
      expect(pool.map(q => q.id)).toEqual(ids);
      expect(new Set(ids).size).toBe(pool.length);
      for (const q of pool) {
        expect(q.prompt.length).toBeGreaterThan(10);
        expect(q.explanation.length).toBeGreaterThan(10);
        expect(spellsCleanly(q.chord.root, TRIADS[q.chord.quality])).toBe(true);
        const quality = TRIADS[q.chord.quality];
        const pc = spelledPitchClass(q.chord.root);
        const chordPitches = quality.tones.map(t => (pc + t.semitones) % 12);
        const checkPosition = (p: FretPosition) => {
          expect(Number.isInteger(p.string) && p.string >= 0 && p.string < 6).toBe(true);
          expect(Number.isInteger(p.fret) && p.fret >= 0 && p.fret <= 12).toBe(true);
          expect(chordPitches).toContain(pitchClassAt(p));
        };
        expect(q.reveal.markers!.length).toBeGreaterThan(0);
        for (const marker of q.reveal.markers!) {
          checkPosition(marker);
          const i = chordPitches.indexOf(pitchClassAt(marker));
          expect(marker.label).toBe(i === 0 ? 'R' : quality.tones[i].degree);
        }
        expect(q.sound!.notes.length).toBeGreaterThanOrEqual(3);
        expect(q.sound!.spacing).toBe(id === 'arpejos-triades' ? 0.3 : 0.03);
        q.sound!.notes.forEach(m => {
          expect(Number.isFinite(m)).toBe(true);
          expect(chordPitches).toContain(m % 12);
        });
        if (q.answer.kind === 'choice') {
          const { choices, correct } = q.answer;
          expect(choices).toHaveLength(4);
          expect(new Set(choices.map(o => o.value)).size).toBe(4);
          expect(new Set(choices.map(o => o.label)).size).toBe(4);
          expect(choices.filter(o => o.value === correct)).toHaveLength(1);
        } else {
          expect(q.answer.accepts.length).toBeGreaterThan(0);
          q.answer.accepts.forEach(checkPosition);
        }
      }
    }
  }, 20000);

  it.each(MODULE_THREE_IDS)('%s balances at least three types and both answer methods over ten unique rounds', id => {
    const groups = createQuestionGroups(id, 'en', 'letter');
    expect(groups.length).toBeGreaterThanOrEqual(3);
    groups.forEach(g => expect(g.length).toBeGreaterThanOrEqual(3));
    for (let i = 0; i < 20; i++) {
      const deck = createQuestionDeck(id, 'en', 'letter');
      expect(deck).toHaveLength(10);
      expect(new Set(deck.map(q => q.id)).size).toBe(10);
      expect(new Set(deck.map(q => q.answer.kind)).size).toBe(2);
      const counts = groups.map(g => deck.filter(q => g.some(t => t.id === q.id)).length);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it('spells the third/fifth by letter distance and accepts every exact pitch above the marked root', () => {
    const pool = createQuestionPool('triades', 'en', 'letter');
    expect(pool.find(q => q.id === 'spell-C-minor-1')!.answer).toMatchObject({ correct: 'Eb' });
    expect(pool.find(q => q.id === 'spell-C-augmented-2')!.answer).toMatchObject({ correct: 'G#' });
    for (const q of pool) {
      const i = Number(q.id.split('-').at(-1));
      if (q.id.startsWith('spell-')) {
        expect(q.answer).toMatchObject({ correct: noteKey(chordNotes(q.chord.root, TRIADS[q.chord.quality])![i]) });
      }
      if (q.answer.kind === 'board') {
        const root = q.answer.board.markers![0];
        const target = soundingMidi(root) + TRIADS[q.chord.quality].tones[i].semitones;
        const expected = [64, 59, 55, 50, 45, 40].map((open, string) => ({ string, fret: target - open })).filter(p => p.fret >= 0 && p.fret <= 12);
        expect(q.answer.accepts).toEqual(expected);
      }
    }
  });

  it('identifies inversions from the actual bass, marked degrees and roots in every shape', () => {
    const pool = createQuestionPool('inversoes-triades', 'en', 'letter');
    const seen = new Set<number>();
    for (const q of pool) {
      if (q.id.startsWith('inversion-') && q.answer.kind === 'choice') {
        const i = inversionOf(q.chord.root, TRIADS[q.chord.quality], q.reveal.markers!);
        expect(q.answer.correct).toBe(String(i));
        seen.add(i);
      }
      if (q.id.startsWith('degree-') && q.answer.kind === 'choice' && q.answer.visual.kind === 'board') {
        const marked = q.answer.visual.board.markers!.find(m => m.label === '?')!;
        expect(q.reveal.markers!.find(m => m.string === marked.string && m.fret === marked.fret)!.label).toBe(q.answer.correct);
      }
      if (q.answer.kind === 'board') {
        expect(q.answer.accepts).toHaveLength(1);
        expect(pitchClassAt(q.answer.accepts[0])).toBe(spelledPitchClass(q.chord.root));
      }
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });

  it('completes ascending and descending arpeggios in the requested octave and transposes every tone', () => {
    for (const q of createQuestionPool('arpejos-triades', 'en', 'letter')) {
      expect(new Set(q.reveal.markers!.map(pitchClassAt)).size).toBe(3);
      if (q.id.startsWith('next-') && q.answer.kind === 'board') {
        const index = Number(q.id.split('-').at(-1));
        const sequence = q.sound!.notes;
        expect(sequence.every((m, i) => i === 0 || (q.id.includes('-up-') ? m > sequence[i - 1] : m < sequence[i - 1]))).toBe(true);
        expect(q.answer.accepts.every(p => soundingMidi(p) === sequence[index])).toBe(true);
        expect(q.answer.board.markers!.map(soundingMidi)).toEqual(sequence.slice(0, index));
      }
      if (q.id.startsWith('transpose-') && q.answer.kind === 'board') {
        q.answer.board.markers!.forEach((m, i) => {
          expect(q.reveal.markers![i].fret).toBe(m.fret + 2);
          expect(q.reveal.markers![i].string).toBe(m.string);
        });
      }
    }
  });

  it('uses diatonic triads, transposes progressions by degree and chooses a unique closest voicing', () => {
    const pool = createQuestionPool('triades-progressoes', 'en', 'letter');
    for (const key of MAJOR_KEYS) for (const chord of majorTriads(key)) {
      const q = pool.find(q => q.id === `degree-${noteKey(key)}-${chord.degree}`)!;
      expect(q.chord).toEqual({ root: chord.root, quality: chord.quality });
      expect(q.answer).toMatchObject({ correct: `${noteKey(chord.root)}-${chord.quality}` });
    }
    for (let i = 0; i < MAJOR_KEYS.length; i++) for (const degrees of PROGRESSIONS) {
      const key = MAJOR_KEYS[i];
      const target = MAJOR_KEYS[(i + 1) % MAJOR_KEYS.length];
      const q = pool.find(q => q.id === `transpose-${noteKey(key)}-${noteKey(target)}-${degrees.join('.')}`)!;
      const chords = majorTriads(target);
      const expected = degrees.map(n => {
        const chord = chords[n - 1];
        return `${chord.root.letter}${chord.root.accidental === '#' ? '♯' : chord.root.accidental === 'b' ? '♭' : ''}${TRIADS[chord.quality].symbol.en}`;
      }).join(' – ');
      if (q.answer.kind !== 'choice') throw new Error('expected choices');
      const { correct, choices } = q.answer;
      expect(choices.find(o => o.value === correct)!.label).toBe(expected);
    }
    for (const q of pool.filter(q => q.id.startsWith('closest-'))) {
      if (q.answer.kind !== 'choice' || q.answer.visual.kind !== 'board') throw new Error('expected choice board');
      const from = q.answer.visual.board.markers!;
      const distances = q.answer.choices.map(o => ({ value: o.value, distance: voiceLeadingDistance(from, o.value.split('_').map(parsePositionKey)) }));
      const minimum = Math.min(...distances.map(o => o.distance));
      expect(distances.filter(o => o.distance === minimum)).toEqual([{ value: q.answer.correct, distance: minimum }]);
    }
    for (const q of pool.filter(q => q.id.startsWith('common-'))) {
      const [, keyName, a, b] = q.id.split('-');
      const key = MAJOR_KEYS.find(k => noteKey(k) === keyName)!;
      const chords = majorTriads(key);
      const tones = (n: string) => chordNotes(chords[Number(n) - 1].root, TRIADS[chords[Number(n) - 1].quality])!;
      const common = tones(a).filter(x => tones(b).some(y => spelledPitchClass(x) === spelledPitchClass(y)));
      expect(common).toHaveLength(1);
      expect(q.answer).toMatchObject({ correct: noteKey(common[0]) });
    }
  });
});
