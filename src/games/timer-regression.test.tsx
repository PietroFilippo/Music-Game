import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../SettingsContext';
import { PautaI } from './pauta-i/PautaI';
import { PautaII } from './pauta-ii/PautaII';
import { Claves } from './claves/Claves';
import { ClaveSol } from './clave-sol/ClaveSol';

vi.mock('../components/Staff', () => ({ Staff: () => <div>Staff diagram</div> }));
vi.mock('../components/GuitarTab', () => ({ GuitarTab: () => <div>Guitar tab</div> }));
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe.each([
  ['Staff I', PautaI], ['Staff II', PautaII], ['Clefs', Claves], ['Treble Clef', ClaveSol],
] as const)('%s timed rounds', (_name, Game) => {
  it.each(['manual', 'auto'])('resets after a timeout with %s advance', advanceMode => {
    vi.useFakeTimers();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', advanceMode, difficulty: 'hard' }));
    render(<SettingsProvider><Game onExit={() => {}} /></SettingsProvider>);
    act(() => vi.advanceTimersByTime(4000));
    const answers = () => within(screen.getByRole('main')).getAllByRole('button').filter(b => b.textContent !== 'Continue');
    expect(answers().every(b => (b as HTMLButtonElement).disabled)).toBe(true);
    if (advanceMode === 'manual') fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    else act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText('Round 2 of 10')).toBeDefined();
    expect(answers().every(b => !(b as HTMLButtonElement).disabled)).toBe(true);
    act(() => vi.advanceTimersByTime(3900));
    expect(answers().every(b => !(b as HTMLButtonElement).disabled)).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(answers().every(b => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('cancels a pending automatic advance when the player leaves', () => {
    vi.useFakeTimers();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', advanceMode: 'auto' }));
    const { unmount } = render(<SettingsProvider><Game onExit={() => {}} /></SettingsProvider>);
    fireEvent.click(within(screen.getByRole('main')).getAllByRole('button')[0]);
    // jsdom queues a zero-delay timer for each localStorage write; flush those.
    act(() => vi.advanceTimersByTime(0));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
