import type { Language, Notation } from '../../types';
import { balancedDeck } from '../fretboard/deck';
import { createCopy, type ModuleTwoQuestion } from '../fretboard/model';
import { accidentalQuestions } from './accidentals';
import { intervalQuestions } from './intervals';
import { naturalNoteQuestions } from './naturals';
import { octaveQuestions } from './octaves';
import { readingQuestions } from './reading';
import { scaleQuestions } from './scales';
import { stringQuestions } from './strings';

export { NECK_FRETS } from '../fretboard/model';
export type { BoardView, ModuleTwoQuestion, NotatedPosition, QuestionAnswer, QuestionVisual } from '../fretboard/model';

export const MODULE_TWO_IDS = ['cordas-afinacao', 'notas-braco', 'sustenidos-bemois', 'oitavas', 'intervalos', 'escalas', 'leitura-braco'] as const;
export type ModuleTwoId = typeof MODULE_TWO_IDS[number];

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
    case 'leitura-braco': return readingQuestions(copy);
  }
}

export function createQuestionPool(id: ModuleTwoId, language: Language, notation: Notation): ModuleTwoQuestion[] {
  return createQuestionGroups(id, language, notation).flat();
}

export function createQuestionDeck(id: ModuleTwoId, language: Language, notation: Notation): ModuleTwoQuestion[] {
  return balancedDeck(createQuestionGroups(id, language, notation));
}
