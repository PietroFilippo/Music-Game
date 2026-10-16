import { describe, expect, it, vi } from 'vitest';
import { fretsForVexKey, naturalAt, parsePositionKey, pitchClassAt, soundingMidi, vexKeyToMidi, writtenVexKey } from '../../music/guitar';
import { DURATION_BEATS } from '../../music/measure';
import { READING_MEASURES } from './reading';
import { relationOf } from './octaves';
import { SCALES, scaleNotes } from '../../music/scales';
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

describe('octaves question bank', () => {
  const pool = createQuestionPool('oitavas', 'en', 'letter');

  it('accepts the octave two strings over and the same pitch on the next string', () => {
    for (const question of pool) {
      if (question.answer.kind !== 'board') continue;
      const [start] = question.answer.board.markers!;
      const [target] = question.answer.accepts;
      const distance = soundingMidi(target) - soundingMidi(start);
      if (question.id.startsWith('octave-')) {
        expect(distance).toBe(12);
        expect(target.string).toBe(start.string - 2);
      } else {
        expect(distance).toBe(0);
        expect(target.string).toBe(start.string - 1);
      }
    }
    expect(pool.find(q => q.id === 'octave-5:3')!.answer).toMatchObject({ accepts: [{ string: 3, fret: 5 }] });
    expect(pool.find(q => q.id === 'octave-3:5')!.answer).toMatchObject({ accepts: [{ string: 1, fret: 8 }] });
    expect(pool.find(q => q.id === 'unison-2:4')!.answer).toMatchObject({ accepts: [{ string: 1, fret: 0 }] });
  });

  it('classifies every pair by the real distance between the two pitches', () => {
    const pairs = pool.filter(q => q.id.startsWith('pair-'));
    const seen = new Set<string>();
    for (const question of pairs) {
      if (question.answer.kind !== 'choice' || question.answer.visual.kind !== 'board') throw new Error('expected a board pair');
      const [a, b] = question.answer.visual.board.markers!;
      for (const p of [a, b]) {
        expect(p.fret).toBeGreaterThanOrEqual(0);
        expect(p.fret).toBeLessThanOrEqual(12);
      }
      expect(question.answer.correct).toBe(relationOf(a, b));
      seen.add(question.answer.correct);
    }
    expect([...seen].sort()).toEqual(['different', 'octave', 'two-octaves', 'unison']);
  });
});

describe('intervals question bank', () => {
  const pool = createQuestionPool('intervalos', 'en', 'letter');

  it('measures every interval from the root to the marked or accepted note', () => {
    for (const question of pool) {
      if (question.id.startsWith('name-') && question.answer.kind === 'choice' && question.answer.visual.kind === 'board') {
        const [root, target] = question.answer.visual.board.markers!;
        expect(String(soundingMidi(target) - soundingMidi(root))).toBe(question.answer.correct);
      }
      if (question.answer.kind === 'board') {
        const [root] = question.answer.board.markers!;
        const semitones = Number(question.id.split('-')[1]);
        expect(soundingMidi(question.answer.accepts[0]) - soundingMidi(root)).toBe(semitones);
      }
    }
  });

  it('uses every interval size in each fretboard question type', () => {
    const sizes = (prefix: string) => new Set(pool.filter(q => q.id.startsWith(prefix)).map(q => q.id.split('-')[1]));
    expect(sizes('name-').size).toBe(12);
    expect(sizes('find-').size).toBe(12);
  });

  it('shows spelled intervals on the neck with the right distance', () => {
    const spelled = pool.filter(q => q.id.startsWith('spell-'));
    expect(spelled.length).toBeGreaterThan(50);
    for (const question of spelled) {
      const [root, target] = question.reveal.markers!;
      expect(String(soundingMidi(target) - soundingMidi(root))).toBe(question.answer.kind === 'choice' && question.answer.correct);
    }
    const cToEFlat = pool.find(q => q.id === 'spell-C-3')!;
    expect(cToEFlat.prompt).toBe('What interval is it from C up to E♭?');
    expect(cToEFlat.notation).toMatchObject({ flat: true });
  });
});

describe('scales question bank', () => {
  const pool = createQuestionPool('escalas', 'en', 'letter');
  const keyOf = (id: string) => {
    const [, root, kind] = id.split('-');
    return { root: { letter: root[0] as LetterNote, accidental: root.slice(1) as Accidental }, kind: kind as 'major' | 'minor' };
  };

  it('names each degree from the scale itself', () => {
    for (const question of pool.filter(q => q.id.startsWith('degree-'))) {
      const { root, kind } = keyOf(question.id);
      const degree = Number(question.id.split('-')[3]);
      const note = scaleNotes(root, kind)[degree - 1];
      expect(question.answer).toMatchObject({ correct: `${note.letter}${note.accidental}` });
    }
    expect(pool.find(q => q.id === 'degree-D-major-3')!.answer).toMatchObject({ correct: 'F#' });
    expect(pool.find(q => q.id === 'degree-C-minor-3')!.answer).toMatchObject({ correct: 'Eb' });
  });

  it('accepts every position of the degree above the root, and nothing else', () => {
    for (const question of pool.filter(q => q.id.startsWith('find-'))) {
      if (question.answer.kind !== 'board') throw new Error('expected a fretboard answer');
      const { kind } = keyOf(question.id);
      const degree = Number(question.id.split('-')[3]);
      const [root] = question.answer.board.markers!;
      const semitones = degree === 8 ? 12 : SCALES[kind].semitones[degree - 1];
      const expected = Array.from({ length: 6 }, (_, string) => ({ string, fret: soundingMidi(root) + semitones - [64, 59, 55, 50, 45, 40][string] }))
        .filter(p => p.fret >= 0 && p.fret <= 12);
      expect(question.answer.accepts).toEqual(expected);
    }
  });

  it('identifies each scale among its parallel and relative scales', () => {
    const which = pool.filter(q => q.id.startsWith('which-'));
    expect(which).toHaveLength(13);
    expect(pool.find(q => q.id === 'which-C-major')!.answer).toMatchObject({ correct: 'C-major' });
    const choices = (pool.find(q => q.id === 'which-C-major')!.answer as { choices: { value: string }[] }).choices.map(c => c.value).sort();
    expect(choices).toEqual(['A-major', 'A-minor', 'C-major', 'C-minor']);
  });
});

describe('reading question bank', () => {
  const pool = createQuestionPool('leitura-braco', 'en', 'letter');

  it('keeps IDs stable across languages and notation settings', () => {
    for (const language of ['pt', 'en'] as const) {
      for (const notation of ['letter', 'solfege', 'both'] as const) {
        expect(createQuestionPool('leitura-braco', language, notation).map(q => q.id)).toEqual(pool.map(q => q.id));
      }
    }
  });

  it('accepts every exact written pitch through fret 12, including ledger-line notes', () => {
    for (const q of pool) {
      if (q.answer.kind !== 'board' || q.answer.visual?.kind !== 'staff') continue;
      const key = q.answer.visual.vexKey;
      expect(q.answer.accepts).toEqual(fretsForVexKey(key, 12));
      expect(q.reveal.markers?.map(({ string, fret }) => ({ string, fret }))).toEqual(q.answer.accepts);
      for (const p of q.answer.accepts) expect(soundingMidi(p)).toBe(vexKeyToMidi(key) - 12);
    }
    expect(pool.find(q => q.id === 'staff-position-e/3')!.answer).toMatchObject({ accepts: [{ string: 5, fret: 0 }] });
    expect(pool.find(q => q.id === 'staff-position-e/4')!.answer).toMatchObject({
      accepts: [{ string: 3, fret: 2 }, { string: 4, fret: 7 }, { string: 5, fret: 12 }],
    });
  });

  it('offers exactly one tab position matching the written pitch and octave', () => {
    for (const q of pool) {
      if (q.answer.kind !== 'choice' || q.answer.visual.kind !== 'staff') continue;
      const key = q.answer.visual.vexKey;
      const matches = q.answer.choices.filter(c => writtenVexKey(parsePositionKey(c.value)) === key);
      expect(matches.map(c => c.value)).toEqual([q.answer.correct]);
    }
  });

  it('fills each measure with four quarter-note beats and aligns tab pitches with written guitar notes', () => {
    const durations = new Set<string>();
    for (const { id, notes } of READING_MEASURES) {
      expect(notes.reduce((total, n) => total + DURATION_BEATS[n.duration], 0)).toBe(4);
      const q = pool.find(q => q.id === `duration-${id}`)!;
      expect(q.answer).toMatchObject({ visual: { kind: 'measure', notes } });
      const target = notes[notes.length > 2 ? 2 : 0];
      expect(q.answer).toMatchObject({ correct: String(DURATION_BEATS[target.duration]) });
      expect(q.sound!.notes).toEqual(notes.map(n => soundingMidi(n.position)));
      const even = notes.every(n => n.duration === notes[0].duration);
      expect(q.sound!.spacing).toBe(even ? DURATION_BEATS[notes[0].duration] * 0.6 : 0.6);
      if (!even) expect(q.explanation).toContain('evenly spaced');
      for (const n of notes) {
        durations.add(n.duration);
        expect(vexKeyToMidi(writtenVexKey(n.position))).toBe(soundingMidi(n.position) + 12);
        expect(n.position.fret).toBeGreaterThanOrEqual(0);
        expect(n.position.fret).toBeLessThanOrEqual(12);
      }
    }
    expect([...durations].sort()).toEqual(['8', 'h', 'q', 'w']);
    expect(READING_MEASURES[2].notes.map(n => writtenVexKey(n.position))).toEqual(['g/5', 'a/5', 'b/5', 'a/5']);
    expect(READING_MEASURES[2].notes.map(n => n.position.fret)).toEqual([3, 5, 7, 5]);
  });
});
