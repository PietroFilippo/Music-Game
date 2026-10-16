import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playEffect } from '../audio/sound';
import { SettingsProvider } from '../SettingsContext';
import { getAttempts } from '../store/attempts';
import { getScore, recordScore } from '../store/scores';
import { useQuizRound } from './useQuizRound';

vi.mock('../audio/sound', () => ({ playEffect: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => <SettingsProvider>{children}</SettingsProvider>;
const saveSettings = (settings: object) =>
  localStorage.setItem('musicgame.settings', JSON.stringify({ advanceMode: 'manual', ...settings }));
const effects = () => vi.mocked(playEffect).mock.calls.map(([effect]) => effect);

describe('quiz round sounds', () => {
  beforeEach(() => vi.mocked(playEffect).mockClear());
  afterEach(() => vi.useRealTimers());

  it('plays one sound per answer and another when the quiz ends', () => {
    saveSettings({});
    const { result } = renderHook(() => useQuizRound<string>('pauta-i', 2), { wrapper });
    act(() => result.current.pick('a', true));
    act(() => result.current.pick('b', false));
    expect(effects()).toEqual(['correct']);
    act(() => result.current.next());
    act(() => result.current.pick('b', false));
    act(() => result.current.next());
    expect(result.current.progress.done).toBe(true);
    expect(effects()).toEqual(['correct', 'wrong', 'complete']);
  });

  it('plays the wrong-answer sound when time runs out', () => {
    vi.useFakeTimers();
    saveSettings({ difficulty: 'hard' });
    renderHook(() => useQuizRound<string>('pauta-i', 10), { wrapper });
    act(() => vi.advanceTimersByTime(4000));
    expect(effects()).toEqual(['wrong']);
  });

  it('records each answer and timeout against the question ID', () => {
    vi.useFakeTimers();
    saveSettings({ difficulty: 'hard' });
    let item = 'q1';
    const { result } = renderHook(() => useQuizRound<string>('pauta-i', 10, { itemId: () => item }), { wrapper });
    act(() => vi.advanceTimersByTime(1500));
    act(() => result.current.pick('a', true));
    act(() => result.current.next());
    item = 'q2';
    act(() => vi.advanceTimersByTime(4000));
    expect(getAttempts('pauta-i')).toMatchObject({
      q1: { seen: 1, correct: 1, last: 'correct', avgMs: 1500 },
      q2: { seen: 1, correct: 0, last: 'timeout', avgMs: 4000 },
    });
  });

  it('records each round under its own game and scores nothing in a review', () => {
    saveSettings({});
    recordScore('claves', 70, 'none');
    const scoresBefore = localStorage.getItem('musicgame.scores');
    const rounds = [['claves', 'treble'], ['pauta-i', 'g/4']] as const;
    let round = 0;
    const { result } = renderHook(() => useQuizRound<string>(null, 2, {
      itemGameId: () => rounds[round][0],
      itemId: () => rounds[round][1],
    }), { wrapper });
    act(() => result.current.pick('G', true));
    act(() => result.current.next());
    round = 1;
    act(() => result.current.pick('A', false));
    act(() => result.current.next());
    expect(result.current.progress.done).toBe(true);
    expect(result.current.progress.summary).toBeNull();
    expect(localStorage.getItem('musicgame.scores')).toBe(scoresBefore);
    expect(getScore('pauta-i')).toBeUndefined();
    expect(getAttempts('claves').treble).toMatchObject({ seen: 1, last: 'correct', box: 2 });
    expect(getAttempts('pauta-i')['g/4']).toMatchObject({ seen: 1, last: 'wrong', box: 1 });
  });

  it('stays silent when sounds are off', () => {
    saveSettings({ sound: false });
    const { result } = renderHook(() => useQuizRound<string>('pauta-i', 1), { wrapper });
    act(() => result.current.pick('a', true));
    act(() => result.current.next());
    expect(result.current.progress.done).toBe(true);
    expect(playEffect).not.toHaveBeenCalled();
  });
});
