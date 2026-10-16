import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from './SettingsContext';
import { Stats } from './Stats';
import { dueItems, getAttempts, recordAttempt } from './store/attempts';
import { getScore, recordScore } from './store/scores';

function showStats() {
  localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
  render(<SettingsProvider><Stats onBack={() => {}} /></SettingsProvider>);
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const confirm = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
  return { button, confirm };
}

describe('stats resets and reviews', () => {
  it('keeps resets disabled when nothing is saved', () => {
    const { button } = showStats();
    expect(button('Reset Clefs').disabled).toBe(true);
    expect(button('Reset all progress').disabled).toBe(true);
  });

  it('resets a topic that has answer history but no score, review boxes included', () => {
    // One question answered, then the quiz was left: an attempt but no score.
    recordAttempt('claves', 'bass', 'wrong', 900);
    recordAttempt('notas-teclado', 'D', 'wrong', 900);
    const { button, confirm } = showStats();
    const foundations = within(screen.getByRole('region', { name: 'Music-reading foundations' }));
    expect(foundations.getByText('2 due for review')).toBeDefined();
    expect(button('Reset Clefs').disabled).toBe(false);
    expect(button('Reset Staff I — Lines & Spaces').disabled).toBe(true);
    expect(button('Reset all progress').disabled).toBe(false);
    fireEvent.click(button('Reset Clefs'));
    confirm();
    expect(getAttempts('claves')).toEqual({});
    expect(dueItems(['claves', 'notas-teclado']).map(c => c.itemId)).toEqual(['D']);
    expect(foundations.getByText('1 due for review')).toBeDefined();
    expect(button('Reset Clefs').disabled).toBe(true);
  });

  it('resets all scores and answer history', () => {
    recordScore('pauta-i', 80, 'none');
    recordAttempt('pauta-i', 'g/4', 'correct', 900);
    recordAttempt('oitavas', 'octave-5:3', 'wrong', 900);
    const { button, confirm } = showStats();
    fireEvent.click(button('Reset all progress'));
    confirm();
    expect(getScore('pauta-i')).toBeUndefined();
    expect(getAttempts('pauta-i')).toEqual({});
    expect(getAttempts('oitavas')).toEqual({});
    expect(screen.queryByText(/due for review/)).toBeNull();
    expect(button('Reset all progress').disabled).toBe(true);
  });
});
