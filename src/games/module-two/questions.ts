import type { FretMarker, MarkerTone, StringLabelMode } from '../../components/Fretboard';
import {
  fretsForLetter, naturalAt, naturalFrets, OPEN_STRING_LETTERS, positionKey, STRING_COUNT, type FretPosition,
} from '../../music/guitar';
import { LETTERS, noteLabel, shortNoteLabel, type LetterNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import type { Language, Notation } from '../../types';

export const MODULE_TWO_IDS = ['cordas-afinacao', 'notas-braco'] as const;
export type ModuleTwoId = typeof MODULE_TWO_IDS[number];

// This first part of module 2 stays between the open strings and the octave at fret 12.
export const NECK_FRETS = 12;
const ROUNDS = 10;

export interface BoardView {
  markers?: FretMarker[];
  highlightStrings?: number[];
  stringLabels: StringLabelMode;
  showFretNumbers?: boolean;
}

export type QuestionVisual =
  | { kind: 'board'; board: BoardView }
  | { kind: 'tab'; position: FretPosition };

export type QuestionAnswer =
  | { kind: 'choice'; visual: QuestionVisual; choices: { value: string; label: string }[]; correct: string }
  | { kind: 'board'; board: BoardView; accepts: FretPosition[] };

export interface ModuleTwoQuestion {
  id: string;
  prompt: string;
  answer: QuestionAnswer;
  explanation: string;
  /** Fretboard shown after answering. */
  reveal: BoardView;
  /** Position shown as tablature and written notation after answering. */
  notation?: FretPosition;
}

const STRINGS = Array.from({ length: STRING_COUNT }, (_, s) => s);
const OPEN_NOTE_CHOICES: LetterNote[] = ['E', 'A', 'D', 'G', 'B'];

// Question groups, one per question type.
export function createQuestionGroups(id: ModuleTwoId, language: Language, notation: Notation): ModuleTwoQuestion[][] {
  const text = (pt: string, en: string) => (language === 'pt' ? pt : en);
  const name = (letter: LetterNote) => noteLabel(letter, notation, language);
  const short = (letter: LetterNote) => shortNoteLabel(letter, notation, language);
  const stringChoice = (s: number) => ({ value: String(s), label: text(`${s + 1}ª corda`, `String ${s + 1}`) });
  const stringChoices = (s: number) =>
    shuffle([s, ...shuffle(STRINGS.filter(n => n !== s)).slice(0, 3)]).map(stringChoice);
  const letterChoices = (letters: LetterNote[]) => letters.map(value => ({ value, label: name(value) }));

  if (id === 'cordas-afinacao') {
    const tuning = [5, 4, 3, 2, 1, 0].map(s => short(OPEN_STRING_LETTERS[s])).join(' – ');
    const openReveal = (s: number): BoardView => ({
      highlightStrings: [s],
      markers: [{ string: s, fret: 0, label: short(OPEN_STRING_LETTERS[s]), tone: 'accent' }],
      stringLabels: 'both',
    });

    const highlighted = STRINGS.map((s): ModuleTwoQuestion => ({
      id: `number-${s}`,
      prompt: text('Qual é o número da corda destacada?', 'What number is the highlighted string?'),
      answer: {
        kind: 'choice',
        visual: { kind: 'board', board: { highlightStrings: [s], stringLabels: 'none' } },
        choices: stringChoices(s),
        correct: String(s),
      },
      explanation: text(
        `É a ${s + 1}ª corda (${name(OPEN_STRING_LETTERS[s])}). A numeração vai da corda mais fina e aguda (1ª) até a mais grossa e grave (6ª); nos diagramas e na tablatura, a 1ª fica em cima.`,
        `It is string ${s + 1} (${name(OPEN_STRING_LETTERS[s])}). Numbering runs from the thinnest, highest string (1) to the thickest, lowest (6); diagrams and tab put string 1 on top.`,
      ),
      reveal: openReveal(s),
    }));

    const openNotes = STRINGS.map((s): ModuleTwoQuestion => {
      const letter = OPEN_STRING_LETTERS[s];
      return {
        id: `open-${s}`,
        prompt: text(`Qual nota soa na ${s + 1}ª corda solta?`, `Which note does open string ${s + 1} play?`),
        answer: {
          kind: 'choice',
          visual: {
            kind: 'board',
            board: { highlightStrings: [s], markers: [{ string: s, fret: 0, label: '?', tone: 'accent' }], stringLabels: 'number' },
          },
          choices: letterChoices(shuffle([letter, ...shuffle(OPEN_NOTE_CHOICES.filter(l => l !== letter)).slice(0, 3)])),
          correct: letter,
        },
        explanation: text(
          `Afinação padrão, da 6ª para a 1ª corda: ${tuning}. A ${s + 1}ª corda solta é ${name(letter)}.`,
          `Standard tuning from string 6 to string 1: ${tuning}. Open string ${s + 1} is ${name(letter)}.`,
        ),
        reveal: openReveal(s),
        notation: { string: s, fret: 0 },
      };
    });

    const tapString = STRINGS.map((s): ModuleTwoQuestion => ({
      id: `tap-${s}`,
      prompt: text(`Toque em qualquer posição da ${s + 1}ª corda.`, `Tap any position on string ${s + 1}.`),
      answer: {
        kind: 'board',
        board: { stringLabels: 'none' },
        accepts: Array.from({ length: NECK_FRETS + 1 }, (_, fret) => ({ string: s, fret })),
      },
      explanation: text(
        `Nos diagramas e na tablatura, a 1ª corda é a linha de cima e a 6ª, a de baixo. A ${s + 1}ª corda é a ${s + 1}ª linha de cima para baixo.`,
        `In diagrams and tab, string 1 is the top line and string 6 the bottom. String ${s + 1} is line ${s + 1} counting from the top.`,
      ),
      reveal: { highlightStrings: [s], stringLabels: 'both' },
    }));

    // E is skipped: two strings share it.
    const tunedTo = [4, 3, 2, 1].map((s): ModuleTwoQuestion => {
      const letter = OPEN_STRING_LETTERS[s];
      return {
        id: `tuned-${s}`,
        prompt: text(`Qual corda solta é afinada em ${name(letter)}?`, `Which open string is tuned to ${name(letter)}?`),
        answer: {
          kind: 'choice',
          visual: { kind: 'board', board: { stringLabels: 'number' } },
          choices: stringChoices(s),
          correct: String(s),
        },
        explanation: text(
          `Da 6ª para a 1ª corda: ${tuning}. ${name(letter)} é a ${s + 1}ª corda.`,
          `From string 6 to string 1: ${tuning}. ${name(letter)} is string ${s + 1}.`,
        ),
        reveal: openReveal(s),
        notation: { string: s, fret: 0 },
      };
    });

    return [highlighted, openNotes, tapString, tunedTo];
  }

  const letterAt = (p: FretPosition) => naturalAt(p)!;
  const where = (p: FretPosition) => (p.fret === 0
    ? text(`${p.string + 1}ª corda solta`, `open string ${p.string + 1}`)
    : text(`${p.string + 1}ª corda, casa ${p.fret}`, `string ${p.string + 1}, fret ${p.fret}`));
  // Neighbors in the note sequence make the player count rather than guess.
  const neighborChoices = (letter: LetterNote) => {
    const i = LETTERS.indexOf(letter);
    const neighbors = [-2, -1, 1, 2].map(d => LETTERS[(i + d + 7) % 7]);
    return letterChoices(shuffle([letter, ...shuffle(neighbors).slice(0, 3)]));
  };
  const counting = (p: FretPosition) => {
    const letter = name(letterAt(p));
    if (p.fret === 0) return text(`Corda solta: a ${p.string + 1}ª corda é ${letter}.`, `Open string: string ${p.string + 1} is ${letter}.`);
    if (p.fret === NECK_FRETS) {
      return text(`A casa 12 repete a nota da corda solta (${letter}), uma oitava acima.`,
        `Fret 12 repeats the open-string note (${letter}), one octave higher.`);
    }
    const route = naturalFrets(p.string, p.fret)
      .map(fret => `${short(letterAt({ string: p.string, fret }))} (${fret})`).join(' → ');
    const halfSteps = `${short('E')}–${short('F')} ${text('e', 'and')} ${short('B')}–${short('C')}`;
    return text(
      `Conte a partir da corda solta: ${route}. ${halfSteps} ficam a uma casa de distância; as outras notas naturais vizinhas, a duas.`,
      `Count up from the open string: ${route}. ${halfSteps} are one fret apart; other neighboring natural notes are two frets apart.`,
    );
  };
  // The string's natural notes up to the answer, with the answer highlighted.
  const routeBoard = (string: number, targets: number[]): BoardView => ({
    markers: naturalFrets(string, Math.max(...targets)).map(fret => ({
      string, fret, label: short(letterAt({ string, fret })),
      tone: (targets.includes(fret) ? 'accent' : 'plain') as MarkerTone,
    })),
    stringLabels: 'name',
    showFretNumbers: true,
  });

  const positions = STRINGS.flatMap(string => naturalFrets(string, NECK_FRETS).map(fret => ({ string, fret })));

  const nameOnBoard = positions.map((p): ModuleTwoQuestion => ({
    id: `board-${positionKey(p)}`,
    prompt: text(`Qual nota está marcada? (${where(p)})`, `Which note is marked? (${where(p)})`),
    answer: {
      kind: 'choice',
      visual: {
        kind: 'board',
        board: { markers: [{ ...p, label: '?', tone: 'accent' }], stringLabels: 'name', showFretNumbers: true },
      },
      choices: neighborChoices(letterAt(p)),
      correct: letterAt(p),
    },
    explanation: counting(p),
    reveal: routeBoard(p.string, [p.fret]),
    notation: p,
  }));

  const nameFromTab = positions.map((p): ModuleTwoQuestion => ({
    id: `tab-${positionKey(p)}`,
    prompt: text('Qual nota esta tablatura indica?', 'Which note does this tab show?'),
    answer: { kind: 'choice', visual: { kind: 'tab', position: p }, choices: neighborChoices(letterAt(p)), correct: letterAt(p) },
    explanation: text(
      `A linha ${p.string + 1} da tablatura, de cima para baixo, é a ${p.string + 1}ª corda; ${p.fret === 0 ? 'o 0 indica corda solta' : `o número ${p.fret} é a casa`}. `,
      `Tab line ${p.string + 1} from the top is string ${p.string + 1}; ${p.fret === 0 ? '0 means the open string' : `the number ${p.fret} is the fret`}. `,
    ) + counting(p),
    reveal: routeBoard(p.string, [p.fret]),
    notation: p,
  }));

  const findOnString = STRINGS.flatMap(string => LETTERS.map((letter): ModuleTwoQuestion => {
    const frets = fretsForLetter(letter, string, NECK_FRETS);
    const list = frets.join(text(' e ', ' and '));
    const first = { string, fret: frets[0] };
    return {
      id: `find-${string}-${letter}`,
      prompt: text(`Encontre ${name(letter)} na ${string + 1}ª corda (casas 0 a 12).`,
        `Find ${name(letter)} on string ${string + 1} (frets 0–12).`),
      answer: {
        kind: 'board',
        board: { stringLabels: 'name', showFretNumbers: true },
        accepts: frets.map(fret => ({ string, fret })),
      },
      explanation: text(
        `${name(letter)} na ${string + 1}ª corda: ${frets.length > 1 ? 'casas' : 'casa'} ${list}. `,
        `${name(letter)} on string ${string + 1}: ${frets.length > 1 ? 'frets' : 'fret'} ${list}. `,
      ) + counting(first),
      reveal: routeBoard(string, frets),
      notation: first,
    };
  }));

  return [nameOnBoard, nameFromTab, findOnString];
}

export function createQuestionPool(id: ModuleTwoId, language: Language, notation: Notation): ModuleTwoQuestion[] {
  return createQuestionGroups(id, language, notation).flat();
}

// Take questions from each type in turn so a large group cannot crowd out the others.
export function createQuestionDeck(id: ModuleTwoId, language: Language, notation: Notation): ModuleTwoQuestion[] {
  const groups = shuffle(createQuestionGroups(id, language, notation)).map(group => shuffle(group));
  const longest = Math.max(...groups.map(group => group.length));
  const interleaved = Array.from({ length: longest }, (_, i) => groups.map(group => group[i]))
    .flat()
    .filter((q): q is ModuleTwoQuestion => q !== undefined);
  return shuffle(interleaved.slice(0, ROUNDS));
}
