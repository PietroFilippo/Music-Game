import { describe, expect, it, vi } from 'vitest';
import { fretsForVexKey, naturalAt, pitchClassAt } from '../../music/guitar';
import { spelledPitchClass, type Accidental, type LetterNote } from '../../music/notes';
import { createQuestionDeck, createQuestionGroups, createQuestionPool, MODULE_TWO_IDS, NECK_FRETS } from './questions';

describe('module 2 question banks', () => {
  it.each(MODULE_TWO_IDS)('%s has valid answers and ten rounds in both languages and all notation modes', id => {
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    for (const lang of ['pt', 'en'] as const) {
      for (const notation of ['letter', 'solfege', 'both'] as const) {
        const pool = createQuestionPool(id, lang, notation);
        expect(new Set(pool.map(q => q.id)).size).toBe(pool.length);
        for (const question of pool) {
          expect(question.prompt.length).toBeGreaterThan(10);
          expect(question.explanation.length).toBeGreaterThan(10);
          if (question.answer.kind === 'choice') {
            const { choices, correct } = question.answer;
            expect(choices).toHaveLength(4);
            expect(new Set(choices.map(c => c.value)).size).toBe(4);
            expect(new Set(choices.map(c => c.label)).size).toBe(4);
            expect(choices.filter(c => c.value === correct)).toHaveLength(1);
          } else {
            expect(question.answer.accepts.length).toBeGreaterThan(0);
            for (const p of question.answer.accepts) {
              expect(p.string).toBeGreaterThanOrEqual(0);
              expect(p.string).toBeLessThan(6);
              expect(p.fret).toBeGreaterThanOrEqual(0);
              expect(p.fret).toBeLessThanOrEqual(NECK_FRETS);
            }
          }
        }
        const deck = createQuestionDeck(id, lang, notation);
        expect(deck).toHaveLength(10);
        expect(new Set(deck.map(q => q.id)).size).toBe(10);
      }
    }
  });

  it.each(MODULE_TWO_IDS)('%s spreads each deck across question types', id => {
    const groups = createQuestionGroups(id, 'en', 'letter');
    for (let i = 0; i < 20; i++) {
      const deck = createQuestionDeck(id, 'en', 'letter');
      const counts = groups.map(group => deck.filter(q => group.some(g => g.id === q.id)).length);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it('accepts every position of the requested natural note and nothing else', () => {
    const pool = createQuestionPool('notas-braco', 'en', 'letter');
    for (const question of pool) {
      if (question.answer.kind === 'board') {
        const [, string, letter] = question.id.split('-');
        const expected = Array.from({ length: NECK_FRETS + 1 }, (_, fret) => ({ string: Number(string), fret }))
          .filter(p => naturalAt(p) === letter);
        expect(question.answer.accepts).toEqual(expected);
      } else {
        expect(naturalAt(question.notation!)).toBe(question.answer.correct);
      }
    }
    expect(pool.find(q => q.id === 'find-0-E')!.answer)
      .toMatchObject({ accepts: [{ string: 0, fret: 0 }, { string: 0, fret: 12 }] });
    expect(pool.find(q => q.id === 'find-4-C')!.answer).toMatchObject({ accepts: [{ string: 4, fret: 3 }] });
  });

  it('names strings and open notes from standard tuning', () => {
    const pool = createQuestionPool('cordas-afinacao', 'en', 'letter');
    expect(pool.find(q => q.id === 'open-5')!.answer).toMatchObject({ correct: 'E' });
    expect(pool.find(q => q.id === 'open-2')!.answer).toMatchObject({ correct: 'G' });
    const tunedToB = pool.find(q => q.id === 'tuned-1')!;
    expect(tunedToB.prompt).toBe('Which open string is tuned to B?');
    expect(tunedToB.answer).toMatchObject({ correct: '1' });
    const tap = pool.find(q => q.id === 'tap-3')!.answer;
    expect(tap.kind === 'board' && tap.accepts.every(p => p.string === 3)).toBe(true);
    expect(createQuestionPool('cordas-afinacao', 'pt', 'solfege').find(q => q.id === 'tuned-1')!.prompt)
      .toBe('Qual corda solta é afinada em Si?');
  });
});

describe('sharps and flats question bank', () => {
  const pool = createQuestionPool('sustenidos-bemois', 'en', 'letter');
  const pitchOf = (value: string) => /^\d+$/.test(value)
    ? Number(value)
    : spelledPitchClass({ letter: value[0] as LetterNote, accidental: value.slice(1) as Accidental });

  it('never offers a wrong choice that sounds the same as the answer', () => {
    for (const question of pool) {
      if (question.answer.kind !== 'choice') continue;
      const pitches = question.answer.choices.map(c => pitchOf(c.value));
      expect(new Set(pitches).size).toBe(4);
    }
  });

  it('names marked frets and staff notes correctly', () => {
    for (const question of pool) {
      if (question.id.startsWith('mark-')) {
        expect(question.answer).toMatchObject({ correct: String(pitchClassAt(question.notation!)) });
        expect(naturalAt(question.notation!)).toBeNull();
      }
      if (question.id.startsWith('staff-') && question.answer.kind === 'choice') {
        const position = fretsForVexKey(question.id.slice('staff-'.length))[0];
        expect(pitchOf(question.answer.correct)).toBe(pitchClassAt(position));
      }
    }
    expect(pool.find(q => q.id === 'staff-f#/4')!.notation).toMatchObject({ string: 3, fret: 4 });
    expect(pool.find(q => q.id === 'staff-bb/4')!.notation).toMatchObject({ string: 2, fret: 3, flat: true });
  });

  it('spells semitone moves with sharps going up and flats going down', () => {
    expect(pool.find(q => q.id === 'move-F+1')!.answer).toMatchObject({ correct: 'F#' });
    expect(pool.find(q => q.id === 'move-E+1')!.answer).toMatchObject({ correct: 'F' });
    expect(pool.find(q => q.id === 'move-B-1')!.answer).toMatchObject({ correct: 'Bb' });
    expect(pool.find(q => q.id === 'move-C-1')!.answer).toMatchObject({ correct: 'B' });
    expect(pool.find(q => q.id === 'move-C-2')!.answer).toMatchObject({ correct: 'Bb' });
    for (const question of pool.filter(q => q.id.startsWith('move-'))) {
      const board = question.answer.kind === 'choice' && question.answer.visual.kind === 'board'
        ? question.answer.visual.board : null;
      const [start, end] = board!.markers!;
      const move = Number(question.id.match(/[+-]\d$/)![0]);
      expect(end.fret - start.fret).toBe(move);
      expect(pitchClassAt(end)).toBe(pitchOf(question.answer.kind === 'choice' ? question.answer.correct : ''));
    }
  });

  it('accepts the one fret where each sharp or flat sits on the string', () => {
    const find = pool.filter(q => q.id.startsWith('find-'));
    expect(find).toHaveLength(30);
    for (const question of find) {
      if (question.answer.kind !== 'board') throw new Error('expected a fretboard answer');
      const [, string, name] = question.id.split('-');
      const [p] = question.answer.accepts;
      expect(question.answer.accepts).toHaveLength(1);
      expect(p.string).toBe(Number(string));
      expect(pitchClassAt(p)).toBe(pitchOf(name));
    }
  });
});
