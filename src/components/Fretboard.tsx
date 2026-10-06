import { useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../hooks/useI18n';
import { OPEN_STRING_LETTERS, STRING_COUNT, parsePositionKey, positionKey, type FretPosition } from '../music/guitar';
import { shortNoteLabel } from '../music/notes';
import { useSettings } from '../SettingsContext';

export type MarkerTone = 'accent' | 'plain' | 'root' | 'wrong';
export type StringLabelMode = 'name' | 'number' | 'both' | 'none';

// A highlighted position. Labels can be note names, fret numbers, roots ("R")
// or interval degrees, so later chord and arpeggio lessons can reuse the board.
export interface FretMarker extends FretPosition {
  label?: string;
  tone?: MarkerTone;
}

interface Props {
  /** Positions labeled with their fret numbers; the first is highlighted by default. */
  positions?: FretPosition[];
  highlightFirst?: boolean;
  markers?: FretMarker[];
  /** Frets to draw. Defaults to 12, or more if a marker needs it. */
  frets?: number;
  stringLabels?: StringLabelMode;
  highlightStrings?: number[];
  showFretNumbers?: boolean;
  /** Makes every string/fret position a button. */
  onSelect?: (position: FretPosition) => void;
  disabled?: boolean;
  label?: string;
}

const TONES: Record<MarkerTone, { fill: string; stroke: string; text: string }> = {
  accent: { fill: 'var(--accent)', stroke: 'var(--accent)', text: '#0f0f0f' },
  plain: { fill: 'var(--bg-card)', stroke: 'var(--fg)', text: 'var(--fg)' },
  root: { fill: 'var(--warn)', stroke: 'var(--warn)', text: '#0f0f0f' },
  wrong: { fill: 'var(--danger)', stroke: 'var(--danger)', text: '#0f0f0f' },
};

const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];
const KEY_MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
};

const WIDTH = 560;
const OPEN_W = 34;
const PAD_R = 12;
const PAD_T = 18;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function Fretboard({
  positions = [],
  highlightFirst = true,
  markers = [],
  frets,
  stringLabels = 'name',
  highlightStrings = [],
  showFretNumbers = false,
  onSelect,
  disabled = false,
  label,
}: Props) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [cursor, setCursor] = useState<FretPosition>({ string: 0, fret: 0 });
  const [focused, setFocused] = useState<string | null>(null);
  const cells = useRef(new Map<string, SVGRectElement>());

  const allMarkers: FretMarker[] = [
    ...positions.map((p, i): FretMarker => ({
      ...p, label: String(p.fret), tone: highlightFirst && i === 0 ? 'accent' : 'plain',
    })),
    ...markers,
  ];
  const numFrets = frets ?? Math.max(12, ...allMarkers.map(m => m.fret));
  const interactive = onSelect !== undefined;
  const labelW = stringLabels === 'none' ? 6 : stringLabels === 'both' ? 46 : 26;
  const nutX = labelW + OPEN_W;
  const fretGap = (WIDTH - nutX - PAD_R) / numFrets;
  // Taller rows give selectable boards bigger touch targets on phones.
  const stringGap = interactive ? 34 : 24;
  const boardH = stringGap * (STRING_COUNT - 1);
  const height = PAD_T * 2 + boardH + (showFretNumbers ? 18 : 0);
  const y = (string: number) => PAD_T + string * stringGap;
  const x = (fret: number) => (fret === 0 ? labelW + OPEN_W / 2 : nutX + (fret - 0.5) * fretGap);
  const active = { string: cursor.string, fret: Math.min(cursor.fret, numFrets) };
  const cellBox = (p: FretPosition) => ({
    x: p.fret === 0 ? labelW : nutX + (p.fret - 1) * fretGap,
    y: y(p.string) - stringGap / 2,
    width: p.fret === 0 ? OPEN_W : fretGap,
    height: stringGap,
  });

  const stringLabel = (string: number) => {
    const name = shortNoteLabel(OPEN_STRING_LETTERS[string], settings.notation, settings.language);
    if (stringLabels === 'number') return String(string + 1);
    if (stringLabels === 'both') return `${string + 1} ${name}`;
    return name;
  };

  const cellLabel = (p: FretPosition) => p.fret === 0
    ? t('fretboard.openCell', { string: p.string + 1 })
    : t('fretboard.cell', { string: p.string + 1, fret: p.fret });

  const select = (p: FretPosition) => {
    if (disabled || !onSelect) return;
    setCursor(p);
    onSelect(p);
  };

  const handleKey = (e: KeyboardEvent<SVGRectElement>, p: FretPosition) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(p);
      return;
    }
    const move = KEY_MOVES[e.key];
    let next: FretPosition | null = null;
    if (move) {
      next = { string: clamp(p.string + move[0], 0, STRING_COUNT - 1), fret: clamp(p.fret + move[1], 0, numFrets) };
    } else if (e.key === 'Home') {
      next = { ...p, fret: 0 };
    } else if (e.key === 'End') {
      next = { ...p, fret: numFrets };
    }
    if (!next) return;
    e.preventDefault();
    setCursor(next);
    cells.current.get(positionKey(next))?.focus();
  };

  const focusBox = focused === null ? null : cellBox(parsePositionKey(focused));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className={interactive ? 'fretboard fretboard-interactive' : 'fretboard'}
      role={interactive ? 'group' : 'img'}
      aria-label={label ?? t('fretboard.label')}
      aria-disabled={interactive ? disabled : undefined}
      style={{ width: '100%', maxWidth: WIDTH, height: 'auto' }}
    >
      {Array.from({ length: STRING_COUNT }, (_, s) => {
        const lit = highlightStrings.includes(s);
        return (
          <line
            key={'s' + s}
            x1={labelW + 4}
            x2={WIDTH - PAD_R}
            y1={y(s)}
            y2={y(s)}
            stroke={lit ? 'var(--accent)' : 'var(--fg-muted)'}
            strokeWidth={lit ? 4 : 1 + s * 0.3}
          />
        );
      })}
      <line x1={nutX} x2={nutX} y1={PAD_T} y2={PAD_T + boardH} stroke="var(--fg)" strokeWidth={3} />
      {Array.from({ length: numFrets }, (_, f) => (
        <line
          key={'f' + f}
          x1={nutX + (f + 1) * fretGap}
          x2={nutX + (f + 1) * fretGap}
          y1={PAD_T}
          y2={PAD_T + boardH}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {SINGLE_INLAYS.filter(f => f <= numFrets).map(f => (
        <circle key={'m' + f} cx={x(f)} cy={PAD_T + boardH / 2} r={5} fill="var(--border)" />
      ))}
      {DOUBLE_INLAYS.filter(f => f <= numFrets).flatMap(f => [1.5, 3.5].map(row => (
        <circle key={`m${f}-${row}`} cx={x(f)} cy={PAD_T + stringGap * row} r={5} fill="var(--border)" />
      )))}
      {stringLabels !== 'none' && Array.from({ length: STRING_COUNT }, (_, s) => (
        <text
          key={'l' + s}
          x={labelW - 4}
          y={y(s) + 4}
          fontSize={12}
          fill={highlightStrings.includes(s) ? 'var(--accent)' : 'var(--fg-muted)'}
          textAnchor="end"
        >
          {stringLabel(s)}
        </text>
      ))}
      {showFretNumbers && Array.from({ length: numFrets + 1 }, (_, f) => (
        <text key={'n' + f} x={x(f)} y={height - 6} fontSize={11} fill="var(--fg-muted)" textAnchor="middle">
          {f}
        </text>
      ))}
      {allMarkers.map((m, i) => {
        const tone = TONES[m.tone ?? 'plain'];
        const text = m.label ?? '';
        const wide = text.length > 2;
        return (
          <g key={'p' + i} pointerEvents="none">
            <circle cx={x(m.fret)} cy={y(m.string)} r={wide ? 14 : 11} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
            {text && (
              <text
                x={x(m.fret)}
                y={y(m.string) + 4}
                fontSize={wide ? 10 : 11}
                fontWeight={m.tone === 'plain' || !m.tone ? 500 : 700}
                fill={tone.text}
                textAnchor="middle"
              >
                {text}
              </text>
            )}
          </g>
        );
      })}
      {interactive && allCells(numFrets).map(p => {
        const key = positionKey(p);
        return (
          <rect
            key={'c' + key}
            ref={el => { if (el) cells.current.set(key, el); else cells.current.delete(key); }}
            className="fret-cell"
            {...cellBox(p)}
            role="button"
            aria-label={cellLabel(p)}
            aria-disabled={disabled}
            tabIndex={!disabled && p.string === active.string && p.fret === active.fret ? 0 : -1}
            onClick={() => select(p)}
            onKeyDown={e => handleKey(e, p)}
            onFocus={() => setFocused(key)}
            onBlur={() => setFocused(current => (current === key ? null : current))}
          />
        );
      })}
      {focusBox && (
        <rect
          x={focusBox.x + 1}
          y={focusBox.y + 1}
          width={focusBox.width - 2}
          height={focusBox.height - 2}
          rx={6}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
    </svg>
  );
}

function allCells(numFrets: number): FretPosition[] {
  return Array.from({ length: STRING_COUNT }, (_, string) =>
    Array.from({ length: numFrets + 1 }, (_, fret) => ({ string, fret }))).flat();
}
