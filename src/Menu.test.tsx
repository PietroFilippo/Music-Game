import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Menu, recommendTopic } from './Menu';
import { SettingsProvider } from './SettingsContext';
import { recordAttempt } from './store/attempts';
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

describe('review entry on module cards', () => {
  const showMenu = () => {
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
    const onReview = vi.fn();
    render(<SettingsProvider><Menu onPlay={() => {}} onLearn={() => {}} onReview={onReview} onNavigate={() => {}} /></SettingsProvider>);
    const card = (name: string) => within(screen.getByRole('region', { name }));
    return { onReview, module1: card('Music-reading foundations'), module2: card('Guitar fretboard and intervals') };
  };

  it('is hidden without answer history', () => {
    showMenu();
    expect(screen.queryByRole('button', { name: /Review weak spots/ })).toBeNull();
  });

  it('opens a module review with the number of due questions', () => {
    recordAttempt('claves', 'bass', 'wrong', 900);
    recordAttempt('notas-teclado', 'D', 'timeout', 900);
    const { onReview, module1, module2 } = showMenu();
    fireEvent.click(module1.getByRole('button', { name: 'Review weak spots · 2' }));
    expect(onReview).toHaveBeenCalledWith('foundations');
    expect(module2.queryByRole('button', { name: /Review weak spots/ })).toBeNull();
  });

  it('is disabled with a hint when nothing is due yet', () => {
    recordAttempt('notas-braco', 'board-0:3', 'correct', 900);
    const { module2 } = showMenu();
    const button = module2.getByRole('button', { name: 'Review weak spots' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(module2.getByText('Nothing to review today').id).toBe(button.getAttribute('aria-describedby'));
  });
});
