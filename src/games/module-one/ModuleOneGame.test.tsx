import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../../SettingsContext';
import { getScore } from '../../store/scores';
import { ModuleOneGame } from './ModuleOneGame';
import { createQuestionDeck, MODULE_ONE_IDS } from './questions';

// Notation rendering is exercised in the browser; these tests cover gameplay.
vi.mock('../../components/Staff', () => ({ Staff: () => <div>Staff diagram</div> }));

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('module 1 games', () => {
  it.each(MODULE_ONE_IDS)('%s completes, records once, and restarts with fresh progress', id => {
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', advanceMode: 'manual' }));
    const deck = createQuestionDeck(id, 'en', 'both');
    render(<StrictMode><SettingsProvider><ModuleOneGame id={id} onExit={() => {}} /></SettingsProvider></StrictMode>);
    for (const question of deck) {
      const correct = question.choices.find(c => c.value === question.correct)!;
      fireEvent.click(screen.getByRole('button', { name: correct.label }));
      expect(screen.getByRole('status').textContent).toContain('Correct!');
      expect((screen.getByRole('button', { name: correct.label }) as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.getByRole('heading', { name: 'Game complete!' })).toBeDefined();
    expect(getScore(id)).toMatchObject({ plays: 1, last: 100, best: 100 });
    expect(getScore(id)!.history).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByText('Round 1 / 10')).toBeDefined();
    const wrong = deck[0].choices.find(c => c.value !== deck[0].correct)!;
    fireEvent.click(screen.getByRole('button', { name: wrong.label }));
    expect(screen.getByRole('status').textContent).toContain('Let’s review');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Score: 0/1 (0%)')).toBeDefined();
    expect(getScore(id)!.plays).toBe(1);
  });

  it('auto-advances a timeout once, gives the next round full time, and cancels pending work on exit', () => {
    vi.useFakeTimers();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', advanceMode: 'auto', difficulty: 'hard' }));
    const { unmount } = render(<SettingsProvider><ModuleOneGame id="notacao-alfabetica" onExit={() => {}} /></SettingsProvider>);
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole('status').textContent).toContain('Time is up');
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText('Round 2 / 10')).toBeDefined();
    expect(screen.queryByRole('status')).toBeNull();
    act(() => vi.advanceTimersByTime(3900));
    expect(screen.queryByRole('status')).toBeNull();
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole('status').textContent).toContain('Time is up');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(getScore('notacao-alfabetica')).toBeUndefined();
  });
});
