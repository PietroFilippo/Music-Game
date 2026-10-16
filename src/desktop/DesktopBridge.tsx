import { useEffect, useRef } from 'react';
import { setShellHidden } from '../hooks/usePageHidden';
import { useSettings } from '../SettingsContext';
import { invokeShell, listenShell } from './shell';

/** True inside the Tauri desktop app. */
export const isDesktop = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Places the tray menu can open. */
export const DESKTOP_ROUTES = ['continue', 'tuner'] as const;
export type DesktopRoute = typeof DESKTOP_ROUTES[number];

const isRoute = (value: unknown): value is DesktopRoute => DESKTOP_ROUTES.includes(value as DesktopRoute);

// Connects the app to the desktop shell (src-tauri): it follows tray navigation,
// keeps the tray menu in the app's language and learns when the window is hidden
// in the tray. In a browser it renders nothing and loads no Tauri code.
export function DesktopBridge({ onNavigate }: { onNavigate: (route: DesktopRoute) => void }) {
  const { settings } = useSettings();
  const navigate = useRef(onNavigate);
  navigate.current = onNavigate;

  useEffect(() => {
    if (!isDesktop()) return;
    let disposed = false;
    const unlisten: (() => void)[] = [];
    void (async () => {
      const stop = await Promise.all([
        listenShell<unknown>('navigate', route => { if (isRoute(route)) navigate.current(route); }),
        listenShell<boolean>('shell-hidden', hidden => setShellHidden(hidden === true)),
      ]);
      unlisten.push(...stop);
      if (disposed) return unlisten.forEach(u => u());
      // A window rebuilt by the tray learns where to open once it is listening.
      const pending = await invokeShell<string | null>('take_pending_route');
      if (!disposed && isRoute(pending)) navigate.current(pending);
    })();
    return () => {
      disposed = true;
      unlisten.forEach(u => u());
    };
  }, []);

  useEffect(() => {
    if (!isDesktop()) return;
    void invokeShell('set_tray_language', { language: settings.language });
  }, [settings.language]);

  return null;
}
