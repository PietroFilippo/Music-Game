import { describe, expect, it } from 'vitest';
import { getAttempts, recordAttempt, resetAttempts } from './attempts';

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
