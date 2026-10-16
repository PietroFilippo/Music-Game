import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

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

/** A key press meant for something else: a text field, a shortcut or an open dialog. */
export function keyIsTaken(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  return event.ctrlKey || event.metaKey || event.altKey || event.repeat
    || !!target?.closest?.('input, textarea, select, [contenteditable="true"]')
    || !!document.querySelector('[aria-modal="true"]');
}

// Answer buttons in a two-column grid (one column for long labels). After an
// answer, the right choice and a wrong pick get an icon as well as a color.
// Number keys 1–9 pick the matching button.
export function AnswerBank<V extends string | number>({
  choices,
  onPick,
  disabled,
  lastPick,
  correctValue,
  reveal: forceReveal,
}: Props<V>) {
  const reveal = forceReveal || lastPick !== undefined;
  const wide = choices.some(c => c.label.length > 14);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (disabled) return;
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key);
      if (!Number.isInteger(n) || n < 1 || n > choices.length || keyIsTaken(event)) return;
      event.preventDefault();
      pick.current(choices[n - 1].value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, disabled]);

  return (
    <div className={`answers${wide ? ' answers-wide' : ''}`}>
      {choices.map((c, i) => {
        const isCorrect = reveal && c.value === correctValue;
        const isWrongPick = reveal && c.value === lastPick && lastPick !== correctValue;
        return (
          <button
            key={String(c.value)}
            type="button"
            className={`answer${isCorrect ? ' answer-ok' : isWrongPick ? ' answer-bad' : ''}`}
            disabled={disabled}
            aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
            onClick={() => onPick(c.value)}
          >
            {isCorrect && <Icon name="check" size={18} />}
            {isWrongPick && <Icon name="cross" size={18} />}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
