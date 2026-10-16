import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../SettingsContext';
import { DesktopChrome } from './DesktopChrome';
import { DesktopSettings } from './DesktopSettings';

const { win, invoke, handlers } = vi.hoisted(() => ({
  win: {
    maximized: false,
    minimize: vi.fn(async () => {}),
    toggleMaximize: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    isMaximized: vi.fn(async () => false),
    isFocused: vi.fn(async () => true),
    resized: undefined as undefined | (() => void),
    onResized: vi.fn(async (handler: () => void) => { win.resized = handler; return () => {}; }),
    onFocusChanged: vi.fn(async () => () => {}),
  },
  invoke: vi.fn(),
  handlers: new Map<string, (payload: unknown) => void>(),
}));
vi.mock('./shell', () => ({
  currentWindow: async () => win,
  invokeShell: (...args: unknown[]) => invoke(...args),
  listenShell: async (name: string, handler: (payload: unknown) => void) => {
    handlers.set(name, handler);
    return () => handlers.delete(name);
  },
}));

const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));
const desktop = () => { (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}; };

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  handlers.clear();
  invoke.mockReset();
  vi.useRealTimers();
});

describe('desktop window chrome', () => {
  it('renders nothing in a browser', () => {
    const { container } = render(<SettingsProvider><DesktopChrome /></SettingsProvider>);
    expect(container.innerHTML).toBe('');
  });

  it('draws the caption buttons and swaps Maximize for Restore', async () => {
    desktop();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
    render(<SettingsProvider><DesktopChrome /></SettingsProvider>);
    await flush();
    const group = screen.getByRole('group', { name: 'Window controls' });
    expect([...group.querySelectorAll('button')].map(b => b.getAttribute('aria-label'))).toEqual(['Minimize', 'Maximize', 'Close']);
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await flush();
    expect(win.minimize).toHaveBeenCalled();
    expect(win.close).toHaveBeenCalled();
    win.isMaximized.mockResolvedValue(true);
    await act(async () => { win.resized!(); });
    await flush();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeDefined();
    expect(document.documentElement.hasAttribute('data-maximized')).toBe(true);
  });

  it('shows the tray note when the window first closes', async () => {
    desktop();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'pt' }));
    render(<SettingsProvider><DesktopChrome /></SettingsProvider>);
    await flush();
    act(() => handlers.get('tray-hint')!(null));
    expect(screen.getByRole('status').textContent).toBe('O musicgame continua na bandeja');
  });

  it('shows and changes the real autostart entry', async () => {
    desktop();
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
    invoke.mockImplementation(async (command: string) => (command === 'autostart_enabled' ? false : undefined));
    render(<SettingsProvider><DesktopSettings /></SettingsProvider>);
    await flush();
    const toggle = screen.getByRole('switch', { name: 'Start with Windows' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    await flush();
    expect(invoke).toHaveBeenCalledWith('set_autostart_enabled', { enabled: true });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});
