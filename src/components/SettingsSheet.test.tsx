import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loadSettings, SettingsProvider } from '../SettingsContext';
import { SettingsSheet } from './SettingsSheet';

describe('settings sheet', () => {
  it('changes settings, saves them and closes with Escape', () => {
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', advanceMode: 'manual' }));
    const onClose = vi.fn();
    render(<SettingsProvider><SettingsSheet onClose={onClose} /></SettingsProvider>);
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(document.activeElement).toBe(dialog);

    fireEvent.click(screen.getByRole('button', { name: '4 s' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solfege' }));
    const sound = screen.getByRole('switch', { name: 'Sounds' });
    fireEvent.click(sound);
    expect(sound.getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByRole('slider')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Automatic' }));
    expect(screen.getByRole('slider', { name: 'Delay' })).toBeDefined();
    expect(loadSettings()).toMatchObject({ difficulty: 'hard', notation: 'solfege', sound: false, advanceMode: 'auto' });

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
