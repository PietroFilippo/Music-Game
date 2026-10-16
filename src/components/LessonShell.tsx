import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';
import { TWO_PANE, useMediaQuery } from '../hooks/useMediaQuery';
import { Icon } from './Icon';

export interface LessonStep {
  title?: string;
  /** The explanation. */
  body: ReactNode;
  /** Diagrams, boards and Listen buttons: in the visual panel beside the text on wide
   *  screens (REDESIGN.md 7.2), under the text otherwise. */
  visual?: ReactNode;
}

interface Props {
  title: string;
  steps: LessonStep[];
  onExit: () => void;
  onPractice: () => void;
}

// Controls that use the arrow keys themselves keep them: text fields, sliders and
// the fretboard explorer's cells. Elsewhere ← and → change steps.
const OWNS_ARROWS = 'input, textarea, select, [contenteditable="true"], [role="slider"], .fretboard';

export function LessonShell({ title, steps, onExit, onPractice }: Props) {
  const { t } = useI18n();
  const wide = useMediaQuery(TWO_PANE);
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const column = useRef<HTMLDivElement>(null);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const total = steps.length;
  const stepTitle = (i: number) => steps[i].title ?? t('lesson.stepN', { n: i + 1 });

  const clamp = (n: number) => Math.min(total - 1, Math.max(0, n));
  const move = (delta: number) => setStep(s => clamp(s + delta));

  useEffect(() => {
    setSeen(s => (s.has(step) ? s : new Set(s).add(step)));
    column.current?.scrollTo?.(0, 0);
    if (navigator.userAgent.includes('jsdom')) return;
    // The desktop app scrolls #root instead of the window.
    window.scrollTo?.(0, 0);
    document.getElementById('root')?.scrollTo?.(0, 0);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target instanceof Element && e.target.closest(OWNS_ARROWS)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      setStep(s => Math.min(total - 1, Math.max(0, s + (e.key === 'ArrowRight' ? 1 : -1))));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const state = (i: number) => (i === step ? 'cur' : seen.has(i) ? 'done' : '');

  const topbar = (
    <header className="topbar" data-tauri-drag-region="deep">
      <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onExit}><Icon name="back" /></button>
      <h1 className="topbar-title">{title}</h1>
      <span className="chip readout">{step + 1} / {total}</span>
    </header>
  );

  // The same buttons in both layouts; Next keeps focus after a click, so Enter repeats.
  const nav = (
    <>
      <button type="button" onClick={() => move(-1)} disabled={step === 0} className="btn btn-secondary lesson-prev">
        <Icon name="chevronLeft" /> {t('lesson.prev')}
      </button>
      {isLast ? (
        <button type="button" onClick={onPractice} className="btn btn-primary lesson-next">
          {t('common.practice')} <Icon name="arrowRight" />
        </button>
      ) : (
        <button type="button" onClick={() => move(1)} className="btn btn-primary lesson-next">
          {t('lesson.next')} <Icon name="chevronRight" />
        </button>
      )}
    </>
  );

  if (wide) {
    return (
      <div className="page lesson-page">
        {topbar}
        <main className={current.visual ? 'lesson' : 'lesson lesson-text-only'}>
          <div className="lesson-column" ref={column}>
            <nav aria-label={t('lesson.steps')}>
              <ol className="lesson-list">
                {steps.map((_, i) => (
                  <li key={i}>
                    <button type="button" className={state(i)} aria-current={i === step ? 'step' : undefined}
                      onClick={() => setStep(i)}>
                      <span className="lesson-num readout" aria-hidden="true">
                        {state(i) === 'done' ? <Icon name="check" size={13} /> : i + 1}
                      </span>
                      <span className="lesson-list-title">{stepTitle(i)}</span>
                      {state(i) === 'done' && <span className="visually-hidden"> ({t('lesson.done')})</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            {current.title && <h2 className="lesson-heading">{current.title}</h2>}
            <div className="lesson-text">{current.body}</div>
            <div className="lesson-nav">{nav}</div>
          </div>
          {current.visual && (
            <div className="lesson-panel">
              <div className="lesson-visual">{current.visual}</div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="page lesson-page">
      {topbar}
      <nav className="lesson-steps" aria-label={t('lesson.steps')}>
        {steps.map((_, i) => (
          <button key={i} type="button" className={state(i)}
            aria-label={t('lesson.goToStep', { n: i + 1 })} aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}>
            <span />
          </button>
        ))}
      </nav>
      <main className="lesson-body">
        <p className="label">{t('lesson.step', { n: step + 1, total })}</p>
        {current.title && <h2 className="lesson-heading">{current.title}</h2>}
        <div className="lesson-text">{current.body}</div>
        {current.visual && <div className="lesson-visual">{current.visual}</div>}
      </main>
      <footer className="bottombar">{nav}</footer>
    </div>
  );
}
