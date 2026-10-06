import { OPEN_STRING_LETTERS } from '../../music/guitar';
import type { LetterNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, STRINGS, type BoardView, type Copy, type ModuleTwoQuestion } from './model';

const OPEN_NOTE_CHOICES: LetterNote[] = ['E', 'A', 'D', 'G', 'B'];

// Strings and Tuning: string numbers, open-string notes and tab orientation.
export function stringQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text, name, short } = c;
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
      choices: c.stringChoices(s),
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
        choices: c.letterChoices(shuffle([letter, ...shuffle(OPEN_NOTE_CHOICES.filter(l => l !== letter)).slice(0, 3)])),
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
        choices: c.stringChoices(s),
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
