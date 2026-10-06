import { describe, expect, it } from 'vitest';
import { recommendTopic } from './Menu';
import type { GameId, ScoreRecord } from './types';

const save = (records: Partial<Record<GameId, Pick<ScoreRecord, 'best' | 'last'> & { date: string }>>) => {
  const all = Object.fromEntries(Object.entries(records).map(([id, r]) => [id, {
    gameId: id, best: r!.best, last: r!.last, plays: 1, history: [{ percent: r!.last, date: r!.date, difficulty: 'none' }],
  }]));
  localStorage.setItem('musicgame.scores', JSON.stringify(all));
};

describe('continue recommendation', () => {
  it('starts with the first topic of the course', () => {
    expect(recommendTopic()).toEqual({ id: 'pauta-i', kind: 'next' });
  });

  it('returns to the most recent topic while its last score is low', () => {
    save({
      'pauta-i': { best: 90, last: 90, date: '2026-10-01T10:00:00Z' },
      'notas-braco': { best: 80, last: 60, date: '2026-10-05T10:00:00Z' },
    });
    expect(recommendTopic()).toEqual({ id: 'notas-braco', kind: 'continue' });
  });

  it('moves on to the next unplayed topic once the recent one went well', () => {
    save({
      'pauta-i': { best: 90, last: 90, date: '2026-10-01T10:00:00Z' },
      'pauta-ii': { best: 100, last: 100, date: '2026-10-02T10:00:00Z' },
    });
    expect(recommendTopic()).toEqual({ id: 'claves', kind: 'next' });
  });
});
