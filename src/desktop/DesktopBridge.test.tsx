import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '../SettingsContext';
import { DesktopBridge } from './DesktopBridge';

const { invoke, handlers } = vi.hoisted(() => ({
  invoke: vi.fn(),
  handlers: new Map<string, (event: { payload: unknown }) => void>(),
}));
vi.mock('./shell', () => ({
  invokeShell: (...args: unknown[]) => invoke(...args),
  listenShell: async (name: string, handler: (payload: unknown) => void) => {
    handlers.set(name, payload => handler(payload.payload));
    return () => handlers.delete(name);
  },
}));

const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  handlers.clear();
  invoke.mockReset();
});

describe('desktop bridge', () => {
  it('does nothing in a browser', async () => {
    const onNavigate = vi.fn();
    render(<SettingsProvider><DesktopBridge onNavigate={onNavigate} /></SettingsProvider>);
    await flush();
    expect(invoke).not.toHaveBeenCalled();
    expect(handlers.size).toBe(0);
  });

  it('opens the pending tray route, follows tray navigation and names the tray language', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
    invoke.mockImplementation(async (command: string) => (command === 'take_pending_route' ? 'tuner' : undefined));
    const onNavigate = vi.fn();
    render(<SettingsProvider><DesktopBridge onNavigate={onNavigate} /></SettingsProvider>);
    await flush();
    expect(onNavigate).toHaveBeenCalledWith('tuner');
    expect(invoke).toHaveBeenCalledWith('set_tray_language', { language: 'en' });
    act(() => handlers.get('navigate')!({ payload: 'continue' }));
    act(() => handlers.get('navigate')!({ payload: 'somewhere-else' }));
    expect(onNavigate.mock.calls).toEqual([['tuner'], ['continue']]);
  });
});
