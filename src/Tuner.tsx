import { playNotes } from './audio/sound';
import { readTuning } from './audio/tuning';
import { NavTabs, type Tab } from './components/NavTabs';
import { useI18n } from './hooks/useI18n';
import { useMicrophonePitch } from './hooks/useMicrophonePitch';
import { OPEN_STRING_LETTERS, OPEN_STRING_MIDI } from './music/guitar';
import { shortNoteLabel, spell, spelledLabel } from './music/notes';
import { useSettings } from './SettingsContext';

const LOW_TO_HIGH = [5, 4, 3, 2, 1, 0];
const STATE_ICON = { inTune: '✓', low: '↑', high: '↓' } as const;

export function Tuner({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 38, letterSpacing: -0.5 }}>{t('menu.title')}</h1>
        <p style={{ color: 'var(--fg-muted)', marginTop: 6 }}>{t('menu.subtitle')}</p>
      </header>
      <NavTabs active="tuner" onNavigate={onNavigate} />
      <section className="tuner" aria-labelledby="tuner-title">
        <h2 id="tuner-title" className="tuner-title">{t('tuner.title')}</h2>
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
    </div>
  );
}
