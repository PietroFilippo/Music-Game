import type { FretboardQuestion } from '../games/fretboard/model';
import { createQuestionPool as moduleOnePool, MODULE_ONE_IDS, type ModuleQuestion } from '../games/module-one/questions';
import { createStaffPool, STAFF_GAME_IDS } from '../games/module-one/staff';
import { createQuestionPool as moduleTwoPool, MODULE_TWO_IDS } from '../games/module-two/questions';
import type { GameId, Language, Notation } from '../types';

// Topics whose questions can be rebuilt from their stored IDs, for review
// sessions and for re-rendering a running quiz in a new language or notation.
// Each family has one renderer: 'reading' for Module 1's choice questions,
// 'fretboard' for FretboardQuiz topics.
//
// To register a topic, add one line below. A new FretboardQuiz bank with
// createQuestionPool(id, language, notation) needs only:
//   ...fretboard(MODULE_THREE_IDS, moduleThreePool),

/** A question with the game it belongs to and the renderer family that shows it. */
export type QuizItem =
  | { family: 'reading'; gameId: GameId; question: ModuleQuestion }
  | { family: 'fretboard'; gameId: GameId; question: FretboardQuestion };
export type QuestionFamily = QuizItem['family'];

type Pool<Q> = (language: Language, notation: Notation) => Q[];
export type ReviewTopic =
  | { family: 'reading'; pool: Pool<ModuleQuestion> }
  | { family: 'fretboard'; pool: Pool<FretboardQuestion> };

type Topics = Partial<Record<GameId, ReviewTopic>>;
type Bank<Id, Q> = (id: Id, language: Language, notation: Notation) => Q[];

const reading = <Id extends GameId>(ids: readonly Id[], bank: Bank<Id, ModuleQuestion>): Topics =>
  Object.fromEntries(ids.map(id => [id, { family: 'reading', pool: (l: Language, n: Notation) => bank(id, l, n) }]));
const fretboard = <Id extends GameId>(ids: readonly Id[], bank: Bank<Id, FretboardQuestion>): Topics =>
  Object.fromEntries(ids.map(id => [id, { family: 'fretboard', pool: (l: Language, n: Notation) => bank(id, l, n) }]));

export const REVIEW_TOPICS: Topics = {
  ...reading(STAFF_GAME_IDS, createStaffPool),
  ...reading(MODULE_ONE_IDS, moduleOnePool),
  ...fretboard(MODULE_TWO_IDS, moduleTwoPool),
};

/** Finds a game's questions by ID in its current pool; unknown games and IDs give undefined. */
export function questionLookup(gameId: GameId, language: Language, notation: Notation, topics = REVIEW_TOPICS):
  (id: string) => QuizItem | undefined {
  const topic = topics[gameId];
  if (!topic) return () => undefined;
  if (topic.family === 'reading') {
    const byId = new Map(topic.pool(language, notation).map(q => [q.id, q]));
    return id => { const question = byId.get(id); return question && { family: 'reading', gameId, question }; };
  }
  const byId = new Map(topic.pool(language, notation).map(q => [q.id, q]));
  return id => { const question = byId.get(id); return question && { family: 'fretboard', gameId, question }; };
}

/** The same questions in another language or notation, in order; items that cannot be rebuilt stay as they are. */
export function relocalize(items: QuizItem[], language: Language, notation: Notation, topics = REVIEW_TOPICS): QuizItem[] {
  const lookups = new Map<GameId, (id: string) => QuizItem | undefined>();
  return items.map(item => {
    if (!lookups.has(item.gameId)) lookups.set(item.gameId, questionLookup(item.gameId, language, notation, topics));
    const rebuilt = lookups.get(item.gameId)!(item.question.id);
    return rebuilt?.family === item.family ? rebuilt : item;
  });
}
