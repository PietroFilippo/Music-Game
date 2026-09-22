import { RHYTHM_VALUES, type RhythmId } from '../music/rhythm';

// SVG keeps the seven symbols consistent across platforms without music-font fallbacks.
export function RhythmFigure({ value, label }: { value: RhythmId; label: string }) {
  const figure = RHYTHM_VALUES.find(v => v.id === value)!;
  return (
    <svg viewBox="0 0 120 130" role="img" aria-label={label} style={{ width: 100, maxWidth: '100%', color: 'var(--fg)' }}>
      <ellipse cx={44} cy={103} rx={figure.stem ? 13 : 17} ry={9}
        transform={figure.stem ? 'rotate(-20 44 103)' : undefined}
        fill={figure.hollow ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth={figure.hollow ? 4 : 1} />
      {figure.stem && <path d="M56 100 V15" stroke="currentColor" strokeWidth={3} />}
      {Array.from({ length: figure.flags }, (_, i) => (
        <path key={i} d={`M56 ${15 + i * 15} C59 ${28 + i * 15}, 88 ${28 + i * 15}, 70 ${53 + i * 15} C80 ${29 + i * 15}, 55 ${39 + i * 15}, 56 ${15 + i * 15}`}
          fill="currentColor" />
      ))}
    </svg>
  );
}
