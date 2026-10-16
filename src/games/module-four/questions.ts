import type { Language, Notation } from '../../types';
import { balancedDeck } from '../fretboard/deck';
import { createCopy } from '../fretboard/model';
import { arpeggioQuestions } from './arpeggios';
import type { SeventhQuestion } from './common';
import { formulaQuestions } from './formulas';
import { progressionQuestions } from './progressions';
import { voicingQuestions } from './voicings';

export { NECK_FRETS } from '../fretboard/model';
export type { SeventhQuestion } from './common';
export const MODULE_FOUR_IDS = ['tetrades', 'tetrades-formacoes', 'arpejos-tetrades', 'tetrades-aplicacao'] as const;
export type ModuleFourId = typeof MODULE_FOUR_IDS[number];

export function createQuestionGroups(id: ModuleFourId, language: Language, notation: Notation): SeventhQuestion[][] {
  const copy = createCopy(language, notation);
  switch (id) {
    case 'tetrades': return formulaQuestions(copy);
    case 'tetrades-formacoes': return voicingQuestions(copy);
    case 'arpejos-tetrades': return arpeggioQuestions(copy);
    case 'tetrades-aplicacao': return progressionQuestions(copy);
  }
}

export function createQuestionPool(id: ModuleFourId, language: Language, notation: Notation): SeventhQuestion[] {
  return createQuestionGroups(id, language, notation).flat();
}

export function createQuestionDeck(id: ModuleFourId, language: Language, notation: Notation): SeventhQuestion[] {
  return balancedDeck(createQuestionGroups(id, language, notation));
}
