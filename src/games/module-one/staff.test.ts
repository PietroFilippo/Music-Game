import { describe, expect, it, vi } from 'vitest';
import { TREBLE_POSITIONS } from '../../music/theory';
import { createStaffDeck, createStaffPool, STAFF_GAME_IDS, type StaffGameId } from './staff';

// Every item ID the four games could record before they had banks: the target
// note (Staff I, Treble Clef), the clef (Clefs), or the starting note with the
// direction and count (Staff II, whose start was any note keeping the target on the staff).
const LEGACY_IDS: Record<StaffGameId, string[]> = {
  'pauta-i': TREBLE_POSITIONS.map(p => p.vexKey),
  'pauta-ii': (['up', 'down'] as const).flatMap(direction => [1, 2, 3, 4].flatMap(offset =>
    TREBLE_POSITIONS.flatMap((start, i) => {
      const target = direction === 'up' ? i + offset : i - offset;
      return target >= 0 && target < TREBLE_POSITIONS.length ? [`${start.vexKey}:${direction}${offset}`] : [];
    }))),
  claves: ['treble', 'alto', 'bass'],
  'clave-sol': ['g/4', 'a/4', 'b/4'],
};

describe('banks for the original Module 1 games', () => {
  it.each(STAFF_GAME_IDS)('%s builds exactly the item IDs the game recorded before', id => {
    expect(createStaffPool(id, 'en', 'letter').map(q => q.id).sort()).toEqual([...LEGACY_IDS[id]].sort());
    expect(LEGACY_IDS['pauta-ii']).toHaveLength(52);
  });

  it.each(STAFF_GAME_IDS)('%s has valid choices and ten rounds in both languages and all notation modes', id => {
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    for (const lang of ['pt', 'en'] as const) {
      for (const notation of ['letter', 'solfege', 'both'] as const) {
        const pool = createStaffPool(id, lang, notation);
        for (const question of pool) {
          expect(question.prompt.length).toBeGreaterThan(10);
          expect(question.explanation.length).toBeGreaterThan(10);
          expect(question.choices).toHaveLength(id === 'claves' || id === 'clave-sol' ? 3 : 4);
          expect(new Set(question.choices.map(c => c.value)).size).toBe(question.choices.length);
          expect(new Set(question.choices.map(c => c.label)).size).toBe(question.choices.length);
          expect(question.choices.filter(c => c.value === question.correct)).toHaveLength(1);
        }
        const deck = createStaffDeck(id, lang, notation);
        expect(deck).toHaveLength(10);
        // Small pools repeat evenly: no question comes up more than once before all have.
        const counts = pool.map(q => deck.filter(d => d.id === q.id).length);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('counts staff positions the way the lesson does', () => {
    const pool = createStaffPool('pauta-ii', 'en', 'letter');
    const find = (id: string) => pool.find(q => q.id === id)!;
    expect(find('e/4:up3')).toMatchObject({ correct: 'A', hint: { label: 'Starting note', value: 'E' }, fretKey: 'a/4' });
    expect(find('e/4:up3').explanation).toBe('From E, count 3 up: F, G, A. The answer is A.');
    expect(find('c/5:down2')).toMatchObject({ correct: 'A', summary: 'Count 2 DOWN. What is the note? Starting note: C' });
    expect(createStaffPool('pauta-i', 'pt', 'solfege').find(q => q.id === 'c/5')).toMatchObject({
      correct: 'space-3', explanation: 'Espaço 3, contando de baixo para cima: é a nota Dó.',
    });
    expect(createStaffPool('claves', 'en', 'letter').find(q => q.id === 'alto')).toMatchObject({
      visual: { kind: 'clef', clef: 'alto' }, correct: 'C', summary: 'Which note does this clef anchor? (alto clef)',
    });
    expect(createStaffPool('clave-sol', 'en', 'letter').find(q => q.id === 'a/4')).toMatchObject({
      correct: 'A', notation: true, explanation: 'A is on space 2. On the guitar: string 3, fret 2.',
    });
  });
});
