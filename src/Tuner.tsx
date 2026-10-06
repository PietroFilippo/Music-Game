import { playNotes } from './audio/sound';
import { readTuning } from './audio/tuning';
import { Icon } from './components/Icon';
import { useI18n } from './hooks/useI18n';
import { useMicrophonePitch } from './hooks/useMicrophonePitch';
import { OPEN_STRING_LETTERS, OPEN_STRING_MIDI } from './music/guitar';
import { shortNoteLabel, spell, spelledLabel } from './music/notes';
import { useSettings } from './SettingsContext';

const LOW_TO_HIGH = [5, 4, 3, 2, 1, 0];
const STATE_ICON = { inTune: '✓', low: '↑', high: '↓' } as const;

export function Tuner({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const mic = useMicrophonePitch();
  const reading = mic.frequency === null ? null : readTuning(mic.frequency);
  const format = settings.notation === 'solfege' ? 'solfege' : 'letter';
  const stringName = (s: number) => shortNoteLabel(OPEN_STRING_LETTERS[s], settings.notation, settings.language);
  const heard = reading
    && `${spelledLabel(spell(reading.midi % 12, '#'), format, settings.language)}${Math.floor(reading.midi / 12) - 1}`;
  const needle = reading ? Math.max(-50, Math.min(50, reading.cents)) : 0;
  const listening = mic.status === 'listening';

  return (
    <div className="page">
      <header className="topbar">
        <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onBack}><Icon name="back" /></button>
        <h1 className="topbar-title" id="tuner-title">{t('tuner.title')}</h1>
      </header>
      <main className="page-main">
      <section className="tuner" aria-labelledby="tuner-title">
        <p className="tuner-intro">{t('tuner.intro')}</p>
        <div className="tuner-display" aria-live="polite">
          {reading ? (
            <>
              <div className="tuner-string">{t('tuner.string', { n: reading.string + 1, note: stringName(reading.string) })}</div>
              <div className={`tuner-state tuner-${reading.state}`}>
                <span aria-hidden="true">{STATE_ICON[reading.state]}</span> {t(`tuner.${reading.state}`)}
              </div>
              <div className="tuner-meter" role="meter" aria-valuemin={-50} aria-valuemax={50} aria-valuenow={needle}
                aria-label={t('tuner.meter')}>
                <div className="tuner-zone" />
                <div className={`tuner-needle tuner-${reading.state}`} style={{ left: `${50 + needle}%` }} />
              </div>
              <div className="tuner-detail">
                {t('tuner.heard', { note: heard ?? '', hz: reading.frequency.toFixed(1) })}
                {' · '}{reading.cents > 0 ? '+' : ''}{reading.cents} cents
              </div>
            </>
          ) : (
            <p className="tuner-waiting">
              {t(listening ? 'tuner.listening' : mic.status === 'starting' ? 'tuner.starting' : 'tuner.idle')}
            </p>
          )}
        </div>
        {mic.error && <p role="alert" className="tuner-error">{t(`tuner.error.${mic.error}`)}</p>}
        <button type="button" className="btn btn-primary" onClick={listening ? mic.stop : mic.start}
          disabled={mic.status === 'starting'}>
          {t(listening ? 'tuner.stop' : 'tuner.start')}
        </button>
        <h3 className="tuner-subtitle">{t('tuner.reference')}</h3>
        <div className="tuner-strings">
          {LOW_TO_HIGH.map(s => (
            <button key={s} type="button" className="tuner-string-button" aria-pressed={reading?.string === s}
              aria-label={t('tuner.referenceString', { n: s + 1, note: stringName(s) })}
              onClick={() => playNotes([OPEN_STRING_MIDI[s]])}>
              <span>{s + 1}</span>
              <strong>{stringName(s)}</strong>
            </button>
          ))}
        </div>
        <p className="tuner-note">{t('tuner.hint')}</p>
        <p className="tuner-note">{t('tuner.privacy')}</p>
      </section>
      </main>
    </div>
  );
}
