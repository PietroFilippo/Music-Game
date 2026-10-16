import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playNotes } from './audio/sound';
import type { useMicrophonePitch } from './hooks/useMicrophonePitch';
import { SettingsProvider } from './SettingsContext';
import { Tuner } from './Tuner';

vi.mock('./audio/sound', () => ({ playNotes: vi.fn(), playEffect: vi.fn() }));
// The real hook runs; a test can replace what it reports to show a reading.
const heard = vi.hoisted(() => ({ value: null as null | Partial<ReturnType<typeof useMicrophonePitch>> }));
vi.mock('./hooks/useMicrophonePitch', async importOriginal => {
  const actual = await importOriginal<typeof import('./hooks/useMicrophonePitch')>();
  return { useMicrophonePitch: () => ({ ...actual.useMicrophonePitch(), ...heard.value }) };
});

const renderTuner = () => render(<SettingsProvider><Tuner onBack={() => {}} /></SettingsProvider>);

describe('tuner', () => {
  beforeEach(() => {
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', notation: 'letter' }));
    vi.mocked(playNotes).mockClear();
  });
  afterEach(() => {
    heard.value = null;
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
  });

  it('plays each open string as a reference tone', () => {
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Hear string 6 (E)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hear string 3 (G)' }));
    expect(vi.mocked(playNotes).mock.calls).toEqual([[[40]], [[55]]]);
  });

  it('keeps the readout hidden with one line until a note is heard', () => {
    renderTuner();
    expect(screen.getByText('Turn on the microphone and play an open string.')).toBeDefined();
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.getByRole('button', { name: 'Turn on microphone' }).className).toContain('btn-primary');
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('shows the string, the direction to turn and the distance in cents', () => {
    // A2 is 110 Hz; 12 cents flat is 109.24 Hz.
    heard.value = { status: 'listening', frequency: 109.24 };
    renderTuner();
    expect(screen.getByText('String 5')).toBeDefined();
    expect(screen.getByText('Too low: tighten the string')).toBeDefined();
    const meter = screen.getByRole('meter', { name: 'Distance from the target note, in cents' });
    expect(meter.getAttribute('aria-valuenow')).toBe('-12');
    expect(meter.getAttribute('aria-valuetext')).toBe('−12 cents');
    expect(screen.getByText('Hearing A2 · 109.2 Hz')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Hear string 5 (A)' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Turn off microphone' }).className).toContain('btn-secondary');
    expect(screen.queryByText('Listening… play an open string.')).toBeNull();
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

  it('releases the microphone when audio setup fails', async () => {
    vi.stubGlobal('AudioContext', class { constructor() { throw new DOMException('No audio', 'NotSupportedError'); } });
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
    renderTuner();
    fireEvent.click(screen.getByRole('button', { name: 'Turn on microphone' }));
    await screen.findByRole('alert');
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

