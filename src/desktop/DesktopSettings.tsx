import { useEffect, useId, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { isDesktop } from './DesktopBridge';
import { invokeShell } from './shell';

// "This computer" group of the Settings sheet, desktop build only. The switch
// shows the real autostart entry, read when the sheet opens, not a saved preference.
export function DesktopSettings() {
  const { t } = useI18n();
  const id = useId();
  const [autostart, setAutostart] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isDesktop()) return;
    let disposed = false;
    void invokeShell<boolean>('autostart_enabled').then(enabled => { if (!disposed) setAutostart(enabled); });
    return () => { disposed = true; };
  }, []);

  if (!isDesktop()) return null;
  const toggle = () => {
    const next = !autostart;
    void invokeShell('set_autostart_enabled', { enabled: next }).then(() => setAutostart(next), () => {});
  };

  return (
    <div className="setting-group">
      <div className="setting setting-row">
        <div>
          <div className="setting-label">{t('settings.computer')}</div>
          <div className="setting-name" id={id}>{t('settings.autostart')}</div>
          <p className="setting-hint">{t('settings.autostartHint')}</p>
        </div>
        <button type="button" role="switch" aria-checked={autostart === true} aria-labelledby={id}
          className="switch" disabled={autostart === null} onClick={toggle}>
          <span aria-hidden="true" />
        </button>
      </div>
      <p className="setting-hint">{t('settings.trayNote')}</p>
    </div>
  );
}
