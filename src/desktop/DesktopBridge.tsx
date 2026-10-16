import { useEffect, useReducer, useRef } from 'react';
import { useI18n } from '../hooks/useI18n';
import { setShellHidden } from '../hooks/usePageHidden';
import { recommendTopic } from '../Menu';
import { PROGRESS_CHANGED } from '../store/transfer';
import { useSettings } from '../SettingsContext';
import { invokeShell, listenShell } from './shell';

/** True inside the Tauri desktop app. */
export const isDesktop = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Places the tray menu can open. */
export const DESKTOP_ROUTES = ['continue', 'tuner'] as const;
export type DesktopRoute = typeof DESKTOP_ROUTES[number];

const isRoute = (value: unknown): value is DesktopRoute => DESKTOP_ROUTES.includes(value as DesktopRoute);

// Connects the app to the desktop shell (src-tauri): it follows tray navigation,
// keeps the tray menu in the app's language with the recommended topic, and
// learns when the window is hidden in the tray. In a browser it renders nothing
// and loads no Tauri code.
export function DesktopBridge({ onNavigate, screen, busy }: {
  onNavigate: (route: DesktopRoute) => void;
  /** The current screen; the recommendation can change when it does. */
  screen: string;
  /** A quiz is running, so the tray must not replace it. */
  busy: boolean;
}) {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [progress, progressChanged] = useReducer((n: number) => n + 1, 0);
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
    window.addEventListener(PROGRESS_CHANGED, progressChanged);
    return () => window.removeEventListener(PROGRESS_CHANGED, progressChanged);
  }, []);

  useEffect(() => {
    if (!isDesktop()) return;
    const pick = recommendTopic();
    const continueLabel = t(pick.kind === 'continue' ? 'tray.continue' : 'tray.upNext', { topic: t(`games.${pick.id}`) });
    void invokeShell('set_tray_state', { update: { language: settings.language, continueLabel, continueEnabled: !busy } });
  }, [settings.language, screen, busy, progress]);

  return null;
}
