interface Props {
  title: string;
  note: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  note,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
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
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 380,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: '10px 0 22px' }}>{note}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              background: 'var(--bg-card-hover)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 18px',
              background: 'var(--danger)',
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
