import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../SettingsContext';
import { Fretboard } from './Fretboard';

function renderBoard(props: ComponentProps<typeof Fretboard>) {
  return render(<SettingsProvider><Fretboard {...props} /></SettingsProvider>);
}

describe('fretboard', () => {
  beforeEach(() => localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' })));

  it('is a labeled image when it is display-only', () => {
    renderBoard({ positions: [{ string: 3, fret: 2 }] });
    expect(screen.getByRole('img', { name: 'Guitar fretboard' })).toBeDefined();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('selects positions by pointer and keyboard', () => {
    const onSelect = vi.fn();
    renderBoard({ onSelect });
    expect(screen.getAllByRole('button')).toHaveLength(6 * 13);

    const clicked = screen.getByRole('button', { name: 'String 5, fret 3' });
    fireEvent.click(clicked);
    expect(onSelect).toHaveBeenLastCalledWith({ string: 4, fret: 3 });
    expect(clicked.getAttribute('tabindex')).toBe('0');

    clicked.focus();
    fireEvent.keyDown(clicked, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'String 4, fret 4' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'String 4, open' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onSelect).toHaveBeenLastCalledWith({ string: 3, fret: 0 });
  });

  it('ignores selection while disabled', () => {
    const onSelect = vi.fn();
    renderBoard({ onSelect, disabled: true });
    fireEvent.click(screen.getByRole('button', { name: 'String 1, open' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button').every(b => b.getAttribute('tabindex') === '-1')).toBe(true);
  });
});
