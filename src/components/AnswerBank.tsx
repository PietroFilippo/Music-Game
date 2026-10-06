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

// Answer buttons in a two-column grid (one column for long labels). After an
// answer, the right choice and a wrong pick get an icon as well as a color.
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
  return (
    <div className={`answers${wide ? ' answers-wide' : ''}`}>
      {choices.map(c => {
        const isCorrect = reveal && c.value === correctValue;
        const isWrongPick = reveal && c.value === lastPick && lastPick !== correctValue;
        return (
          <button
            key={String(c.value)}
            type="button"
            className={`answer${isCorrect ? ' answer-ok' : isWrongPick ? ' answer-bad' : ''}`}
            disabled={disabled}
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
