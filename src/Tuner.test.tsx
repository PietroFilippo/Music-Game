import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playNotes } from './audio/sound';
import { SettingsProvider } from './SettingsContext';
import { Tuner } from './Tuner';

vi.mock('./audio/sound', () => ({ playNotes: vi.fn(), playEffect: vi.fn() }));

const renderTuner = () => render(<SettingsProvider><Tuner onBack={() => {}} /></SettingsProvider>);

describe('tuner', () => {
  beforeEach(() => {
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', notation: 'letter' }));
    vi.mocked(playNotes).mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
  });

  it('plays each open string as a reference tone', () => {
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Hear string 6 (E)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hear string 3 (G)' }));
    expect(vi.mocked(playNotes).mock.calls).toEqual([[[40]], [[55]]]);
  });

  it('explains when the browser cannot use the microphone', () => {
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Turn on microphone' }));
    expect(screen.getByRole('alert').textContent).toContain('secure (HTTPS) connection');
  });

  it('explains when microphone access is denied', async () => {
    vi.stubGlobal('AudioContext', class {});
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Turn on microphone' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Microphone access was denied');
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  });
});
