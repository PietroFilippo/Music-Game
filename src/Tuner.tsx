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
// While nothing is heard the readout keeps its full layout, hidden, so the
// card does not change height when a note arrives.
const PLACEHOLDER = readTuning(110);
/** A signed number with a true minus sign, as on a tuner display. */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

function MicIcon() {
  return (
    <svg className="ic" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 17v5" />
    </svg>
  );
}

export function Tuner({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const mic = useMicrophonePitch();
  const reading = mic.frequency === null ? null : readTuning(mic.frequency);
  const shown = reading ?? PLACEHOLDER;
  const format = settings.notation === 'solfege' ? 'solfege' : 'letter';
  const stringName = (s: number) => shortNoteLabel(OPEN_STRING_LETTERS[s], settings.notation, settings.language);
  const heard = `${spelledLabel(spell(shown.midi % 12, '#'), format, settings.language)}${Math.floor(shown.midi / 12) - 1}`;
  const needle = Math.max(-50, Math.min(50, shown.cents));
  const cents = t('tuner.cents', { cents: signed(shown.cents) });
  const listening = mic.status === 'listening';

  return (
    <div className="page">
      <header className="topbar" data-tauri-drag-region="deep">
        <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onBack}><Icon name="back" /></button>
        <h1 className="topbar-title" id="tuner-title">{t('tuner.title')}</h1>
      </header>
      <main className="page-main tuner-main">
        <section className="tuner" aria-labelledby="tuner-title">
          <div className="tuner-left">
            <p className="tuner-intro">{t('tuner.intro')}</p>
            <div className="card tuner-readout" aria-live="polite">
              <div className={`tuner-reading tuner-${shown.state}${reading ? '' : ' is-idle'}`} aria-hidden={!reading}>
                <p className="label">{t('tuner.stringLabel', { n: shown.string + 1 })}</p>
                <p className="tuner-note readout">{stringName(shown.string)}</p>
                <p className="tuner-state">
                  <span aria-hidden="true">{STATE_ICON[shown.state]}</span> {t(`tuner.${shown.state}`)}
                </p>
                <div className="tuner-meter" role="meter" aria-valuemin={-50} aria-valuemax={50} aria-valuenow={needle}
                  aria-valuetext={cents} aria-label={t('tuner.meter')}>
                  <span className="tuner-tick" style={{ left: '25%' }} />
                  <span className="tuner-tick" style={{ left: '50%' }} />
                  <span className="tuner-tick" style={{ left: '75%' }} />
                  <span className="tuner-zone" />
                  <span className="tuner-needle" style={{ left: `${50 + needle}%` }} />
                </div>
                <div className="tuner-scale">
                  <span aria-hidden="true">−50</span>
                  <span className="tuner-cents readout">{cents}</span>
                  <span aria-hidden="true">+50</span>
                </div>
                <p className="tuner-detail">{t('tuner.heard', { note: heard, hz: shown.frequency.toFixed(1) })}</p>
              </div>
              {!reading && (
                <p className="tuner-waiting">
                  {t(listening ? 'tuner.listening' : mic.status === 'starting' ? 'tuner.starting' : 'tuner.idle')}
                </p>
              )}
            </div>
            {mic.error && <p role="alert" className="tuner-error">{t(`tuner.error.${mic.error}`)}</p>}
            <button type="button" className={`btn ${listening ? 'btn-secondary' : 'btn-primary'} tuner-mic`}
              onClick={listening ? mic.stop : mic.start} disabled={mic.status === 'starting'}>
              <MicIcon /> {t(listening ? 'tuner.stop' : 'tuner.start')}
            </button>
            <div className="tuner-notes">
              <p>{t('tuner.hint')}</p>
              <p>{t('tuner.privacy')}</p>
            </div>
          </div>
          <div className="tuner-strings-card">
            <h2 className="tuner-strings-title">{t('tuner.reference')}</h2>
            <div className="tuner-strings">
              {LOW_TO_HIGH.map(s => (
                <button key={s} type="button" className="tuner-string-button" aria-pressed={reading?.string === s}
                  aria-label={t('tuner.referenceString', { n: s + 1, note: stringName(s) })}
                  onClick={() => playNotes([OPEN_STRING_MIDI[s]])}>
                  <span className="tuner-string-n">{s + 1}</span>
                  <strong className="readout">{stringName(s)}</strong>
                  <span className="tuner-string-play"><Icon name="play" size={16} /></span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
