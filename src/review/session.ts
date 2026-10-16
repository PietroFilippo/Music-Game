import { shuffle } from '../music/theory';
import { dueItems } from '../store/attempts';
import type { GameId, Language, Notation } from '../types';
import { questionLookup, REVIEW_TOPICS, type QuizItem } from './registry';

export const REVIEW_ROUNDS = 10;

// A review takes the most urgent due questions of a module: misses first, then
// questions whose box interval has passed. With fewer than ten due, the session
// is shorter instead of topped up with questions that are not due yet, because
// answering those early would move them up a box without the spacing that
// makes Leitner boxes work. Questions are rebuilt from their stored IDs in the
// current language and notation; IDs no longer in a pool are skipped.
export function buildReviewDeck(
  gameIds: readonly GameId[], language: Language, notation: Notation,
  now = Date.now(), limit = REVIEW_ROUNDS, topics = REVIEW_TOPICS,
): QuizItem[] {
  const lookups = new Map<GameId, (id: string) => QuizItem | undefined>();
  const deck: QuizItem[] = [];
  for (const candidate of dueItems(gameIds, now)) {
    if (deck.length === limit) break;
    if (!lookups.has(candidate.gameId)) lookups.set(candidate.gameId, questionLookup(candidate.gameId, language, notation, topics));
    const item = lookups.get(candidate.gameId)!(candidate.itemId);
    if (item) deck.push(item);
  }
  // The ranking decides what is reviewed; shuffling mixes topics within the session.
  return shuffle(deck);
}
