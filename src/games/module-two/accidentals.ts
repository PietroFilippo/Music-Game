import type { FretMarker, MarkerTone } from '../../components/Fretboard';
import { fretsForLetter, fretsForVexKey, pitchClassAt, positionKey, type FretPosition } from '../../music/guitar';
import {
  LETTERS, PITCH_CLASS, naturalForPitchClass, spell, spelledPitchClass,
  type Accidental, type LetterNote, type SpelledNote,
} from '../../music/notes';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, STRINGS, type BoardView, type Choice, type Copy, type ModuleTwoQuestion } from './model';

const ACCIDENTAL_PITCH_CLASSES = [1, 3, 6, 8, 10];
const MOVES = [1, 2, -1, -2];
// Written notes with accidentals on the treble staff, E4–F5.
const STAFF_NOTES = ['eb/4', 'f#/4', 'gb/4', 'g#/4', 'ab/4', 'a#/4', 'bb/4', 'c#/5', 'db/5', 'd#/5', 'eb/5', 'f#/5'];
// Rare spellings this topic does not use.
const UNUSED_SPELLINGS = new Set(['E#', 'B#', 'Fb', 'Cb']);

const noteKey = (n: SpelledNote) => `${n.letter}${n.accidental}`;
const pc12 = (n: number) => ((n % 12) + 12) % 12;

// Sharps and Flats: the notes between the naturals, moving by semitones, and accidentals on the staff.
export function accidentalQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text } = c;

  // Every choice has a different pitch class, so only one answer sounds right.
  const spelledChoices = (correct: SpelledNote, candidates: SpelledNote[]): Choice[] => {
    const used = new Set([spelledPitchClass(correct)]);
    const picked: SpelledNote[] = [];
    for (const note of shuffle(candidates)) {
      const pc = spelledPitchClass(note);
      if (used.has(pc)) continue;
      used.add(pc);
      picked.push(note);
      if (picked.length === 3) break;
    }
    return shuffle([correct, ...picked]).map(n => ({ value: noteKey(n), label: c.spelled(n) }));
  };
  const marker = (string: number, fret: number, note: SpelledNote, tone: MarkerTone = 'plain'): FretMarker =>
    ({ string, fret, label: c.shortSpelled(note), tone });
  const at = (string: number, fret: number, prefer: '#' | 'b' = '#') => spell(pitchClassAt({ string, fret }), prefer);
  // An accidental between its two natural neighbors on the same string.
  const neighborsBoard = (p: FretPosition, note: SpelledNote): BoardView => ({
    markers: [
      marker(p.string, p.fret - 1, at(p.string, p.fret - 1)),
      marker(p.string, p.fret, note, 'accent'),
      marker(p.string, p.fret + 1, at(p.string, p.fret + 1)),
    ],
    stringLabels: 'name',
    showFretNumbers: true,
  });
  const between = (pc: number) => text(
    `uma casa acima de ${c.spelled(spell(pc - 1, '#'))} e uma abaixo de ${c.spelled(spell(pc + 1, '#'))}`,
    `one fret above ${c.spelled(spell(pc - 1, '#'))} and one below ${c.spelled(spell(pc + 1, '#'))}`,
  );
  const semitoneRule = text(
    'O sustenido (♯) sobe a nota um semitom, uma casa; o bemol (♭) desce um semitom.',
    'A sharp (♯) raises a note one semitone, one fret; a flat (♭) lowers it one semitone.',
  );

  const accidentalPositions = STRINGS.flatMap(string =>
    Array.from({ length: NECK_FRETS + 1 }, (_, fret) => ({ string, fret })))
    .filter(p => naturalForPitchClass(pitchClassAt(p)) === null);

  const nameMarked = accidentalPositions.map((p): ModuleTwoQuestion => {
    const pc = pitchClassAt(p);
    const offsets = shuffle([0, ...shuffle([-2, -1, 1, 2]).slice(0, 3)]);
    return {
      id: `mark-${positionKey(p)}`,
      prompt: text(`Qual nota está marcada? (${c.where(p)})`, `Which note is marked? (${c.where(p)})`),
      answer: {
        kind: 'choice',
        visual: {
          kind: 'board',
          board: { markers: [{ ...p, label: '?', tone: 'accent' }], stringLabels: 'name', showFretNumbers: true },
        },
        choices: offsets.map(d => pc12(pc + d)).map(v => ({ value: String(v), label: c.dual(v) })),
        correct: String(pc),
      },
      explanation: `${c.dual(pc)}: ${between(pc)}. ${semitoneRule} ${text(
        'Por isso os dois nomes indicam a mesma casa.', 'So both names point to the same fret.')}`,
      reveal: neighborsBoard(p, spell(pc, '#')),
      notation: p,
    };
  });

  const semitoneMoves = LETTERS.flatMap((letter, li) => MOVES.map((move, mi): ModuleTwoQuestion => {
    const prefer = move > 0 ? '#' : 'b';
    const target = spell(PITCH_CLASS[letter] + move, prefer);
    // Rotate the strings so the moves are spread across the neck.
    const order = STRINGS.map((_, k) => STRINGS[(li + mi + k) % STRINGS.length]);
    let start: FretPosition | undefined;
    for (const string of order) {
      const fret = fretsForLetter(letter, string, NECK_FRETS).find(f => f + move >= 0 && f + move <= NECK_FRETS);
      if (fret !== undefined) {
        start = { string, fret };
        break;
      }
    }
    const from = start!;
    const end = { string: from.string, fret: from.fret + move };
    const steps = Array.from({ length: Math.abs(move) + 1 }, (_, i) => from.fret + Math.sign(move) * i);
    const route = steps.map(fret => `${c.shortSpelled(at(from.string, fret, prefer))} (${fret})`).join(' → ');
    const frets = Math.abs(move);
    return {
      id: `move-${letter}${move > 0 ? '+' : ''}${move}`,
      prompt: text(
        `Comece em ${c.name(letter)} e ${move > 0 ? 'suba' : 'desça'} ${frets} ${frets === 1 ? 'casa' : 'casas'}. Qual nota?`,
        `Start on ${c.name(letter)} and move ${frets} ${frets === 1 ? 'fret' : 'frets'} ${move > 0 ? 'up' : 'down'}. Which note?`,
      ),
      answer: {
        kind: 'choice',
        visual: {
          kind: 'board',
          board: {
            markers: [{ ...from, label: c.short(letter), tone: 'accent' }, { ...end, label: '?', tone: 'plain' }],
            stringLabels: 'name',
            showFretNumbers: true,
          },
        },
        choices: spelledChoices(target, [-2, -1, 1, 2].map(d => spell(spelledPitchClass(target) + d, prefer))),
        correct: noteKey(target),
      },
      explanation: `${route}. ${text(
        `Subindo, as notas entre as naturais levam sustenido; descendo, bemol. Entre ${c.short('E')}–${c.short('F')} e ${c.short('B')}–${c.short('C')} não há casa intermediária.`,
        `Going up, the notes between naturals take sharps; going down, flats. There is no fret between ${c.short('E')}–${c.short('F')} or ${c.short('B')}–${c.short('C')}.`,
      )}`,
      reveal: {
        markers: steps.map(fret => marker(from.string, fret, at(from.string, fret, prefer), fret === end.fret ? 'accent' : 'plain')),
        stringLabels: 'name',
        showFretNumbers: true,
      },
      notation: { ...end, flat: target.accidental === 'b' },
    };
  }));

  const findAccidental = STRINGS.flatMap(string => ACCIDENTAL_PITCH_CLASSES.map((pc): ModuleTwoQuestion => {
    const note = spell(pc, (string + pc) % 2 === 0 ? '#' : 'b');
    const fret = Array.from({ length: NECK_FRETS + 1 }, (_, f) => f).find(f => pitchClassAt({ string, fret: f }) === pc)!;
    const p = { string, fret };
    return {
      id: `find-${string}-${noteKey(note)}`,
      prompt: text(`Encontre ${c.spelled(note)} na ${string + 1}ª corda.`, `Find ${c.spelled(note)} on string ${string + 1}.`),
      answer: { kind: 'board', board: { stringLabels: 'name', showFretNumbers: true }, accepts: [p] },
      explanation: text(
        `${c.dual(pc)} na ${string + 1}ª corda: casa ${fret}, ${between(pc)}.`,
        `${c.dual(pc)} on string ${string + 1}: fret ${fret}, ${between(pc)}.`,
      ),
      reveal: neighborsBoard(p, note),
      notation: { ...p, flat: note.accidental === 'b' },
    };
  }));

  const readStaff = STAFF_NOTES.map((vexKey): ModuleTwoQuestion => {
    const name = vexKey.split('/')[0];
    const note: SpelledNote = { letter: name[0].toUpperCase() as LetterNote, accidental: name.slice(1) as Accidental };
    const position = fretsForVexKey(vexKey)[0];
    const li = LETTERS.indexOf(note.letter);
    const candidates = [-1, 0, 1].flatMap(d => (['', '#', 'b'] as Accidental[])
      .map((accidental): SpelledNote => ({ letter: LETTERS[(li + d + 7) % 7], accidental })))
      .filter(n => !UNUSED_SPELLINGS.has(noteKey(n)) && noteKey(n) !== noteKey(note));
    const sharp = note.accidental === '#';
    return {
      id: `staff-${vexKey}`,
      prompt: text('Qual é o nome desta nota?', 'Name this note.'),
      answer: { kind: 'choice', visual: { kind: 'staff', vexKey }, choices: spelledChoices(note, candidates), correct: noteKey(note) },
      explanation: text(
        `${c.spelled(note)}: o ${sharp ? 'sustenido' : 'bemol'} antes da nota ${sharp ? 'sobe' : 'desce'} ${c.name(note.letter)} um semitom. Na primeira posição: ${c.where(position)}.`,
        `${c.spelled(note)}: the ${sharp ? 'sharp' : 'flat'} before the note ${sharp ? 'raises' : 'lowers'} ${c.name(note.letter)} one semitone. In first position: ${c.where(position)}.`,
      ),
      reveal: { markers: [marker(position.string, position.fret, note, 'accent')], stringLabels: 'name', showFretNumbers: true },
      notation: { ...position, flat: !sharp },
    };
  });

  return [nameMarked, semitoneMoves, findAccidental, readStaff];
}
