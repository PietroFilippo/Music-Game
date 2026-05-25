import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';
import { ScoreBadge } from './ScoreBadge';
import type { GameProgress } from '../hooks/useGameProgress';

interface Props {
  title: string;
  onExit: () => void;
  progress: GameProgress;
  children: ReactNode;
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

export function GameShell({ title, onExit, progress, children }: Props) {
  const { t } = useI18n();

  if (progress.done) {
    const pct = Math.round((progress.correctCount / progress.totalRounds) * 100);
    return (
      <div style={layout}>
        <h2 style={{ marginTop: 60, color: 'var(--fg-muted)', letterSpacing: 1 }}>
          {t('common.complete')}
        </h2>
        <div style={{ fontSize: 88, color: 'var(--accent)', fontWeight: 700, margin: '12px 0' }}>
          {pct}%
        </div>
        <p style={{ color: 'var(--fg-muted)', margin: 0 }}>
          {progress.correctCount} / {progress.totalRounds}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button onClick={progress.restart} style={primaryBtn}>
            {t('common.again')}
          </button>
          <button onClick={onExit} style={secondaryBtn}>
            {t('common.exit')}
          </button>
        </div>
      </div>
    );
  }

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
        <ScoreBadge
          correct={progress.correctCount}
          total={progress.round}
          round={progress.round + 1}
          rounds={progress.totalRounds}
        />
      </header>
      <main style={{ width: '100%', maxWidth: 820 }}>{children}</main>
    </div>
  );
}
