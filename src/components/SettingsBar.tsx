import { useSettings } from '../SettingsContext';
import { useI18n } from '../hooks/useI18n';
import type { CSSProperties } from 'react';
import type { AdvanceMode, Language, Notation } from '../types';

const ctrlStyle = {
  background: 'var(--bg-card)',
  color: 'var(--fg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 13,
};

const segmentStyle: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid var(--border)',
  borderRadius: 6,
  overflow: 'hidden',
};

function segmentButtonStyle(active: boolean): CSSProperties {
  return {
    background: active ? 'var(--accent-strong)' : 'var(--bg-card)',
    color: active ? '#0f0f0f' : 'var(--fg)',
    border: 'none',
    borderRight: '1px solid var(--border)',
    padding: '5px 9px',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
  };
}

export function SettingsBar() {
  const { settings, setLanguage, setNotation, setAdvanceMode } = useSettings();
  const { t } = useI18n();
  const advanceModes: AdvanceMode[] = ['auto', 'manual'];

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        marginTop: 14,
        fontSize: 13,
        color: 'var(--fg-muted)',
        flexWrap: 'wrap',
      }}
    >
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {t('settings.advance')}:
        <div style={segmentStyle}>
          {advanceModes.map((mode, index) => {
            const active = settings.advanceMode === mode;
            const style = segmentButtonStyle(active);
            if (index === advanceModes.length - 1) style.borderRight = 'none';

            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setAdvanceMode(mode)}
                style={style}
              >
                {t(`advance.${mode}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
