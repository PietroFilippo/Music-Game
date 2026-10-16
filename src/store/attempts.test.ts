import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVAL_DAYS, dueItems, getAttempts, hasAttempts, nextBox, recordAttempt, resetAttempts, weakItems,
} from './attempts';

describe('per-question answer history', () => {
  it('counts answers, tracks the correct streak and averages answer time', () => {
    recordAttempt('notas-braco', 'find-4-C', 'correct', 3000);
    recordAttempt('notas-braco', 'find-4-C', 'correct', 1000);
    expect(getAttempts('notas-braco')['find-4-C']).toMatchObject({ seen: 2, correct: 2, streak: 2, last: 'correct', avgMs: 2000 });
    recordAttempt('notas-braco', 'find-4-C', 'timeout', 8000);
    expect(getAttempts('notas-braco')['find-4-C']).toMatchObject({ seen: 3, correct: 2, streak: 0, last: 'timeout', avgMs: 4000 });
    expect(Number.isNaN(Date.parse(getAttempts('notas-braco')['find-4-C'].lastSeen))).toBe(false);
  });

  it('resets one game or everything', () => {
    recordAttempt('notas-braco', 'board-0:3', 'wrong', 500);
    recordAttempt('pauta-i', 'g/4', 'correct', 500);
    resetAttempts('notas-braco');
    expect(getAttempts('notas-braco')).toEqual({});
    expect(getAttempts('pauta-i')['g/4'].seen).toBe(1);
    resetAttempts();
    expect(getAttempts('pauta-i')).toEqual({});
  });
});

// Local dates, so calendar-day scheduling reads the same in every time zone.
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();

describe('Leitner scheduling', () => {
  it('moves an item up one box per correct answer and back to box 1 on a miss or timeout', () => {
    const results = ['correct', 'correct', 'correct', 'correct', 'correct', 'wrong', 'correct', 'timeout'] as const;
    expect(results.map(result => recordAttempt('pauta-i', 'g/4', result, 500).box)).toEqual([2, 3, 4, 5, 5, 1, 2, 1]);
    expect(nextBox(undefined, 'wrong')).toBe(1);
    expect(nextBox(undefined, 'correct')).toBe(2);
  });

  it('schedules each box after its interval in calendar days', () => {
    expect(BOX_INTERVAL_DAYS).toEqual({ 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 });
    recordAttempt('pauta-i', 'miss', 'wrong', 500, at(10, 21));
    recordAttempt('pauta-i', 'once', 'correct', 500, at(10, 21));
    expect(dueItems(['pauta-i'], at(10, 22)).map(c => c.itemId)).toEqual(['miss']);
    // Answered at 9 pm, box 2 is due from midnight, not 24 hours later.
    expect(dueItems(['pauta-i'], at(11, 7)).map(c => c.itemId)).toEqual(['miss', 'once']);
    recordAttempt('pauta-i', 'once', 'correct', 500, at(11, 8));
    expect(getAttempts('pauta-i').once.box).toBe(3);
    expect(dueItems(['pauta-i'], at(13, 23)).map(c => c.itemId)).toEqual(['miss']);
    expect(dueItems(['pauta-i'], at(14, 0)).map(c => c.itemId)).toEqual(['miss', 'once']);
  });

  it('ranks due items first, then by box, accuracy and age', () => {
    const play = (gameId: 'pauta-i' | 'claves', itemId: string, results: ('correct' | 'wrong')[], day: number) =>
      results.forEach((result, i) => recordAttempt(gameId, itemId, result, 500, at(day, 8 + i)));
    play('pauta-i', 'known', ['correct', 'correct', 'correct'], 1); // box 4, due on the 8th
    play('pauta-i', 'fresh', ['correct'], 9);                        // box 2, not due until the 10th
    play('pauta-i', 'missedOnce', ['correct', 'wrong'], 5);          // box 1, accuracy 1/2
    play('claves', 'alwaysMissed', ['wrong', 'wrong'], 6);           // box 1, accuracy 0
    play('claves', 'oldMiss', ['correct', 'wrong'], 2);              // box 1, accuracy 1/2, seen earlier
    play('claves', 'gotBack', ['wrong', 'correct'], 7);              // box 2, due on the 8th
    const order = weakItems(['pauta-i', 'claves'], at(9, 20)).map(c => c.itemId);
    expect(order).toEqual(['alwaysMissed', 'oldMiss', 'missedOnce', 'gotBack', 'known', 'fresh']);
    expect(dueItems(['pauta-i', 'claves'], at(9, 20)).map(c => c.itemId)).toEqual(order.slice(0, 5));
    expect(dueItems(['claves'], at(9, 20)).map(c => c.gameId)).toEqual(['claves', 'claves', 'claves']);
  });
});

describe('saved answer history', () => {
  const save = (value: unknown) => localStorage.setItem('musicgame.attempts', JSON.stringify(value));

  it('derives a box for records saved before scheduling without rewriting them', () => {
    const old = (streak: number) => ({
      seen: 8, correct: 6, streak, last: streak ? 'correct' : 'wrong', lastSeen: new Date(at(1)).toISOString(), avgMs: 900,
    });
    save({ 'pauta-i': { a: old(0), b: old(1), c: old(3), d: old(6) } });
    expect(Object.values(getAttempts('pauta-i')).map(r => r.box)).toEqual([1, 2, 4, 5]);
    expect(dueItems(['pauta-i'], at(2)).map(c => c.itemId)).toEqual(['a', 'b']);
    recordAttempt('claves', 'treble', 'correct', 500);
    expect(JSON.parse(localStorage.getItem('musicgame.attempts')!)['pauta-i'].c).toEqual(old(3));
    // The next answer continues from the derived box.
    expect(recordAttempt('pauta-i', 'c', 'correct', 500).box).toBe(5);
    expect(recordAttempt('pauta-i', 'b', 'wrong', 500)).toMatchObject({ box: 1, seen: 9, correct: 6, streak: 0 });
  });

  it('skips corrupt and partial records instead of doing arithmetic on them', () => {
    const valid = { seen: 4, correct: 3, streak: 2, last: 'correct', lastSeen: 'yesterday', avgMs: 812.5 };
    save({
      'pauta-i': {
        ok: valid,
        boxed: { ...valid, box: 4 },
        badBox: { ...valid, box: 9 },
        fractionalBox: { ...valid, box: 2.5 },
        slowText: { ...valid, avgMs: 'fast' },
        noLast: { ...valid, last: undefined },
        oddLast: { ...valid, last: 'maybe' },
        noDate: { ...valid, lastSeen: 17 },
        tooManyCorrect: { ...valid, correct: 5 },
        longStreak: { ...valid, streak: 4 },
        negative: { ...valid, seen: -1 },
        fractional: { ...valid, seen: 4.5 },
        stringCount: { ...valid, seen: '4' },
        neverSeen: { ...valid, seen: 0, correct: 0, streak: 0 },
        empty: {}, text: 'oops', list: [1, 2], none: null,
      },
      claves: 'broken',
      'clave-sol': [],
    });
    expect(getAttempts('pauta-i')).toEqual({ ok: { ...valid, box: 3 }, boxed: { ...valid, box: 4 } });
    expect(getAttempts('claves')).toEqual({});
    // An unreadable date counts as due now.
    expect(dueItems(['pauta-i', 'claves', 'clave-sol'], at(1)).map(c => c.itemId)).toEqual(['ok', 'boxed']);
    // The next answer to a skipped question starts over.
    expect(recordAttempt('claves', 'bass', 'wrong', 500)).toMatchObject({ seen: 1, box: 1 });
    expect(recordAttempt('pauta-i', 'slowText', 'correct', 500)).toMatchObject({ seen: 1, correct: 1, avgMs: 500, box: 2 });
    expect(JSON.parse(localStorage.getItem('musicgame.attempts')!)['pauta-i'].badBox).toEqual({ ...valid, box: 9 });
    save('not an object');
    expect(weakItems(['pauta-i'])).toEqual([]);
    expect(hasAttempts(['pauta-i'])).toBe(false);
    save([{ seen: 1 }]);
    expect(recordAttempt('pauta-i', 'g/4', 'correct', 500).seen).toBe(1);
    expect(Object.keys(getAttempts('pauta-i'))).toEqual(['g/4']);
  });
});
