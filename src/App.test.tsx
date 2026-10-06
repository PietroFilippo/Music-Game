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
    fireEvent.change(screen.getByRole('combobox', { name: /Idioma/ }), { target: { value: 'en' } });
    expect(screen.getByText('Sight-reading practice — electric guitar')).toBeDefined();
    const toggle = screen.getByRole('button', { name: /Module 1/ });
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
    const toggle = screen.getByRole('button', { name: /Module 2/ });
    expect(toggle.textContent).toContain('5 lessons + games · in progress');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const section = within(document.getElementById('module-content-fretboard')!);
    expect(section.getByRole('article', { name: 'Strings and Tuning' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Natural Notes on the Neck' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Sharps and Flats' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Octaves on the Neck' })).toBeDefined();
    expect(section.getByRole('article', { name: 'Intervals' })).toBeDefined();
    expect(section.getByRole('heading', { name: 'Coming next' })).toBeDefined();
    expect(section.getByText('Major and natural minor scales on the fretboard')).toBeDefined();
    expect(screen.getByRole('button', { name: /Module 3/ }).textContent).toContain('Planned');
  });
});
