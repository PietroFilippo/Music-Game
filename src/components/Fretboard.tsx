import type { FretPosition } from '../music/guitar';

const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];
const NUM_FRETS = 12;
const MARKERS_SINGLE = [3, 5, 7, 9];
const MARKER_DOUBLE = 12;

interface Props {
  positions: FretPosition[];
  highlightFirst?: boolean;
}

export function Fretboard({ positions, highlightFirst = true }: Props) {
  const width = 560;
  const height = 150;
  const padL = 36;
  const padT = 16;
  const padB = 16;
  const padR = 12;
  const usableW = width - padL - padR;
  const usableH = height - padT - padB;
  const stringGap = usableH / 5;
  const fretGap = usableW / NUM_FRETS;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: width, height: 'auto' }}
    >
      {STRING_LABELS.map((_, i) => (
        <line
          key={'s' + i}
          x1={padL}
          x2={width - padR}
          y1={padT + i * stringGap}
          y2={padT + i * stringGap}
          stroke="var(--fg-muted)"
          strokeWidth={i < 3 ? 1 : 1.5}
        />
      ))}
      <line x1={padL} x2={padL} y1={padT} y2={height - padB} stroke="var(--fg)" strokeWidth={3} />
      {Array.from({ length: NUM_FRETS }, (_, f) => (
        <line
          key={'f' + f}
          x1={padL + (f + 1) * fretGap}
          x2={padL + (f + 1) * fretGap}
          y1={padT}
          y2={height - padB}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {MARKERS_SINGLE.map(f => (
        <circle
          key={'m' + f}
          cx={padL + (f - 0.5) * fretGap}
          cy={height / 2}
          r={5}
          fill="var(--border)"
        />
      ))}
      <circle
        cx={padL + (MARKER_DOUBLE - 0.5) * fretGap}
        cy={padT + stringGap * 1.5}
        r={5}
        fill="var(--border)"
      />
      <circle
        cx={padL + (MARKER_DOUBLE - 0.5) * fretGap}
        cy={padT + stringGap * 3.5}
        r={5}
        fill="var(--border)"
      />
      {STRING_LABELS.map((label, i) => (
        <text
          key={'l' + i}
          x={padL - 18}
          y={padT + i * stringGap + 4}
          fontSize={12}
          fill="var(--fg-muted)"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
      {positions.map((p, i) => {
        const x = p.fret === 0 ? padL - 14 : padL + (p.fret - 0.5) * fretGap;
        const y = padT + p.string * stringGap;
        const isFirst = highlightFirst && i === 0;
        return (
          <g key={'n' + i}>
            <circle
              cx={x}
              cy={y}
              r={11}
              fill={isFirst ? 'var(--accent)' : 'var(--bg-card)'}
              stroke={isFirst ? 'var(--accent)' : 'var(--fg)'}
              strokeWidth={2}
            />
            <text
              x={x}
              y={y + 4}
              fontSize={11}
              fontWeight={isFirst ? 700 : 500}
              fill={isFirst ? '#0f0f0f' : 'var(--fg)'}
              textAnchor="middle"
            >
              {p.fret}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
