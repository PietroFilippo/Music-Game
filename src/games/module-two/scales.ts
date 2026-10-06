import type { FretMarker } from '../../components/Fretboard';
import { OPEN_STRING_MIDI, positionKey, soundingMidi, type FretPosition } from '../../music/guitar';
import { LETTERS, type SpelledNote } from '../../music/notes';
import { SCALES, scaleNotes, type ScaleKind } from '../../music/scales';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, noteKey, STRINGS, type BoardView, type Copy, type ModuleTwoQuestion } from './model';

interface Key {
  root: SpelledNote;
  kind: ScaleKind;
  /** Where the root is played for fretboard questions. */
  position: FretPosition;
}

const note = (name: string): SpelledNote => ({ letter: name[0] as SpelledNote['letter'], accidental: (name[1] ?? '') as SpelledNote['accidental'] });

export const KEYS: Key[] = [
  { root: note('C'), kind: 'major', position: { string: 4, fret: 3 } },
  { root: note('G'), kind: 'major', position: { string: 5, fret: 3 } },
  { root: note('D'), kind: 'major', position: { string: 4, fret: 5 } },
  { root: note('A'), kind: 'major', position: { string: 5, fret: 5 } },
  { root: note('E'), kind: 'major', position: { string: 5, fret: 0 } },
  { root: note('F'), kind: 'major', position: { string: 5, fret: 1 } },
  { root: note('Bb'), kind: 'major', position: { string: 4, fret: 1 } },
  { root: note('A'), kind: 'minor', position: { string: 5, fret: 5 } },
  { root: note('E'), kind: 'minor', position: { string: 5, fret: 0 } },
  { root: note('B'), kind: 'minor', position: { string: 4, fret: 2 } },
  { root: note('D'), kind: 'minor', position: { string: 4, fret: 5 } },
  { root: note('G'), kind: 'minor', position: { string: 5, fret: 3 } },
  { root: note('C'), kind: 'minor', position: { string: 4, fret: 3 } },
];

/**
 * One octave of a scale in a compact box near the root: each degree goes on the
 * lowest string where it falls between one fret below the root and four above.
 */
export function scaleShape(root: FretPosition, kind: ScaleKind): { position: FretPosition; degree: string }[] {
  const base = soundingMidi(root);
  const low = Math.max(0, root.fret - 1);
  const high = root.fret + 4;
  return [...SCALES[kind].semitones, 12].map((semitones, i) => {
    const midi = base + semitones;
    const string = STRINGS.filter(s => s <= root.string).reverse()
      .find(s => midi - OPEN_STRING_MIDI[s] >= low && midi - OPEN_STRING_MIDI[s] <= high) ?? 0;
    return { position: { string, fret: midi - OPEN_STRING_MIDI[string] }, degree: i === 7 ? '8' : SCALES[kind].degrees[i] };
  });
}

// Major and Natural Minor Scales: build scales from steps and find their degrees on the neck.
export function scaleQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text } = c;
  const keyName = (k: Pick<Key, 'root' | 'kind'>) =>
    `${c.spelled(k.root)} ${k.kind === 'major' ? text('maior', 'major') : text('menor natural', 'natural minor')}`;
  const stepsText = (kind: ScaleKind) =>
    SCALES[kind].steps.map(s => (s === 2 ? text('T', 'W') : text('S', 'H'))).join(' ');
  const notesText = (notes: SpelledNote[]) => notes.map(n => c.shortSpelled(n)).join(' ');
  const degreeNames = (kind: ScaleKind) => SCALES[kind].degrees;
  const ordinal = (degree: number) => text(`${degree}º grau`, `degree ${degree}`);
  const board = (markers: FretMarker[]): BoardView => ({ markers, stringLabels: 'name', showFretNumbers: true });
  // The whole scale, with one degree highlighted.
  const shapeBoard = (key: Key, highlight?: number) => board(scaleShape(key.position, key.kind).map(({ position, degree }, i) => ({
    ...position,
    label: i === 0 ? 'R' : degree,
    tone: i === 0 ? 'root' as const : i + 1 === highlight ? 'accent' as const : 'plain' as const,
  })));

  const nameDegree = KEYS.flatMap(key => {
    const notes = scaleNotes(key.root, key.kind);
    return notes.slice(1).map((answer, i): ModuleTwoQuestion => {
      const degree = i + 2;
      const letterIndex = LETTERS.indexOf(answer.letter);
      const candidates = [-1, 0, 1].flatMap(d => (['', '#', 'b'] as const)
        .map((accidental): SpelledNote => ({ letter: LETTERS[(letterIndex + d + 7) % 7], accidental })))
        .filter(n => noteKey(n) !== noteKey(answer));
      return {
        id: `degree-${noteKey(key.root)}-${key.kind}-${degree}`,
        prompt: text(`Qual é o ${ordinal(degree)} de ${keyName(key)}?`, `What is ${ordinal(degree)} of ${keyName(key)}?`),
        answer: {
          kind: 'choice',
          visual: { kind: 'text', text: stepsText(key.kind) },
          choices: c.spelledChoices(answer, candidates),
          correct: noteKey(answer),
        },
        explanation: text(
          `${keyName(key)}: ${notesText(notes)}. Os passos ${stepsText(key.kind)} (T = tom, S = semitom) levam ao ${ordinal(degree)}: ${c.spelled(answer)}.`,
          `${keyName(key)}: ${notesText(notes)}. The steps ${stepsText(key.kind)} (W = whole step, H = half step) lead to ${ordinal(degree)}: ${c.spelled(answer)}.`,
        ),
        reveal: shapeBoard(key, degree),
        notation: { ...scaleShape(key.position, key.kind)[degree - 1].position, flat: answer.accidental === 'b' },
      };
    });
  });

  const findDegree = KEYS.flatMap(key => SCALES[key.kind].semitones.slice(1).concat(12).map((semitones, i): ModuleTwoQuestion => {
    const degree = i + 2;
    const label = degree === 8 ? '8' : degreeNames(key.kind)[degree - 1];
    const target = soundingMidi(key.position) + semitones;
    const accepts = STRINGS.map(string => ({ string, fret: target - OPEN_STRING_MIDI[string] }))
      .filter(p => p.fret >= 0 && p.fret <= NECK_FRETS);
    const notes = scaleNotes(key.root, key.kind);
    const answer = degree === 8 ? key.root : notes[degree - 1];
    return {
      id: `find-${noteKey(key.root)}-${key.kind}-${degree}-${positionKey(key.position)}`,
      prompt: text(
        `Toque o ${ordinal(degree)} de ${keyName(key)}, acima da fundamental (R).`,
        `Tap ${ordinal(degree)} of ${keyName(key)}, above the root (R).`,
      ),
      answer: { kind: 'board', board: board([{ ...key.position, label: 'R', tone: 'root' }]), accepts },
      explanation: text(
        `${ordinal(degree)} = ${c.spelled(answer)} (${label}), ${semitones} semitons acima da fundamental. ${keyName(key)}: ${notesText(notes)}.`,
        `${ordinal(degree)} = ${c.spelled(answer)} (${label}), ${semitones} semitones above the root. ${keyName(key)}: ${notesText(notes)}.`,
      ),
      reveal: board([{ ...key.position, label: 'R', tone: 'root' }, ...accepts.map(p => ({ ...p, label, tone: 'accent' as const }))]),
      notation: { ...accepts[0], flat: answer.accidental === 'b' },
    };
  }));

  const relativeOf = (k: Pick<Key, 'root' | 'kind'>): Pick<Key, 'root' | 'kind'> => k.kind === 'major'
    ? { root: scaleNotes(k.root, 'major')[5], kind: 'minor' }
    : { root: scaleNotes(k.root, 'minor')[2], kind: 'major' };
  const value = (k: Pick<Key, 'root' | 'kind'>) => `${noteKey(k.root)}-${k.kind}`;

  const whichScale = KEYS.map((key): ModuleTwoQuestion => {
    const notes = scaleNotes(key.root, key.kind);
    const relative = relativeOf(key);
    const options: Pick<Key, 'root' | 'kind'>[] = [
      key,
      { root: key.root, kind: key.kind === 'major' ? 'minor' : 'major' },
      relative,
      { root: relative.root, kind: relative.kind === 'major' ? 'minor' : 'major' },
    ];
    return {
      id: `which-${value(key)}`,
      prompt: text('Que escala é esta?', 'Which scale is this?'),
      answer: {
        kind: 'choice',
        visual: { kind: 'text', text: notesText(notes) },
        choices: shuffle(options).map(o => ({ value: value(o), label: keyName(o) })),
        correct: value(key),
      },
      explanation: text(
        `Começa em ${c.spelled(key.root)} e segue ${stepsText(key.kind)}: ${keyName(key)}. ${keyName(relative)} usa as mesmas notas, mas começa em ${c.spelled(relative.root)}.`,
        `It starts on ${c.spelled(key.root)} and follows ${stepsText(key.kind)}: ${keyName(key)}. ${keyName(relative)} uses the same notes but starts on ${c.spelled(relative.root)}.`,
      ),
      reveal: shapeBoard(key),
    };
  });

  return [nameDegree, findDegree, whichScale];
}
