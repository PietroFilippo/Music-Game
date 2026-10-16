import { describe, expect, it } from 'vitest';
import { getScore, recordScore, resetAllScores, resetScore } from './scores';

describe('saved scores', () => {
  it('keeps old scores when adding history and a new module game', () => {
    localStorage.setItem('musicgame.scores', JSON.stringify({
      'pauta-i': { gameId: 'pauta-i', best: 90, last: 70, plays: 3 },
    }));
    expect(getScore('pauta-i')).toMatchObject({ best: 90, plays: 3, history: [] });
    recordScore('pauta-i', 80, 'hard');
    recordScore('notas-teclado', 100, 'none');
    expect(getScore('pauta-i')).toMatchObject({ best: 90, last: 80, plays: 4 });
    expect(getScore('pauta-i')!.history[0]).toMatchObject({ percent: 80, difficulty: 'hard' });
    expect(Number.isNaN(Date.parse(getScore('pauta-i')!.history[0].date))).toBe(false);
    resetScore('notas-teclado');
    expect(getScore('notas-teclado')).toBeUndefined();
    expect(getScore('pauta-i')!.plays).toBe(4);
    localStorage.setItem('musicgame.settings', '{"language":"en"}');
    resetAllScores();
    expect(getScore('pauta-i')).toBeUndefined();
    expect(localStorage.getItem('musicgame.settings')).toBe('{"language":"en"}');
  });

  it('skips malformed records instead of failing or doing math on them', () => {
    localStorage.setItem('musicgame.scores', JSON.stringify({
      'pauta-i': 'bad',
      claves: { best: 'bad', last: 50, plays: '2', history: [null] },
      'clave-sol': { gameId: 'clave-sol', best: 60, last: 60, plays: 1, history: [null, { percent: 60, date: '2026-10-01', difficulty: 'odd' }] },
    }));
    expect(getScore('pauta-i')).toBeUndefined();
    expect(getScore('claves')).toBeUndefined();
    expect(getScore('clave-sol')!.history).toEqual([{ percent: 60, date: '2026-10-01', difficulty: 'none' }]);
    expect(recordScore('claves', 70, 'easy')).toMatchObject({ best: 70, last: 70, plays: 1 });
    localStorage.setItem('musicgame.scores', '[1, 2]');
    expect(getScore('claves')).toBeUndefined();
  });
});

