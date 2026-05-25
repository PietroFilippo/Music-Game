import { useI18n } from '../hooks/useI18n';

interface Props {
  correct: number;
  total: number;
  round: number;
  rounds: number;
}

export function ScoreBadge({ correct, total, round, rounds }: Props) {
  const { t } = useI18n();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div style={{ color: 'var(--fg-muted)', fontSize: 13, textAlign: 'right', lineHeight: 1.3 }}>
      <div>
        {t('common.round')} {round} / {rounds}
      </div>
      <div>
        {t('common.score')}: {correct}/{total} ({pct}%)
      </div>
    </div>
  );
}
