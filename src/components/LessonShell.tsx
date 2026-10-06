import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';
import { Icon } from './Icon';

export interface LessonStep {
  title?: string;
  body: ReactNode;
}

interface Props {
  title: string;
  steps: LessonStep[];
  onExit: () => void;
  onPractice: () => void;
}

export function LessonShell({ title, steps, onExit, onPractice }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  useEffect(() => {
    if (typeof window.scrollTo === 'function' && !navigator.userAgent.includes('jsdom')) window.scrollTo(0, 0);
  }, [step]);

  return (
    <div className="page">
      <header className="topbar">
        <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onExit}><Icon name="back" /></button>
        <h1 className="topbar-title">{title}</h1>
        <span className="chip">{step + 1} / {steps.length}</span>
      </header>
      <nav className="lesson-steps" aria-label={t('lesson.step', { n: step + 1, total: steps.length })}>
        {steps.map((_, i) => (
          <button key={i} type="button" className={i < step ? 'done' : i === step ? 'cur' : ''}
            aria-label={t('lesson.goToStep', { n: i + 1 })} aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}>
            <span />
          </button>
        ))}
      </nav>
      <main className="lesson-body">
        <p className="eyebrow">{t('lesson.step', { n: step + 1, total: steps.length })}</p>
        {current.title && <h2>{current.title}</h2>}
        <div>{current.body}</div>
      </main>
      <footer className="bottombar">
        <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn btn-secondary">
          <Icon name="chevronLeft" /> {t('lesson.prev')}
        </button>
        {isLast ? (
          <button type="button" onClick={onPractice} className="btn btn-primary">
            {t('common.practice')} <Icon name="arrowRight" />
          </button>
        ) : (
          <button type="button" onClick={() => setStep(s => s + 1)} className="btn btn-primary">
            {t('lesson.next')} <Icon name="chevronRight" />
          </button>
        )}
      </footer>
    </div>
  );
}
