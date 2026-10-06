import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { loadSettings } from './SettingsContext';
import { getScore, recordScore, resetAllScores } from './store/scores';

describe('settings and storage', () => {
  it('replaces invalid saved settings with defaults', () => {
    localStorage.setItem('musicgame.settings', JSON.stringify({
      language: 'fr', notation: 'letter', advanceMode: 7, autoAdvanceDelayMs: 99999, difficulty: 'hard', sound: 'loud',
    }));
    expect(loadSettings()).toEqual({
      language: 'pt', notation: 'letter', advanceMode: 'auto', autoAdvanceDelayMs: 900, difficulty: 'hard', sound: true,
    });
    localStorage.setItem('musicgame.settings', 'not json');
    expect(loadSettings().language).toBe('pt');
  });

  it('keeps working when browser storage is blocked', () => {
    const blocked = () => { throw new DOMException('Storage is disabled', 'SecurityError'); };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('Sight-reading practice — electric guitar')).toBeDefined();
    const module1 = within(screen.getByRole('region', { name: 'Music-reading foundations' }));
    const toggle = module1.getByRole('button', { name: /Hide topics/ });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    expect(recordScore('pauta-i', 80, 'none')).toMatchObject({ plays: 1, last: 80 });
    expect(getScore('pauta-i')).toBeUndefined();
    expect(() => resetAllScores()).not.toThrow();
  });
});

describe('menu', () => {
  it('lists module 2 topics alongside the topics still to come', () => {
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
    render(<App />);
    const module2 = within(screen.getByRole('region', { name: 'Guitar fretboard and intervals' }));
    expect(module2.getByText('Module 2 · in progress')).toBeDefined();
    expect(module2.getByRole('button', { name: /Hide topics/ }).getAttribute('aria-expanded')).toBe('true');
    const section = within(document.getElementById('module-content-fretboard')!);
    expect(section.getByRole('article', { name: 'Strings and Tuning' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Natural Notes on the Neck' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Sharps and Flats' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Octaves on the Neck' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Intervals' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Major and Minor Scales' })).toBeDefined();
    expect(section.getByRole('heading', { name: 'Coming next' })).toBeDefined();
    expect(section.getByText('Connections between staff, tablature, fretboard and rhythm')).toBeDefined();
    const module3 = within(screen.getByRole('region', { name: 'Triads, chords and arpeggios' }));
    expect(module3.getByText('Module 3 · planned')).toBeDefined();
    expect(module3.getByRole('button', { name: /See planned topics/ }).getAttribute('aria-expanded')).toBe('false');
  });
});
