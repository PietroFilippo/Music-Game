import { describe, expect, it } from 'vitest';
import { COURSE_MODULES } from '../curriculum';
import { createQuestionPool } from '../games/module-two/questions';
import { questionLookup, relocalize, REVIEW_TOPICS, type QuizItem } from './registry';

describe('review registry', () => {
  it('registers every playable topic, so its questions can be reviewed', () => {
    const unregistered = COURSE_MODULES.flatMap(m => m.games).filter(id => !REVIEW_TOPICS[id]);
    // Add a line to src/review/registry.ts for each topic listed here.
    expect(unregistered).toEqual([]);
  });

  it('finds questions by ID in the current pool and skips unknown IDs and topics', () => {
    const find = questionLookup('oitavas', 'en', 'letter');
    const id = createQuestionPool('oitavas', 'en', 'letter')[0].id;
    expect(find(id)).toMatchObject({ family: 'fretboard', gameId: 'oitavas', question: { id } });
    expect(find('removed-question')).toBeUndefined();
    expect(questionLookup('claves', 'pt', 'solfege')('bass')).toMatchObject({ family: 'reading', question: { correct: 'F' } });
    expect(questionLookup('claves', 'en', 'letter', {})('bass')).toBeUndefined();
  });

  it('rebuilds items in another language in order and keeps the ones it cannot rebuild', () => {
    const pool = createQuestionPool('intervalos', 'en', 'letter');
    const english = pool.slice(0, 2).map((question): QuizItem => ({ family: 'fretboard', gameId: 'intervalos', question }));
    const stale: QuizItem = { family: 'fretboard', gameId: 'intervalos', question: { ...pool[0], id: 'old-format' } };
    const rebuilt = relocalize([english[1], stale, english[0]], 'pt', 'solfege');
    const portuguese = createQuestionPool('intervalos', 'pt', 'solfege');
    expect(rebuilt.map(i => i.question.id)).toEqual([english[1].question.id, 'old-format', english[0].question.id]);
    expect(rebuilt[0].question.prompt).toBe(portuguese.find(q => q.id === english[1].question.id)!.prompt);
    expect(rebuilt[0].question.prompt).not.toBe(english[1].question.prompt);
    expect(rebuilt[1]).toBe(stale);
  });
});
