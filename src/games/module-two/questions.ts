import { shuffle } from '../../music/theory';
import type { Language, Notation } from '../../types';
import { accidentalQuestions } from './accidentals';
import { createCopy, type ModuleTwoQuestion } from './model';
import { intervalQuestions } from './intervals';
import { naturalNoteQuestions } from './naturals';
import { octaveQuestions } from './octaves';
import { scaleQuestions } from './scales';
import { stringQuestions } from './strings';

export { NECK_FRETS } from './model';
export type { BoardView, ModuleTwoQuestion, NotatedPosition, QuestionAnswer, QuestionVisual } from './model';

export const MODULE_TWO_IDS = ['cordas-afinacao', 'notas-braco', 'sustenidos-bemois', 'oitavas', 'intervalos', 'escalas'] as const;
export type ModuleTwoId = typeof MODULE_TWO_IDS[number];

const ROUNDS = 10;

// Question groups, one per question type.
export function createQuestionGroups(id: ModuleTwoId, language: Language, notation: Notation): ModuleTwoQuestion[][] {
  const copy = createCopy(language, notation);
  switch (id) {
    case 'cordas-afinacao': return stringQuestions(copy);
    case 'notas-braco': return naturalNoteQuestions(copy);
    case 'sustenidos-bemois': return accidentalQuestions(copy);
    case 'oitavas': return octaveQuestions(copy);
    case 'intervalos': return intervalQuestions(copy);
    case 'escalas': return scaleQuestions(copy);
  }
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
