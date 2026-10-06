import { useId } from 'react';
import { DIFFICULTY_SECONDS } from '../hooks/useAnswerTimer';
import { useI18n } from '../hooks/useI18n';
import { noteLabel } from '../music/notes';
import { AUTO_DELAY_MAX_MS, AUTO_DELAY_MIN_MS, useSettings } from '../SettingsContext';
import { ADVANCE_MODES, DIFFICULTIES, LANGUAGES, NOTATIONS } from '../types';
import { Sheet } from './Sheet';

interface Option<T> {
  value: T;
  label: string;
}

function Segmented<T extends string>({ label, hint, value, options, onChange }: {
  label: string;
  hint?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="setting">
      <div className="setting-label" id={id}>{label}</div>
      <div className="segmented" role="group" aria-labelledby={id}>
        {options.map(o => (
          <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="setting-hint">{hint}</p>}
    </div>
  );
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const { settings, setLanguage, setNotation, setAdvanceMode, setAutoAdvanceDelayMs, setDifficulty, setSound } = useSettings();
  const delayId = useId();
  const soundId = useId();

  return (
    <Sheet title={t('settings.title')} onClose={onClose}>
      <Segmented label={t('settings.language')} value={settings.language} onChange={setLanguage}
        options={LANGUAGES.map(value => ({ value, label: value === 'pt' ? 'Português' : 'English' }))} />
      <Segmented label={t('settings.notation')} value={settings.notation} onChange={setNotation}
        hint={t('settings.notationHint', { example: ['C', 'D', 'E'].map(l => noteLabel(l as 'C', settings.notation, lang)).join(' · ') })}
        options={NOTATIONS.map(value => ({ value, label: t(`settings.notation.${value}`) }))} />
      <Segmented label={t('settings.advance')} value={settings.advanceMode} onChange={setAdvanceMode}
        options={ADVANCE_MODES.map(value => ({ value, label: t(`settings.advance.${value}`) }))} />
      {settings.advanceMode === 'auto' && (
        <div className="setting">
          <label className="setting-label" htmlFor={delayId}>{t('settings.autoDelay')}</label>
          <div className="setting-slider">
            <input id={delayId} type="range" min={AUTO_DELAY_MIN_MS} max={AUTO_DELAY_MAX_MS} step={100}
              value={settings.autoAdvanceDelayMs} onChange={e => setAutoAdvanceDelayMs(Number(e.target.value))} />
            <output htmlFor={delayId}>{(settings.autoAdvanceDelayMs / 1000).toFixed(1)} s</output>
          </div>
        </div>
      )}
      <Segmented label={t('settings.difficulty')} value={settings.difficulty} onChange={setDifficulty}
        hint={t('settings.difficultyHint')}
        options={DIFFICULTIES.map(value => {
          const seconds = DIFFICULTY_SECONDS[value];
          return { value, label: seconds === null ? t('difficulty.none') : `${seconds} s` };
        })} />
      <div className="setting setting-row">
        <div>
          <div className="setting-label" id={soundId}>{t('settings.sound')}</div>
          <p className="setting-hint">{t('settings.soundHint')}</p>
        </div>
        <button type="button" role="switch" aria-checked={settings.sound} aria-labelledby={soundId}
          className="switch" onClick={() => setSound(!settings.sound)}>
          <span aria-hidden="true" />
        </button>
      </div>
      <p className="setting-hint">{t('settings.saved')}</p>
    </Sheet>
  );
}
