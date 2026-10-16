import type { Language, Notation } from '../../types';
import { balancedDeck } from '../fretboard/deck';
import { createCopy } from '../fretboard/model';
import { arpeggioQuestions } from './arpeggios';
import type { TriadQuestion } from './common';
import { formulaQuestions } from './formulas';
import { progressionQuestions } from './progressions';
import { voicingQuestions } from './voicings';

export { NECK_FRETS } from '../fretboard/model';
export type { TriadQuestion } from './common';
export const MODULE_THREE_IDS = ['triades', 'inversoes-triades', 'arpejos-triades', 'triades-progressoes'] as const;
export type ModuleThreeId = typeof MODULE_THREE_IDS[number];

export function createQuestionGroups(id: ModuleThreeId, language: Language, notation: Notation): TriadQuestion[][] {
  const copy = createCopy(language, notation);
  switch (id) {
    case 'triades': return formulaQuestions(copy);
    case 'inversoes-triades': return voicingQuestions(copy);
    case 'arpejos-triades': return arpeggioQuestions(copy);
    case 'triades-progressoes': return progressionQuestions(copy);
  }
}

export function createQuestionPool(id: ModuleThreeId, language: Language, notation: Notation): TriadQuestion[] {
  return createQuestionGroups(id, language, notation).flat();
}

export function createQuestionDeck(id: ModuleThreeId, language: Language, notation: Notation): TriadQuestion[] {
  return balancedDeck(createQuestionGroups(id, language, notation));
}
