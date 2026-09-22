import { describe, expect, it, vi } from 'vitest';
import { createQuestionDeck, createQuestionPool, descendingNote, MODULE_ONE_IDS } from './questions';

describe('module 1 question banks', () => {
  it.each(MODULE_ONE_IDS)('%s has valid choices and ten rounds in both languages and all notation modes', id => {
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    for (const lang of ['pt', 'en'] as const) {
      for (const notation of ['letter', 'solfege', 'both'] as const) {
        const pool = createQuestionPool(id, lang, notation);
        expect(pool.length).toBeGreaterThanOrEqual(7);
        expect(new Set(pool.map(q => q.id)).size).toBe(pool.length);
        for (const question of pool) {
          expect(question.prompt.length).toBeGreaterThan(10);
          expect(question.explanation.length).toBeGreaterThan(4);
          expect(question.choices).toHaveLength(4);
          expect(new Set(question.choices.map(c => c.value)).size).toBe(4);
          expect(new Set(question.choices.map(c => c.label)).size).toBe(4);
          expect(question.choices.filter(c => c.value === question.correct)).toHaveLength(1);
        }
        const deck = createQuestionDeck(id, lang, notation);
        expect(deck).toHaveLength(10);
        expect(new Set(deck.slice(0, Math.min(10, pool.length)).map(q => q.id)).size).toBe(Math.min(10, pool.length));
      }
    }
  });

  it('counts descending steps across C without counting the starting note', () => {
    expect(descendingNote('G', 1)).toBe('F');
    expect(descendingNote('G', 2)).toBe('E');
    expect(descendingNote('C', 1)).toBe('B');
    expect(descendingNote('C', 2)).toBe('A');
    expect(descendingNote('D', 4)).toBe('G');
    expect(descendingNote('C', 7)).toBe('C');
  });

  it('does not give away alphabetical translations through the both-label setting', () => {
    const pool = createQuestionPool('notacao-alfabetica', 'en', 'both');
    const toLetter = pool.find(q => q.id === 'B-true')!;
    expect(toLetter.visual).toEqual({ kind: 'text', text: 'Ti' });
    expect(toLetter.choices.find(c => c.value === 'B')!.label).toBe('B');
    const toSolfege = pool.find(q => q.id === 'B-false')!;
    expect(toSolfege.visual).toEqual({ kind: 'text', text: 'B' });
    expect(toSolfege.choices.find(c => c.value === 'B')!.label).toBe('Ti');
    expect(createQuestionPool('notacao-alfabetica', 'pt', 'both').find(q => q.id === 'B-true')!.visual)
      .toEqual({ kind: 'text', text: 'Si' });
  });
});
