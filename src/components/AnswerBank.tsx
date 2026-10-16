import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useStage } from './Stage';

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
  /** A two-column grid, or one column with text on the left; defaults to one column in the two-pane stage. */
  layout?: 'grid' | 'column';
  /** Shows each button's number key (only with a mouse or trackpad); defaults to the column layout. */
  keyHints?: boolean;
}

/** A key press meant for something else: a text field, a shortcut or an open dialog. */
export function keyIsTaken(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  return event.ctrlKey || event.metaKey || event.altKey || event.repeat
    || !!target?.closest?.('input, textarea, select, [contenteditable="true"]')
    || !!document.querySelector('[aria-modal="true"]');
}

// Answer buttons in a two-column grid (one column for long labels), or in one
// column with text on the left in the two-pane stage. After an answer, the
// right choice and a wrong pick get an icon as well as a color, and the others
// dim. Number keys 1–9 pick the matching button.
export function AnswerBank<V extends string | number>({
  choices,
  onPick,
  disabled,
  lastPick,
  correctValue,
  reveal: forceReveal,
  layout,
  keyHints,
}: Props<V>) {
  const { wide } = useStage();
  const column = (layout ?? (wide ? 'column' : 'grid')) === 'column';
  const showKeys = keyHints ?? column;
  const reveal = forceReveal || lastPick !== undefined;
  const long = choices.some(c => c.label.length > 14);
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
    <div className={`answers${column ? ' answers-col' : long ? ' answers-wide' : ''}`}>
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
            <span className="answer-label">{c.label}</span>
            {showKeys && i < 9 && <span className="kbd" aria-hidden="true">{i + 1}</span>}
          </button>
        );
      })}
    </div>
  );
}
