import { useState, type CSSProperties, type ReactNode } from 'react';
import type { QuizRound } from '../hooks/useQuizRound';
import { useI18n } from '../hooks/useI18n';
import { useSettings } from '../SettingsContext';
import { Icon } from './Icon';
import { SettingsSheet } from './SettingsSheet';

interface Props {
  title: string;
  onExit: () => void;
  quiz: Pick<QuizRound<unknown>, 'progress' | 'expired' | 'answered' | 'correct' | 'seconds' | 'timerFraction' | 'reviews' | 'next'>;
  /** Explanation and visuals shown in the feedback sheet after an answer. */
  feedback?: ReactNode;
  children: ReactNode;
}

function TimerRing({ fraction, seconds }: { fraction: number; seconds: number }) {
  const { t } = useI18n();
  const left = Math.ceil(fraction * seconds);
  const circumference = 2 * Math.PI * 14;
  return (
    <span className={`timer-ring${fraction < 0.25 ? ' timer-low' : ''}`} role="timer" aria-label={t('quiz.timeLeft', { s: left })}>
      <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
        <circle cx="18" cy="18" r="14" className="timer-track" />
        <circle cx="18" cy="18" r="14" className="timer-fill" strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)} transform="rotate(-90 18 18)" />
      </svg>
      <span aria-hidden="true">{left}</span>
    </span>
  );
}

export function GameShell({ title, onExit, quiz, feedback, children }: Props) {
  const { t } = useI18n();
  const { settings, setSound } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { progress } = quiz;

  const topbar = (
    <header className="topbar">
      <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onExit}><Icon name="back" /></button>
      <h1 className="topbar-title">{title}</h1>
      <button type="button" className="ibtn" aria-label={t(settings.sound ? 'quiz.soundOff' : 'quiz.soundOn')}
        onClick={() => setSound(!settings.sound)}>
        <Icon name={settings.sound ? 'sound' : 'mute'} />
      </button>
      <button type="button" className="ibtn" aria-label={t('settings.title')} onClick={() => setSettingsOpen(true)}>
        <Icon name="settings" />
      </button>
    </header>
  );
  const settingsSheet = settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />;

  if (progress.done) {
    const pct = Math.round((progress.correctCount / progress.totalRounds) * 100);
    const { previousBest, previousLast } = progress.summary ?? {};
    const misses = quiz.reviews.filter(r => r.result !== 'correct');
    return (
      <div className="page">
        {topbar}
        <main className="page-main results">
          <section className="card result-hero">
            <h2 className="eyebrow">{t('common.complete')}</h2>
            <div className="result-score">
              <span className="bignum">{pct}%</span>
              <span className="muted">{t('results.correctOf', { n: progress.correctCount, total: progress.totalRounds })}</span>
            </div>
            <div className="chips">
              {previousBest !== undefined && pct > previousBest && <span className="chip chip-accent">{t('results.newBest')}</span>}
              {previousBest !== undefined && <span className="chip">{t('results.best')} <b>{Math.max(pct, previousBest)}%</b></span>}
              {previousLast !== undefined && <span className="chip">{t('results.lastTime')} <b>{previousLast}%</b></span>}
            </div>
          </section>
          {quiz.reviews.length > 0 && (
            <section className="card">
              <h3>{misses.length ? t('results.missed', { n: misses.length }) : t('results.perfect')}</h3>
              {misses.length > 0 && (
                <ul className="missed">
                  {misses.map(r => (
                    <li key={r.round}>
                      <span className="missed-round">{t('results.round', { n: r.round })}</span>
                      <span>
                        <b>{r.prompt}</b><br />
                        <span className="was">{r.given ?? t('results.timeout')}</span>
                        {' → '}
                        <span className="is">{r.correct}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={progress.restart}>
              <Icon name="retry" /> {t('common.again')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onExit}>{t('results.backToCourse')}</button>
          </div>
        </main>
        {settingsSheet}
      </div>
    );
  }

  const answeredCount = progress.history.length;
  const last = quiz.reviews[quiz.reviews.length - 1];
  const verdict = quiz.expired ? 'timeout' : quiz.correct ? 'correct' : 'wrong';
  const autoAdvance = settings.advanceMode === 'auto';

  return (
    <div className="page quiz">
      {topbar}
      <div className="quiz-progress">
        <div className="segs" aria-hidden="true">
          {Array.from({ length: progress.totalRounds }, (_, i) => (
            <span key={i} className={i < answeredCount ? (progress.history[i] ? 'ok' : 'bad') : i === progress.round ? 'cur' : ''} />
          ))}
        </div>
        <div className="quiz-meta">
          <span className="quiz-round">{t('quiz.round', { n: progress.round + 1, total: progress.totalRounds })}</span>
          <span className="pill pill-ok" aria-label={t('quiz.correctCount', { n: progress.correctCount })}>
            <Icon name="check" size={16} />{progress.correctCount}
          </span>
          <span className="pill pill-bad" aria-label={t('quiz.wrongCount', { n: answeredCount - progress.correctCount })}>
            <Icon name="cross" size={16} />{answeredCount - progress.correctCount}
          </span>
          {quiz.seconds !== null && <TimerRing fraction={quiz.timerFraction} seconds={quiz.seconds} />}
        </div>
      </div>
      <main className="page-main quiz-main">{children}</main>
      {quiz.answered && (
        <section className="feedback" aria-label={t('quiz.feedback')}>
          <div role="status" className="feedback-body">
            <div className={`verdict verdict-${verdict === 'correct' ? 'ok' : 'bad'}`}>
              <Icon name={verdict === 'correct' ? 'check' : verdict === 'timeout' ? 'clock' : 'cross'} size={22} />
              {t(verdict === 'timeout' ? 'module.timeUp' : verdict === 'correct' ? 'module.correct' : 'module.review')}
            </div>
            {verdict !== 'correct' && last && <p className="feedback-answer">{t('quiz.answerWas', { answer: last.correct })}</p>}
            {feedback}
          </div>
          <button type="button" className={`btn btn-primary btn-block${autoAdvance ? ' auto-fill' : ''}`}
            style={autoAdvance ? { '--advance-ms': `${settings.autoAdvanceDelayMs}ms` } as CSSProperties : undefined}
            onClick={quiz.next} autoFocus={!autoAdvance}>
            {t('common.continue')}
          </button>
        </section>
      )}
      {settingsSheet}
    </div>
  );
}
