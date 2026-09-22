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
});
