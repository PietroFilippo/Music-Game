import type { ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';
import { ScoreBadge } from './ScoreBadge';
import type { GameProgress } from '../hooks/useGameProgress';

interface Props {
  title: string;
  onExit: () => void;
  progress: GameProgress;
  children: ReactNode;
}

export function GameShell({ title, onExit, progress, children }: Props) {
  const { t } = useI18n();

  if (progress.done) {
    const pct = Math.round((progress.correctCount / progress.totalRounds) * 100);
    return (
      <div className="shell">
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
          <button onClick={progress.restart} className="btn btn-primary">
            {t('common.again')}
          </button>
          <button onClick={onExit} className="btn btn-secondary">
            {t('common.exit')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <button onClick={onExit} className="btn-ghost">
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
      <main className="shell-main">{children}</main>
    </div>
  );
}
