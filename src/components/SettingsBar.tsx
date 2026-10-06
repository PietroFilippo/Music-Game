import { AUTO_DELAY_MAX_MS, AUTO_DELAY_MIN_MS, useSettings } from '../SettingsContext';
import { useI18n } from '../hooks/useI18n';
import { DIFFICULTY_SECONDS } from '../hooks/useAnswerTimer';
import type { CSSProperties } from 'react';
import { ADVANCE_MODES, DIFFICULTIES, type Difficulty, type Language, type Notation } from '../types';

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

function secondsLabel(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SettingsBar() {
  const { settings, setLanguage, setNotation, setAdvanceMode, setAutoAdvanceDelayMs, setDifficulty, setSound } =
    useSettings();
  const { t } = useI18n();
  const autoAdvance = settings.advanceMode === 'auto';

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
          {ADVANCE_MODES.map((mode, index) => {
            const active = settings.advanceMode === mode;
            const style = segmentButtonStyle(active);
            if (index === ADVANCE_MODES.length - 1) style.borderRight = 'none';

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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {t('settings.sound')}:
        <div style={segmentStyle}>
          {[true, false].map(on => {
            const active = settings.sound === on;
            const style = segmentButtonStyle(active);
            if (!on) style.borderRight = 'none';
            return (
              <button key={String(on)} type="button" aria-pressed={active} onClick={() => setSound(on)} style={style}>
                {t(on ? 'sound.on' : 'sound.off')}
              </button>
            );
          })}
        </div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {t('settings.difficulty')}:
        <select
          style={ctrlStyle}
          value={settings.difficulty}
          onChange={e => setDifficulty(e.target.value as Difficulty)}
        >
          {DIFFICULTIES.map(d => {
            const s = DIFFICULTY_SECONDS[d];
            return (
              <option key={d} value={d}>
                {t(`difficulty.${d}`, s === null ? undefined : { s })}
              </option>
            );
          })}
        </select>
      </label>
      <label
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          opacity: autoAdvance ? 1 : 0.5,
        }}
      >
        {t('settings.autoDelay')}:
        <input
          type="range"
          min={AUTO_DELAY_MIN_MS}
          max={AUTO_DELAY_MAX_MS}
          step={100}
          value={settings.autoAdvanceDelayMs}
          disabled={!autoAdvance}
          onChange={e => setAutoAdvanceDelayMs(Number(e.target.value))}
          style={{ width: 110, accentColor: 'var(--accent-strong)' }}
        />
        <span style={{ minWidth: 34, color: 'var(--fg)' }}>
          {secondsLabel(settings.autoAdvanceDelayMs)}
        </span>
      </label>
    </div>
  );
}
