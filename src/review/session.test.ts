import { describe, expect, it } from 'vitest';
import { createQuestionPool } from '../games/module-two/questions';
import { recordAttempt } from '../store/attempts';
import { buildReviewDeck } from './session';

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();
const ids = (deck: ReturnType<typeof buildReviewDeck>) => deck.map(item => `${item.gameId} ${item.question.id}`).sort();

describe('review deck', () => {
  it('takes only due questions, so a short history gives a short session', () => {
    recordAttempt('claves', 'bass', 'wrong', 900, at(1));
    recordAttempt('nome-figuras', 'eighth', 'timeout', 900, at(1));
    recordAttempt('pauta-i', 'g/4', 'correct', 900, at(1)); // box 2, due on the 2nd
    expect(ids(buildReviewDeck(['claves', 'nome-figuras', 'pauta-i'], 'en', 'letter', at(1, 20))))
      .toEqual(['claves bass', 'nome-figuras eighth']);
    expect(buildReviewDeck(['claves', 'nome-figuras', 'pauta-i'], 'en', 'letter', at(2))).toHaveLength(3);
    expect(buildReviewDeck(['notas-teclado'], 'en', 'letter', at(2))).toEqual([]);
  });

  it('rebuilds each question for the current language and notation, skipping unknown IDs', () => {
    recordAttempt('claves', 'treble', 'wrong', 900, at(1));
    recordAttempt('claves', 'soprano', 'wrong', 900, at(1));
    recordAttempt('notas-teclado', 'H', 'wrong', 900, at(1));
    recordAttempt('notas-braco', 'board-9:9', 'wrong', 900, at(1));
    const [item] = buildReviewDeck(['claves', 'notas-teclado', 'notas-braco'], 'pt', 'solfege', at(2));
    expect(buildReviewDeck(['claves', 'notas-teclado', 'notas-braco'], 'pt', 'solfege', at(2))).toHaveLength(1);
    expect(item).toMatchObject({ family: 'reading', gameId: 'claves', question: { id: 'treble', correct: 'G' } });
    expect(item.family === 'reading' && item.question.choices.map(c => c.label).sort()).toEqual(['Dó', 'Fá', 'Sol']);
  });

  it('reviews at most ten questions, the most urgent first', () => {
    const pool = createQuestionPool('notas-braco', 'en', 'letter');
    pool.slice(0, 12).forEach((q, i) => {
      // Two correct answers then a miss for the first six; one correct answer for the rest.
      if (i < 6) ['correct', 'correct', 'wrong'].forEach(r => recordAttempt('notas-braco', q.id, r as 'correct' | 'wrong', 900, at(1)));
      else recordAttempt('notas-braco', q.id, 'correct', 900, at(1));
    });
    recordAttempt('oitavas', createQuestionPool('oitavas', 'en', 'letter')[0].id, 'wrong', 900, at(3));
    const deck = buildReviewDeck(['notas-braco', 'oitavas'], 'en', 'letter', at(5));
    expect(deck).toHaveLength(10);
    // All seven misses (box 1) make it; three of the six box-2 questions fill the rest.
    const missed = [...pool.slice(0, 6).map(q => q.id), createQuestionPool('oitavas', 'en', 'letter')[0].id];
    expect(missed.every(id => deck.some(item => item.question.id === id))).toBe(true);
    expect(deck.every(item => item.family === 'fretboard')).toBe(true);
  });
});
