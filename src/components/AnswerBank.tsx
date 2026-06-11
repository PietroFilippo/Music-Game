import type { CSSProperties } from 'react';

interface Choice<V extends string | number> {
  value: V;
  label: string;
}

interface Props<V extends string | number> {
  choices: Choice<V>[];
  onPick: (value: V) => void;
  disabled?: boolean;
  lastPick?: V;
  correctValue?: V;
  reveal?: boolean;
}

export function AnswerBank<V extends string | number>({
  choices,
  onPick,
  disabled,
  lastPick,
  correctValue,
  reveal: forceReveal,
}: Props<V>) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {choices.map(c => {
        const reveal = forceReveal || lastPick !== undefined;
        const isCorrect = reveal && c.value === correctValue;
        const isWrongPick = reveal && c.value === lastPick && lastPick !== correctValue;
        const style: CSSProperties = {
          minWidth: 96,
          padding: '12px 18px',
          fontSize: 18,
          fontWeight: 600,
          background: isCorrect
            ? 'var(--accent-strong)'
            : isWrongPick
              ? 'var(--danger)'
              : 'var(--bg-card)',
          color: isCorrect || isWrongPick ? '#0f0f0f' : 'var(--fg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          cursor: disabled ? 'default' : 'pointer',
          transition: 'background 0.15s, transform 0.05s',
        };
        return (
          <button
            key={String(c.value)}
            disabled={disabled}
            onClick={() => onPick(c.value)}
            style={style}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
