import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { useElementWidth } from '../hooks/useElementWidth';
import { useI18n } from '../hooks/useI18n';
import { TWO_PANE, useMediaQuery } from '../hooks/useMediaQuery';
import { usePageHidden } from '../hooks/usePageHidden';
import type { QuizRound } from '../hooks/useQuizRound';
import { useSettings } from '../SettingsContext';
import { keyIsTaken } from './AnswerBank';
import { Icon } from './Icon';
import { useQuizNav } from './QuizNav';
import { SettingsSheet } from './SettingsSheet';
import { StageContext } from './Stage';

/**
 * One question in parts. Below 1000 px they stack under each other; from 1000 px the visual takes the
 * left pane of a stage and the prompt, the answers and the feedback share the right column.
 */
export interface QuestionView {
  prompt: ReactNode;
  /** The neck, staff or text being read. */
  visual?: ReactNode;
  /** A line that belongs to the prompt, such as the starting note. */
  note?: ReactNode;
  /** Multiple-choice answers; absent when the answer is a tap on the neck. */
  answers?: ReactNode;
  /** How many choices there are, for the "Press 1–n" hint; 0 when the answer is a tap on the neck. */
  choices: number;
}

type Quiz = Pick<QuizRound<unknown>, 'progress' | 'expired' | 'answered' | 'correct' | 'seconds' | 'timerFraction' | 'reviews' | 'setPaused' | 'next'>;

interface Props {
  title: string;
  onExit: () => void;
  quiz: Quiz;
  question: QuestionView;
  /** Explanation and visuals shown after an answer, under the verdict. */
  feedback?: ReactNode;
  /** Names the round's topic, for decks that mix topics. */
  topic?: string;
  /** An unscored review: its results have no best or last score to compare with. */
  review?: boolean;
  /** Offered with the missed rounds on the results screen: replays the `count` distinct questions missed. */
  reviewMisses?: { count: number; start: () => void };
  /** Replaces restarting the same quiz from the results screen. */
  onPlayAgain?: () => void;
}

function TimerRing({ fraction, seconds }: { fraction: number; seconds: number }) {
  const { t } = useI18n();
  const left = Math.ceil(fraction * seconds);
  const circumference = 2 * Math.PI * 16;
  return (
    <span className={`timer-ring readout${fraction < 0.25 ? ' timer-low' : ''}`} role="timer" aria-label={t('quiz.timeLeft', { s: left })}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" className="timer-track" />
        <circle cx="20" cy="20" r="16" className="timer-fill" strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)} transform="rotate(-90 20 20)" />
      </svg>
      <span aria-hidden="true">{left}</span>
    </span>
  );
}

// A focused control that acts on Enter and Space itself. Disabled controls,
// such as the answered neck's cells, leave the keys to the quiz.
function ownsKey(target: EventTarget | null) {
  return !!(target as HTMLElement | null)?.closest?.(
    'button:not(:disabled), a[href], summary, [role="button"]:not([aria-disabled="true"]), [role="link"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"]',
  );
}

const prefersReducedMotion = () => typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The visual pane's width before it is measured: the stage is two columns, the
// right one 32 % but at least 360 px, with a 24 px gap inside the gutters.
function estimatePaneWidth() {
  const gutter = Math.min(40, Math.max(16, window.innerWidth * 0.02));
  const inner = window.innerWidth - 2 * gutter;
  return Math.max(0, inner - Math.max(360, inner * 0.32) - 24);
}

// The window height left under the top of `ref`, for sizing the visual. The
// top is where the element sits in the page, whichever element scrolls.
function useRoomBelow(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(() => window.innerHeight - 120);
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const scrolled = window.scrollY + (document.getElementById('root')?.scrollTop ?? 0);
      setHeight(Math.max(240, Math.round(window.innerHeight - (el.getBoundingClientRect().top + scrolled) - 16)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref]);
  return height;
}

/** The two-pane quiz (REDESIGN.md, 7.3 and 7.4): the visual left, the column right. */
function StageLayout({ visual, children }: { visual: ReactNode; children: ReactNode }) {
  const visRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(visRef, estimatePaneWidth());
  const height = useRoomBelow(visRef);
  const stage = useMemo(() => ({ wide: true, width, height }), [width, height]);
  return (
    <StageContext.Provider value={stage}>
      <main className="stage">
        <div className="vis" ref={visRef} style={{ '--room': `${height}px` } as CSSProperties}>{visual}</div>
        <div className="col">{children}</div>
      </main>
    </StageContext.Provider>
  );
}

export function GameShell({ title, onExit, quiz, question, feedback, topic, review = false, reviewMisses, onPlayAgain }: Props) {
  const { t, lang } = useI18n();
  const { settings, setSound } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hidden = usePageHidden();
  const wide = useMediaQuery(TWO_PANE);
  const { progress, answered, next, setPaused } = quiz;
  // A round must not time out or advance where it cannot be seen: behind the
  // settings sheet, in a background tab or with the desktop window in the tray.
  useEffect(() => setPaused(settingsOpen || hidden), [settingsOpen, hidden]);
  const autoAdvance = settings.advanceMode === 'auto';

  // Enter or Space continues an answered round: in manual mode when focus has
  // left Continue, and in automatic mode to skip the wait.
  useEffect(() => {
    if (!answered || progress.done) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.key !== 'Enter' && event.key !== ' ') || keyIsTaken(event) || ownsKey(event.target)) return;
      event.preventDefault();
      next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, progress.done, next]);

  // After an answer, Continue takes focus in manual mode; it sits in a bar
  // pinned to the window's bottom, so focusing it needs no scroll. When
  // stacked, the page then scrolls the feedback's verdict to the top unless the
  // feedback is already in view. That waits for the notation in the feedback,
  // which draws in its own effects (they run before this one).
  const continueRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (answered && !progress.done && !autoAdvance) continueRef.current?.focus({ preventScroll: true });
  }, [answered]);
  useEffect(() => {
    const section = feedbackRef.current;
    if (!answered || wide || !section || section.getBoundingClientRect().bottom <= window.innerHeight) return;
    section.scrollIntoView?.({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [answered]);
  // A new round, or the results, start at the top of the page (this also stops
  // a smooth scroll to the last feedback that is still running).
  const pageRef = useRef<HTMLDivElement>(null);
  const shownRound = useRef(progress.round);
  useEffect(() => {
    if (shownRound.current === progress.round && !progress.done) return;
    shownRound.current = progress.round;
    pageRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }, [progress.round, progress.done]);

  const topbar = (
    <header className="topbar" data-tauri-drag-region="deep">
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
    return (
      <div className="page" ref={pageRef}>
        {topbar}
        <Results quiz={quiz} review={review} reviewMisses={reviewMisses} onPlayAgain={onPlayAgain} onExit={onExit} />
        {settingsSheet}
      </div>
    );
  }

  const answeredCount = progress.history.length;
  const last = quiz.reviews[quiz.reviews.length - 1];
  const verdict = quiz.expired ? 'timeout' : quiz.correct ? 'correct' : 'wrong';
  const waitSeconds = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en', { maximumFractionDigits: 1 })
    .format(settings.autoAdvanceDelayMs / 1000);
  const boardHint = !question.choices && !answered;

  const feedbackSection = answered && (
    <section ref={feedbackRef} className={`feedback ${wide ? 'feedback-col' : 'feedback-flow'}`} aria-label={t('quiz.feedback')}>
      <div role="status" className="feedback-body">
        <div className={`verdict verdict-${verdict === 'correct' ? 'ok' : 'bad'}`}>
          <Icon name={verdict === 'correct' ? 'check' : verdict === 'timeout' ? 'clock' : 'cross'} size={22} />
          {t(verdict === 'timeout' ? 'module.timeUp' : verdict === 'correct' ? 'module.correct' : 'module.review')}
        </div>
        {verdict !== 'correct' && last && <p className="feedback-answer">{t('quiz.answerWas', { answer: last.correct })}</p>}
        {feedback}
      </div>
      <div className="continue-bar">
        <button ref={continueRef} type="button" aria-keyshortcuts="Enter"
          className={`btn btn-primary btn-block continue${autoAdvance ? ' auto-fill' : ''}`}
          style={autoAdvance ? { '--advance-ms': `${settings.autoAdvanceDelayMs}ms` } as CSSProperties : undefined}
          onClick={next}>
          <span>{t('common.continue')}</span>
          {autoAdvance
            ? <span className="continue-hint readout" aria-hidden="true">{t('quiz.autoHint', { s: waitSeconds })}</span>
            : <span className="continue-hint key-hint" aria-hidden="true">{t('quiz.enterHint')}</span>}
        </button>
      </div>
    </section>
  );
  const topicLabel = topic && <p className="label question-topic">{topic}</p>;
  const note = question.note && <p className="question-hint">{question.note}</p>;

  return (
    <div ref={pageRef} className={`page quiz${wide ? ' quiz-stage' : ''}`}>
      {topbar}
      <div className="quiz-progress" data-tauri-drag-region="deep">
        <div className="segs" aria-hidden="true">
          {Array.from({ length: progress.totalRounds }, (_, i) => (
            <span key={i} className={i < answeredCount ? (progress.history[i] ? 'ok' : 'bad') : i === progress.round ? 'cur' : ''} />
          ))}
        </div>
        <span className="quiz-round">{t('quiz.round', { n: progress.round + 1, total: progress.totalRounds })}</span>
        <span className="pill pill-ok readout" aria-label={t('quiz.correctCount', { n: progress.correctCount })}>
          <Icon name="check" size={16} />{progress.correctCount}
        </span>
        <span className="pill pill-bad readout" aria-label={t('quiz.wrongCount', { n: answeredCount - progress.correctCount })}>
          <Icon name="cross" size={16} />{answeredCount - progress.correctCount}
        </span>
        {quiz.seconds !== null && <TimerRing fraction={quiz.timerFraction} seconds={quiz.seconds} />}
      </div>
      {wide ? (
        <StageLayout visual={question.visual}>
          {topicLabel}
          <p className="question-prompt">{question.prompt}</p>
          {note}
          {boardHint && <p className="quiz-hint">{t('quiz.boardHint')}</p>}
          {question.answers}
          {feedbackSection || (question.choices > 0 && <>
            <div className="grow" />
            <p className="quiz-hint key-hint">{t('quiz.keysHint', { n: Math.min(question.choices, 9) })}</p>
          </>)}
        </StageLayout>
      ) : (
        <>
          <main className="page-main quiz-main">
            {topicLabel}
            <div className="question">
              <p className="question-prompt">{question.prompt}</p>
              {question.visual && <div className="question-visual">{question.visual}</div>}
              {note}
              {boardHint && <p className="quiz-hint key-hint">{t('quiz.boardHint')}</p>}
              {question.answers}
            </div>
          </main>
          {feedbackSection}
        </>
      )}
      {settingsSheet}
    </div>
  );
}

interface ResultsProps extends Pick<Props, 'review' | 'reviewMisses' | 'onPlayAgain' | 'onExit'> {
  quiz: Quiz;
}

// The score with Play again, Lesson and Back to course; beside it (from
// 1000 px) or under it, the missed rounds with "Review these", or after a
// perfect score the topic that comes next.
function Results({ quiz, review = false, reviewMisses, onPlayAgain, onExit }: ResultsProps) {
  const { t } = useI18n();
  const nav = useQuizNav();
  const { progress } = quiz;
  const pct = Math.round((progress.correctCount / progress.totalRounds) * 100);
  const { previousBest, previousLast } = progress.summary ?? {};
  const misses = quiz.reviews.filter(r => r.result !== 'correct');
  // Asked once this play is saved, so the suggestion already counts it.
  const upNext = !review && misses.length === 0 && progress.summary && nav.upNext ? nav.upNext() : null;
  const chips = [
    previousBest !== undefined && pct > previousBest && <span key="new" className="chip chip-accent">{t('results.newBest')}</span>,
    previousBest !== undefined && <span key="best" className="chip">{t('results.best')} <b className="readout">{Math.max(pct, previousBest)}%</b></span>,
    previousLast !== undefined && <span key="last" className="chip">{t('results.lastTime')} <b className="readout">{previousLast}%</b></span>,
  ].filter(Boolean);

  return (
    <main className="page-main results">
      <section className="card result-card">
        <h2 className="result-title">{t(review ? 'results.reviewComplete' : 'common.complete')}</h2>
        <div className="result-score">
          <span className="bignum readout">{pct}%</span>
          <span className="muted">{t('results.correctOf', { n: progress.correctCount, total: progress.totalRounds })}</span>
        </div>
        {review && <p className="muted small">{t('results.reviewNote')}</p>}
        {chips.length > 0 && <div className="chips">{chips}</div>}
        <div className="actions result-actions">
          <button type="button" className="btn btn-primary" onClick={onPlayAgain ?? progress.restart}>
            <Icon name="retry" /> {t('common.again')}
          </button>
          {nav.learn && (
            <button type="button" className="btn btn-secondary" onClick={nav.learn}>
              <Icon name="book" /> {t('results.lesson')}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onExit}>{t('results.backToCourse')}</button>
        </div>
      </section>
      {quiz.reviews.length > 0 && (
        <section className="card result-misses">
          <h3>{misses.length ? t('results.missed', { n: misses.length }) : t('results.perfect')}</h3>
          {misses.length > 0 && (
            <ul className="missed">
              {misses.map(r => (
                <li key={r.round}>
                  <span className="missed-round readout">{t('results.round', { n: r.round })}</span>
                  <span className="missed-body">
                    <b className="missed-prompt">{r.prompt}</b>
                    <span className="missed-answers">
                      <span className="was">
                        <Icon name={r.given === undefined ? 'clock' : 'cross'} size={14} />
                        <span className="sr-only">{t('results.yourAnswer')}: </span>
                        {r.given ?? t('results.timeout')}
                      </span>
                      <span className="missed-arrow" aria-hidden="true">→</span>
                      <span className="is">
                        <Icon name="check" size={14} />
                        <span className="sr-only">{t('results.rightAnswer')}: </span>
                        {r.correct}
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {misses.length > 0 && reviewMisses && reviewMisses.count > 0 && (
            <button type="button" className="btn btn-secondary btn-block" onClick={reviewMisses.start}>
              <Icon name="retry" /> {t(reviewMisses.count === 1 ? 'results.reviewThis' : 'results.reviewThese', { n: reviewMisses.count })}
            </button>
          )}
          {upNext && (
            <button type="button" className="btn btn-secondary btn-block" onClick={upNext.open}>
              <Icon name={upNext.lesson ? 'book' : 'play'} /> {t('results.upNext', { topic: t(`games.${upNext.id}`) })}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
