import type { FretMarker, StringLabelMode } from '../../components/Fretboard';
import { STRING_COUNT, type FretPosition } from '../../music/guitar';
import {
  noteLabel, pitchClassLabel, shortNoteLabel, shortPitchClassLabel, spelledLabel, spelledPitchClass,
  type LetterNote, type SpelledNote,
} from '../../music/notes';
import { shuffle } from '../../music/theory';
import type { Language, Notation } from '../../types';

// Module 2 stays between the open strings and the octave at fret 12.
export const NECK_FRETS = 12;
export const STRINGS = Array.from({ length: STRING_COUNT }, (_, s) => s);

export interface BoardView {
  markers?: FretMarker[];
  highlightStrings?: number[];
  stringLabels: StringLabelMode;
  showFretNumbers?: boolean;
}

export type QuestionVisual =
  | { kind: 'board'; board: BoardView }
  | { kind: 'tab'; position: FretPosition }
  | { kind: 'staff'; vexKey: string }
  | { kind: 'text'; text: string };

export interface Choice {
  value: string;
  label: string;
}

export type QuestionAnswer =
  | { kind: 'choice'; visual: QuestionVisual; choices: Choice[]; correct: string }
  | { kind: 'board'; board: BoardView; accepts: FretPosition[] };

/** A position shown as tablature and written notation; `flat` spells it with a flat. */
export interface NotatedPosition extends FretPosition {
  flat?: boolean;
}

export interface ModuleTwoQuestion {
  id: string;
  prompt: string;
  answer: QuestionAnswer;
  explanation: string;
  /** Fretboard shown after answering. */
  reveal: BoardView;
  /** Position shown as tablature and written notation after answering. */
  notation?: NotatedPosition;
}

/** Choice value for a spelled note, e.g. "F#" or "Bb". */
export const noteKey = (n: SpelledNote) => `${n.letter}${n.accidental}`;

// Wording helpers shared by the topic question banks.
export function createCopy(language: Language, notation: Notation) {
  const text = (pt: string, en: string) => (language === 'pt' ? pt : en);
  return {
    language,
    text,
    name: (letter: LetterNote) => noteLabel(letter, notation, language),
    short: (letter: LetterNote) => shortNoteLabel(letter, notation, language),
    spelled: (note: SpelledNote) => spelledLabel(note, notation, language),
    shortSpelled: (note: SpelledNote) => spelledLabel(note, notation === 'solfege' ? 'solfege' : 'letter', language),
    /** Both names of a note between naturals, e.g. "F♯ / G♭". */
    dual: (pitchClass: number) => pitchClassLabel(pitchClass, notation, language),
    /** Short marker label for any pitch class, e.g. "G" or "F♯". */
    shortPitch: (pitchClass: number) => shortPitchClassLabel(pitchClass, notation, language),
    where: (p: FretPosition) => (p.fret === 0
      ? text(`${p.string + 1}ª corda solta`, `open string ${p.string + 1}`)
      : text(`${p.string + 1}ª corda, casa ${p.fret}`, `string ${p.string + 1}, fret ${p.fret}`)),
    stringChoices: (s: number): Choice[] =>
      shuffle([s, ...shuffle(STRINGS.filter(n => n !== s)).slice(0, 3)])
        .map(n => ({ value: String(n), label: text(`${n + 1}ª corda`, `String ${n + 1}`) })),
    letterChoices: (letters: LetterNote[]): Choice[] =>
      letters.map(value => ({ value, label: noteLabel(value, notation, language) })),
    /** The answer plus three candidates; every choice sounds different, so only one is right. */
    spelledChoices: (correct: SpelledNote, candidates: SpelledNote[]): Choice[] => {
      const used = new Set([spelledPitchClass(correct)]);
      const picked: SpelledNote[] = [];
      for (const note of shuffle(candidates)) {
        const pc = spelledPitchClass(note);
        if (used.has(pc)) continue;
        used.add(pc);
        picked.push(note);
        if (picked.length === 3) break;
      }
      return shuffle([correct, ...picked]).map(n => ({ value: noteKey(n), label: spelledLabel(n, notation, language) }));
    },
  };
}

export type Copy = ReturnType<typeof createCopy>;
