import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from './SettingsContext';
import { Stats } from './Stats';
import { dueItems, getAttempts, recordAttempt } from './store/attempts';
import { getScore, recordScore } from './store/scores';

function showStats(props: { onBack?: () => void; onStart?: (id: string) => void } = {}) {
  localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
  render(<SettingsProvider><Stats onBack={props.onBack ?? (() => {})} onStart={props.onStart} /></SettingsProvider>);
  const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
  const confirm = () => fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
  const row = (topic: string) => screen.getByRole('rowheader', { name: topic }).closest('[role=row]') as HTMLElement;
  return { button, confirm, row };
}

describe('stats empty state', () => {
  it('shows one line and starts with Module 1 when nothing is saved', () => {
    const onStart = vi.fn();
    const { button } = showStats({ onStart });
    expect(screen.getByText(/No plays yet/)).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset all progress' })).toBeNull();
    fireEvent.click(button('Start with Module 1'));
    expect(onStart).toHaveBeenCalledWith('pauta-i');
  });

  it('goes back to Home from the empty state without a start action', () => {
    const onBack = vi.fn();
    const { button } = showStats({ onBack });
    fireEvent.click(button('Start with Module 1'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('stats tables', () => {
  it('lists plays and scores with a header row, dashes and low labels', () => {
    recordScore('intervalos', 70, 'none');
    recordScore('intervalos', 30, 'none');
    const { row } = showStats();
    const fretboard = within(screen.getByRole('table', { name: 'Guitar fretboard and intervals' }));
    expect(fretboard.getAllByRole('columnheader').map(h => h.textContent)).toEqual(['Topic', 'Plays', 'Avg', 'Best', 'Last', 'Reset']);
    const intervals = within(row('Intervals'));
    expect(intervals.getAllByRole('cell').slice(0, 4).map(c => c.textContent)).toEqual(['2', '50%low', '70%', '30%low']);
    expect(intervals.getByRole('button', { name: 'Reset Intervals' })).toBeDefined();
    const strings = within(row('Strings and Tuning'));
    expect(strings.getAllByRole('cell').slice(0, 4).map(c => c.textContent)).toEqual(['—', '—', '—', '—']);
    expect(strings.queryByRole('button')).toBeNull();
  });

  it('sums plays, the average, topics played and due reviews in the tiles', () => {
    recordScore('pauta-i', 80, 'none');
    recordScore('pauta-i', 60, 'none');
    recordAttempt('claves', 'bass', 'wrong', 900);
    showStats();
    const tile = (label: string) => screen.getByText(label).parentElement!.querySelector('b')!.textContent;
    expect(tile('plays')).toBe('2');
    expect(tile('overall average')).toBe('70%');
    expect(tile('topics played')).toBe('1/25');
    expect(tile('due for review')).toBe('1');
  });
});

describe('stats resets and reviews', () => {
  it('resets a topic that has answer history but no score, review boxes included', () => {
    // One question answered, then the quiz was left: an attempt but no score.
    recordAttempt('claves', 'bass', 'wrong', 900);
    recordAttempt('notas-teclado', 'D', 'wrong', 900);
    const { button, confirm } = showStats();
    const foundations = within(screen.getByRole('region', { name: 'Music-reading foundations' }));
    expect(foundations.getByText('2 due for review')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Reset Staff I — Lines & Spaces' })).toBeNull();
    fireEvent.click(button('Reset Clefs'));
    confirm();
    expect(getAttempts('claves')).toEqual({});
    expect(dueItems(['claves', 'notas-teclado']).map(c => c.itemId)).toEqual(['D']);
    expect(foundations.getByText('1 due for review')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Reset Clefs' })).toBeNull();
    expect(button('Reset all progress')).toBeDefined();
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
    expect(button('Start with Module 1')).toBeDefined();
  });
});
