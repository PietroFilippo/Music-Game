import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';
import { isDesktop } from './DesktopBridge';
import { currentWindow, listenShell } from './shell';

// Window chrome for the frameless desktop window, direction B of
// docs/design/DESKTOP.md: Windows 11 caption buttons flush in the top-right
// corner, painted in the app's colors, plus a drag strip across the window
// margins. Renders nothing in a browser.

const GLYPHS: Record<'minimize' | 'maximize' | 'restore' | 'close', ReactNode> = {
  minimize: <path d="M0 5h10" shapeRendering="crispEdges" />,
  maximize: <rect x=".5" y=".5" width="9" height="9" rx="1" shapeRendering="crispEdges" />,
  restore: <>
    <path d="M2.5 2.5V1.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7.5" />
    <rect x=".5" y="2.5" width="7" height="7" rx="1" />
  </>,
  close: <path d="M.5 .5l9 9M9.5 .5l-9 9" />,
};

function CaptionButton({ glyph, label, className = '', onClick }: {
  glyph: keyof typeof GLYPHS; label: string; className?: string; onClick: () => void;
}) {
  return (
    <button type="button" className={`caption-btn ${className}`} aria-label={label} title={label} onClick={onClick}>
      <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true" focusable="false">
        {GLYPHS[glyph]}
      </svg>
    </button>
  );
}

function WindowControls() {
  const { t } = useI18n();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let disposed = false;
    const stops: (() => void)[] = [];
    const root = document.documentElement;
    void (async () => {
      const win = await currentWindow();
      const syncMaximized = async () => {
        const value = await win.isMaximized();
        if (disposed) return;
        setMaximized(value);
        root.toggleAttribute('data-maximized', value);
      };
      const syncFocus = (focused: boolean) => root.toggleAttribute('data-window-blurred', !focused);
      stops.push(await win.onResized(() => { void syncMaximized(); }), await win.onFocusChanged(e => syncFocus(e.payload)));
      if (disposed) return stops.forEach(stop => stop());
      await syncMaximized();
      syncFocus(await win.isFocused());
    })();
    return () => {
      disposed = true;
      stops.forEach(stop => stop());
    };
  }, []);

  const run = (action: (win: Awaited<ReturnType<typeof currentWindow>>) => Promise<void>) => () => {
    void currentWindow().then(action);
  };

  return (
    <div className="caption" role="group" aria-label={t('window.controls')}>
      <CaptionButton glyph="minimize" label={t('window.minimize')} onClick={run(win => win.minimize())} />
      <CaptionButton glyph={maximized ? 'restore' : 'maximize'} label={t(maximized ? 'window.restore' : 'window.maximize')}
        onClick={run(win => win.toggleMaximize())} />
      {/* Close hides the window to the tray; Quit lives in the tray menu. */}
      <CaptionButton glyph="close" className="caption-close" label={t('window.close')} onClick={run(win => win.close())} />
    </div>
  );
}

/** The one-time note shown on the first close, just before the window goes to the tray. */
function TrayHint() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let timeout: number | undefined;
    let stop: (() => void) | undefined;
    let disposed = false;
    void listenShell('tray-hint', () => {
      setVisible(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setVisible(false), 2600);
    }).then(unlisten => { if (disposed) unlisten(); else stop = unlisten; });
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      stop?.();
    };
  }, []);
  return visible ? <div className="tray-hint" role="status">{t('window.trayHint')}</div> : null;
}

export function DesktopChrome() {
  if (!isDesktop()) return null;
  return (
    <>
      {/* The empty margins beside the page column drag the window too. */}
      <div className="drag-strip" data-tauri-drag-region="" />
      <TrayHint />
      <WindowControls />
    </>
  );
}
