import { useI18n } from '../hooks/useI18n';

interface Props {
  onClick: () => void;
}

export function ContinueButton({ onClick }: Props) {
  const { t } = useI18n();

  return (
    <button type="button" onClick={onClick} className="btn btn-primary continue-button" autoFocus>
      {t('common.continue')}
    </button>
  );
}
