import { useState, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';

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

const layout: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 24,
};

const primaryBtn: CSSProperties = {
  padding: '12px 22px',
  background: 'var(--accent-strong)',
  color: '#0f0f0f',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
};

const secondaryBtn: CSSProperties = {
  padding: '12px 22px',
  background: 'var(--bg-card)',
  color: 'var(--fg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 15,
};

const ghostBtn: CSSProperties = {
  background: 'transparent',
  color: 'var(--fg-muted)',
  border: 'none',
  fontSize: 14,
  cursor: 'pointer',
  padding: 4,
};

export function LessonShell({ title, steps, onExit, onPractice }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={layout}>
      <header
        style={{
          width: '100%',
          maxWidth: 820,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <button onClick={onExit} style={ghostBtn}>
          ← {t('common.back')}
        </button>
        <h2 style={{ margin: 0, fontSize: 18, color: 'var(--fg-muted)' }}>{title}</h2>
        <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>
          {step + 1} / {steps.length}
        </span>
      </header>
      <main style={{ width: '100%', maxWidth: 820, flex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          {current.title && <h3 style={{ fontSize: 24, marginBottom: 18 }}>{current.title}</h3>}
          <div style={{ fontSize: 17, lineHeight: 1.6 }}>{current.body}</div>
        </div>
      </main>
      <footer
        style={{
          width: '100%',
          maxWidth: 820,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          marginTop: 28,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`${i + 1} / ${steps.length}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={secondaryBtn}>
            ← {t('lesson.prev')}
          </button>
          {isLast ? (
            <button onClick={onPractice} style={primaryBtn}>
              {t('common.practice')} →
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)} style={primaryBtn}>
              {t('lesson.next')} →
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
