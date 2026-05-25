import { useSettings } from '../SettingsContext';
import { useI18n } from '../hooks/useI18n';
import type { Language, Notation } from '../types';

const ctrlStyle = {
  background: 'var(--bg-card)',
  color: 'var(--fg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 13,
};

export function SettingsBar() {
  const { settings, setLanguage, setNotation } = useSettings();
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 13, color: 'var(--fg-muted)' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {t('settings.language')}:
        <select
          style={ctrlStyle}
          value={settings.language}
          onChange={e => setLanguage(e.target.value as Language)}
        >
          <option value="pt">PT</option>
          <option value="en">EN</option>
        </select>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {t('settings.notation')}:
        <select
          style={ctrlStyle}
          value={settings.notation}
          onChange={e => setNotation(e.target.value as Notation)}
        >
          <option value="letter">{t('notation.letter')}</option>
          <option value="solfege">{t('notation.solfege')}</option>
          <option value="both">{t('notation.both')}</option>
        </select>
      </label>
    </div>
  );
}
