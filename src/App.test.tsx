import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { loadSettings } from './SettingsContext';
import { getScore, recordScore, resetAllScores } from './store/scores';

describe('settings and storage', () => {
  it('replaces invalid saved settings with defaults', () => {
    localStorage.setItem('musicgame.settings', JSON.stringify({
      language: 'fr', notation: 'letter', advanceMode: 7, autoAdvanceDelayMs: 99999, difficulty: 'hard',
    }));
    expect(loadSettings()).toEqual({
      language: 'pt', notation: 'letter', advanceMode: 'auto', autoAdvanceDelayMs: 900, difficulty: 'hard',
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
