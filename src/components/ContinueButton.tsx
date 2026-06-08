import type { CSSProperties } from 'react';
import { useI18n } from '../hooks/useI18n';

interface Props {
  onClick: () => void;
}

const style: CSSProperties = {
  marginTop: 24,
  padding: '12px 22px',
  background: 'var(--accent-strong)',
  color: '#0f0f0f',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
};

export function ContinueButton({ onClick }: Props) {
  const { t } = useI18n();

  return (
    <button type="button" onClick={onClick} style={style} autoFocus>
      {t('common.continue')}
    </button>
  );
}
