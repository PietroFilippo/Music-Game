import { useId, type ReactNode } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useModalFocus } from '../hooks/useModalFocus';
import { Icon } from './Icon';

// A modal panel: a bottom sheet on phones, a centered panel on wider screens.
// Escape and the backdrop close it, Tab stays inside, and focus returns to the opener.
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  const id = useId();
  const { panel, onKeyDown } = useModalFocus(onClose);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
        onClick={e => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <h2 id={id}>{title}</h2>
          <button type="button" className="ibtn" aria-label={t('common.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
