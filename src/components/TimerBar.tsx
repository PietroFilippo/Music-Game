export function TimerBar({ fraction }: { fraction: number }) {
  const danger = fraction < 0.25;
  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto 18px',
        height: 6,
        borderRadius: 3,
        background: 'var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          background: danger ? 'var(--danger)' : 'var(--accent-strong)',
          transition: 'width 0.1s linear, background 0.3s',
        }}
      />
    </div>
  );
}
