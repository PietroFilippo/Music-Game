import { useId, useRef } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';

interface Props {
  title: string;
  note: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Destructive actions confirm in red; others in the accent color. */
  tone?: 'danger' | 'accent';
}

export function ConfirmDialog({
  title,
  note,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  tone = 'danger',
}: Props) {
  const id = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  // Start on Cancel so Enter or Space cannot delete progress by accident.
  const { panel, onKeyDown } = useModalFocus(onCancel, cancel);
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-note`}
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 380,
          width: '100%',
        }}
      >
        <h2 id={`${id}-title`} style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
        <p id={`${id}-note`} style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 0 22px' }}>{note}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            ref={cancel}
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              background: 'var(--surface-hover)',
              color: 'var(--fg)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 18px',
              background: tone === 'danger' ? 'var(--danger)' : 'var(--accent-strong)',
              color: '#0f0f0f',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
