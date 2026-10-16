import { describe, expect, it } from 'vitest';
import { chordNotes, chordSymbol, spellsCleanly, SEVENTHS } from '../../music/chords';
import { pitchClassAt, soundingMidi, type FretPosition } from '../../music/guitar';
import { majorSevenths } from '../../music/harmony';
import { spelledPitchClass } from '../../music/notes';
import { noteKey } from '../fretboard/model';
import { GUIDE_TRANSITIONS, MAJOR_KEYS } from './progressions';
import { createQuestionDeck, createQuestionGroups, createQuestionPool, MODULE_FOUR_IDS } from './questions';

describe('module 4 banks', () => {
  it.each(MODULE_FOUR_IDS)('%s has stable IDs, four distinct choices and valid musical feedback in every language/notation', id => {
    const ids = createQuestionPool(id, 'en', 'letter').map(q => q.id);
    for (const lang of ['pt', 'en'] as const) for (const notation of ['letter', 'solfege', 'both'] as const) {
      const pool = createQuestionPool(id, lang, notation);
      expect(pool.map(q => q.id)).toEqual(ids);
      expect(new Set(ids).size).toBe(pool.length);
      for (const q of pool) {
        expect(q.prompt.length).toBeGreaterThan(10);
        expect(q.explanation.length).toBeGreaterThan(10);
        expect(spellsCleanly(q.chord.root, SEVENTHS[q.chord.quality])).toBe(true);
        const quality = SEVENTHS[q.chord.quality];
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
        expect(q.sound!.notes.length).toBeGreaterThanOrEqual(q.id.startsWith('seventh-') ? 2 : 4);
        expect(q.sound!.spacing).toBe(id === 'arpejos-tetrades' ? 0.3 : 0.03);
        q.sound!.notes.forEach(m => {
          expect(Number.isFinite(m)).toBe(true);
          expect(chordPitches).toContain(m % 12);
          expect(q.reveal.markers!.map(soundingMidi)).toContain(m);
        });
        if (q.answer.kind === 'choice') {
          const { choices, correct } = q.answer;
          expect(choices).toHaveLength(4);
          expect(new Set(choices.map(o => o.value)).size).toBe(4);
          expect(new Set(choices.map(o => o.label)).size).toBe(4);
          expect(choices.filter(o => o.value === correct)).toHaveLength(1);
          if (choices.every(o => /^[A-G][#b]?$/.test(o.value)) && correct.length > 1) {
            expect(choices.some(o => o.value !== correct && o.value.length > 1)).toBe(true);
          }
        } else {
          expect(q.answer.accepts.length).toBeGreaterThan(0);
          q.answer.accepts.forEach(checkPosition);
        }
      }
    }
  }, 20000);

  it.each(MODULE_FOUR_IDS)('%s balances at least three types and both answer methods over ten unique rounds', id => {
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

  it('spells tones by letter distance, uses mixed accidental distractors and locates exact sevenths', () => {
    const pool = createQuestionPool('tetrades', 'en', 'letter');
    expect(pool.find(q => q.id === 'spell-C-maj7-3')!.answer).toMatchObject({ correct: 'B' });
    expect(pool.find(q => q.id === 'spell-C-dom7-3')!.answer).toMatchObject({ correct: 'Bb' });
    expect(pool.find(q => q.id === 'spell-B-dim7-3')!.answer).toMatchObject({ correct: 'Ab' });
    expect(pool.some(q => q.chord.quality === 'dim7' && q.chord.root.letter === 'C' && !q.chord.root.accidental)).toBe(false);
    for (const q of pool) {
      const quality = SEVENTHS[q.chord.quality];
      if (q.id.startsWith('spell-') && q.answer.kind === 'choice') {
        const i = Number(q.id.split('-').at(-1));
        expect(q.answer.correct).toBe(noteKey(chordNotes(q.chord.root, quality)![i]));
        expect(q.answer.choices.filter(o => o.value.length > 1)).toHaveLength(2);
      }
      if (q.answer.kind === 'board') {
        const midi = soundingMidi(q.answer.board.markers![0]) + quality.tones[3].semitones;
        expect(q.answer.accepts.every(p => soundingMidi(p) === midi)).toBe(true);
      }
    }
  });

  it('identifies the pitch order and marked degrees of root-bass voicings', () => {
    const seen = new Set<string>();
    for (const q of createQuestionPool('tetrades-formacoes', 'en', 'letter')) {
      if (q.id.startsWith('order-') && q.answer.kind === 'choice') {
        const markers = q.reveal.markers!;
        expect(markers[0].label).toBe('R');
        expect(markers.every((m, i) => i === 0 || soundingMidi(m) > soundingMidi(markers[i - 1]))).toBe(true);
        const actual = markers.map(m => m.label === 'R' ? '1' : m.label!.replaceAll('♭', '').replaceAll('♯', '')).join('–');
        expect(q.answer.correct).toBe(actual);
        seen.add(actual);
      }
      if (q.id.startsWith('degree-') && q.answer.kind === 'choice' && q.answer.visual.kind === 'board') {
        const target = q.answer.visual.board.markers!.find(m => m.label === '?')!;
        expect(q.reveal.markers!.find(m => m.string === target.string && m.fret === target.fret)!.label).toBe(q.answer.correct);
      }
      if (q.answer.kind === 'board') {
        const i = Number(q.id.split('-').at(-1));
        expect(q.answer.accepts).toHaveLength(1);
        expect(pitchClassAt(q.answer.accepts[0])).toBe((spelledPitchClass(q.chord.root) + SEVENTHS[q.chord.quality].tones[i].semitones) % 12);
      }
    }
    expect([...seen].sort()).toEqual(['1–3–5–7', '1–5–7–3', '1–7–3–5']);
  });

  it('avoids degree elimination and identifies roots when asking shape quality', () => {
    for (const id of ['tetrades-formacoes', 'arpejos-tetrades'] as const) {
      for (const q of createQuestionPool(id, 'en', 'letter')) {
        if (q.answer.kind !== 'choice' || q.answer.visual.kind !== 'board') continue;
        const markers = q.answer.visual.board.markers!;
        if (q.id.startsWith('degree-')) {
          expect(markers.filter(m => m.label === '?')).toHaveLength(1);
          expect(markers.filter(m => m.label !== '?').every(m => /^[A-G][♯♭]?$/.test(m.label!))).toBe(true);
        }
        if (q.id.startsWith('quality-')) {
          const roots = markers.filter(m => m.label === 'R');
          expect(roots.length).toBeGreaterThan(0);
          roots.forEach(m => expect(pitchClassAt(m)).toBe(spelledPitchClass(q.chord.root)));
          expect(markers.every(m => m.label === 'R' || m.label === '?')).toBe(true);
        }
      }
    }
  });

  it('completes four-tone arpeggios in either direction and transposes every pitch', () => {
    for (const q of createQuestionPool('arpejos-tetrades', 'en', 'letter')) {
      expect(new Set(q.reveal.markers!.map(pitchClassAt)).size).toBe(4);
      expect(q.sound!.notes).toHaveLength(5);
      const shape = [...q.reveal.markers!].sort((a, b) => soundingMidi(a) - soundingMidi(b));
      expect(shape.every((p, i) => i === 0 || [0, 1].includes(shape[i - 1].string - p.string))).toBe(true);
      const frets = shape.map(p => p.fret);
      expect(Math.max(...frets) - Math.min(...frets)).toBeLessThanOrEqual(4);
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

  it('transposes ii–V–I and resolves each seventh down by a half or whole step to the next third', () => {
    const pool = createQuestionPool('tetrades-aplicacao', 'en', 'letter');
    for (const [i, key] of MAJOR_KEYS.entries()) {
      const chords = majorSevenths(key);
      for (const chord of chords) {
        expect(pool.find(q => q.id === `degree-${noteKey(key)}-${chord.degree}`)!.answer).toMatchObject({ correct: `${noteKey(chord.root)}-${chord.quality}` });
      }
      const target = MAJOR_KEYS[(i + 1) % MAJOR_KEYS.length];
      const q = pool.find(q => q.id === `transpose-${noteKey(key)}-${noteKey(target)}`)!;
      if (q.answer.kind !== 'choice') throw new Error('expected choices');
      const expected = [1, 4, 0].map(i => { const c = majorSevenths(target)[i]; return chordSymbol(c.root, SEVENTHS[c.quality], 'en'); }).join(' – ');
      const { choices, correct } = q.answer;
      expect(choices.find(o => o.value === correct)!.label).toBe(expected);
      for (const option of choices) {
        const optionKey = MAJOR_KEYS.find(k => noteKey(k) === option.value)!;
        const optionChords = majorSevenths(optionKey);
        expect([1, 4, 0].map(i => optionChords[i].quality)).toEqual(['m7', 'dom7', 'maj7']);
        expect(option.label).toBe([1, 4, 0].map(i => chordSymbol(optionChords[i].root, SEVENTHS[optionChords[i].quality], 'en')).join(' – '));
      }
      for (const [a, b] of GUIDE_TRANSITIONS) {
        const q = pool.find(q => q.id === `guide-${noteKey(key)}-${a}-${b}`)!;
        if (q.answer.kind !== 'board') throw new Error('expected board');
        const source = soundingMidi(q.answer.board.markers![0]);
        const third = chordNotes(chords[b - 1].root, SEVENTHS[chords[b - 1].quality])![1];
        for (const p of q.answer.accepts) {
          expect([1, 2]).toContain(source - soundingMidi(p));
          expect(pitchClassAt(p)).toBe(spelledPitchClass(third));
        }
        const closest = pool.find(q => q.id === `closest-${noteKey(key)}-${a}-${b}`)!;
        expect(closest.answer).toMatchObject({ correct: noteKey(third) });
        const pitches = chordNotes(chords[b - 1].root, SEVENTHS[chords[b - 1].quality])!.map(spelledPitchClass);
        const distances = pitches.map(p => Math.min((p - source % 12 + 12) % 12, (source % 12 - p + 12) % 12));
        expect(distances.filter(d => d === Math.min(...distances))).toHaveLength(1);
        expect(distances[1]).toBe(Math.min(...distances));
      }
    }
  });
});
