// Prototype copies of the five notation components (Staff, GuitarTab,
// PositionNotation, StaffDiagram, MeasureNotation) with a `theme` switch.
// `paper` reproduces today's rendering; `quiet`, `ink` and `linked` are the
// round-2 directions. Nothing here is imported by the app.
import { useEffect, useRef } from 'react';
import {
  Accidental, Beam, Formatter, Renderer, Stave, StaveNote, TabNote, TabStave, Voice,
} from 'vexflow/bravura';
import { OPEN_STRING_LETTERS, writtenVexKey, type FretPosition } from '/src/music/guitar';
import type { MeasureNote } from '/src/music/measure';

export type Theme = 'paper' | 'quiet' | 'ink' | 'linked';

interface Palette {
  /** stave lines, tab lines, barlines */
  line: string;
  /** clefs, noteheads, stems, beams, rests, accidentals, time signatures, tab numbers, ledger lines */
  glyph: string;
  highlight: string;
  haloFill: string;
  /** note labels under the staff */
  label: string;
  /** line and space numbers */
  number: string;
  /** what the tab-number clear rectangle is filled with */
  bg: string;
  halo: boolean;
  /** the tab is drawn like the neck: six strings in the string grey, thicker downwards, target string lit */
  strings: boolean;
  numberFont: string;
  labelFont: string;
}

const READOUT = 'Bahnschrift, "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
const TEXT = '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif';

export const PALETTES: Record<Theme, Palette> = {
  paper: {
    line: '#000', glyph: '#000', highlight: '#059669', haloFill: 'transparent', label: '#555', number: '#555',
    bg: '#fafafa', halo: false, strings: false, numberFont: 'system-ui', labelFont: 'system-ui',
  },
  quiet: {
    line: '#3f463f', glyph: '#1b1e1b', highlight: '#047857', haloFill: 'rgba(4,120,87,.16)', label: '#454c46', number: '#5b625c',
    bg: '#dcd9cf', halo: true, strings: false, numberFont: READOUT, labelFont: TEXT,
  },
  ink: {
    line: 'var(--staff-line)', glyph: 'var(--fg)', highlight: 'var(--accent)', haloFill: 'var(--accent-soft)', label: 'var(--fg-2)',
    number: 'var(--muted)', bg: 'var(--notation-bg)', halo: true, strings: false, numberFont: READOUT, labelFont: TEXT,
  },
  linked: {
    line: 'var(--staff-line)', glyph: 'var(--fg)', highlight: 'var(--accent)', haloFill: 'var(--accent-soft)', label: 'var(--fg-2)',
    number: 'var(--muted)', bg: 'var(--notation-bg)', halo: true, strings: true, numberFont: READOUT, labelFont: TEXT,
  },
};

const wrapperClass = (theme: Theme) => `vex-stave vex-${theme}`;

function setup(el: HTMLDivElement, width: number, height: number, pal: Palette) {
  el.innerHTML = '';
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const ctx = renderer.getContext();
  // Everything VexFlow draws without an explicit style takes the glyph colour;
  // tab numbers clear a rectangle behind themselves in `bg`.
  ctx.setBackgroundFillStyle(pal.bg);
  ctx.setFillStyle(pal.glyph);
  ctx.setStrokeStyle(pal.glyph);
  return ctx;
}

// Stave lines in the line colour; barlines too; clefs and signatures in the glyph colour.
function styleStave(stave: Stave, pal: Palette) {
  stave.setStyle({ strokeStyle: pal.line, fillStyle: pal.line });
  stave.setDefaultLedgerLineStyle({ strokeStyle: pal.glyph, fillStyle: pal.glyph });
  for (const m of stave.getModifiers()) {
    const barline = m.getCategory() === 'Barline';
    m.setStyle(barline ? { strokeStyle: pal.line, fillStyle: pal.line } : { strokeStyle: pal.glyph, fillStyle: pal.glyph });
  }
  return stave;
}

// Scale the finished SVG with a viewBox so VexFlow's layout survives resizing.
function fit(el: HTMLDivElement, width: number, height: number, scale: number) {
  const svg = el.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.style.width = `${Math.round(width * scale)}px`;
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
}

type Ctx = ReturnType<Renderer['getContext']>;

// A soft ring behind a highlighted notehead: readable without colour.
function halo(ctx: Ctx, note: StaveNote, pal: Palette) {
  const x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;
  const y = note.getYs()[0];
  ctx.save();
  ctx.setFillStyle(pal.haloFill);
  ctx.setStrokeStyle(pal.highlight);
  ctx.setLineWidth(1.5);
  ctx.beginPath();
  ctx.arc(x, y, 10.5, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function makeNote(clef: string, vexKey: string, highlighted: boolean, pal: Palette, duration = 'w') {
  const note = new StaveNote({ clef, keys: [vexKey], duration, auto_stem: true });
  const accidental = vexKey.split('/')[0].slice(1);
  if (accidental) note.addModifier(new Accidental(accidental), 0);
  const colour = highlighted ? pal.highlight : pal.glyph;
  note.setStyle({ fillStyle: colour, strokeStyle: colour });
  note.setLedgerLineStyle({ strokeStyle: colour, fillStyle: colour });
  return note;
}

// Format notes on a stave, draw halos first, then the notes (VexFlow's
// FormatAndDraw, split so the halo can sit behind the notehead).
function drawNotes(ctx: Ctx, stave: Stave, notes: StaveNote[], highlighted: boolean[], pal: Palette) {
  const voice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes);
  new Formatter().joinVoices([voice]).formatToStave([voice], stave);
  voice.setStave(stave);
  notes.forEach(n => n.setStave(stave));
  if (pal.halo) notes.forEach((n, i) => { if (highlighted[i]) halo(ctx, n, pal); });
  voice.draw(ctx, stave);
}

// Six tab lines drawn like the neck: string grey, thicker downwards, the
// played string lit in the accent, string names at the left.
function drawStrings(ctx: Ctx, stave: TabStave, lit: number | undefined, labels: readonly string[], pal: Palette) {
  const x1 = stave.getX();
  const x2 = x1 + stave.getWidth();
  for (let s = 0; s < 6; s++) {
    const y = stave.getYForLine(s);
    const on = s === lit;
    ctx.save();
    ctx.setStrokeStyle(on ? pal.highlight : 'var(--muted)');
    ctx.setLineWidth(on ? 3 : 1 + s * 0.3);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.setFont(pal.numberFont, 11, 600);
    ctx.setFillStyle(on ? pal.highlight : 'var(--muted)');
    const w = ctx.measureText(labels[s]).width;
    ctx.fillText(labels[s], x1 - 9 - w, y + 3.5);
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ Staff */
interface StaffProps {
  theme: Theme;
  clef?: 'treble' | 'alto' | 'bass';
  noteVexKey?: string;
  width?: number;
  height?: number;
  /** CSS scale of the finished drawing (the quiz pane renders the staff up to 720 px). */
  scale?: number;
}

export function Staff({ theme, clef = 'treble', noteVexKey, width = 280, height = 140, scale = 1 }: StaffProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pal = PALETTES[theme];
    const ctx = setup(el, width, height, pal);
    const stave = new Stave(10, 20, width - 30).addClef(clef);
    styleStave(stave, pal).setContext(ctx).draw();
    if (noteVexKey) drawNotes(ctx, stave, [makeNote(clef, noteVexKey, false, pal)], [false], pal);
    fit(el, width, height, scale);
  }, [theme, clef, noteVexKey, width, height, scale]);
  return <div className={wrapperClass(theme)} ref={ref} />;
}

/* -------------------------------------------------------------- GuitarTab */
interface TabProps {
  theme: Theme;
  position?: FretPosition;
  width?: number;
  height?: number;
  /** string names for the linked variant */
  stringNames?: readonly string[];
}

export function GuitarTab({ theme, position, width = 280, height = 140, stringNames = OPEN_STRING_LETTERS }: TabProps) {
  const ref = useRef<HTMLDivElement>(null);
  const string = position?.string;
  const fret = position?.fret;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pal = PALETTES[theme];
    const ctx = setup(el, width, height, pal);
    const left = pal.strings ? 32 : 10;
    const stave = new TabStave(left, 10, width - left - 16).addClef('tab');
    styleStave(stave, pal);
    if (pal.strings) stave.setConfigForLines(Array.from({ length: 6 }, () => ({ visible: false })));
    stave.setContext(ctx).draw();
    if (pal.strings) drawStrings(ctx, stave, string, stringNames, pal);
    if (string !== undefined && fret !== undefined) {
      const note = new TabNote({ positions: [{ str: string + 1, fret }], duration: 'w' });
      note.render_options.font = `${pal === PALETTES.paper ? '10pt sans-serif' : `11pt ${READOUT}`}`;
      const colour = pal.strings ? pal.highlight : pal.glyph;
      note.setStyle({ fillStyle: colour, strokeStyle: colour });
      Formatter.FormatAndDraw(ctx, stave, [note]);
    }
    fit(el, width, height, 1);
  }, [theme, string, fret, width, height, stringNames]);
  return <div className={wrapperClass(theme)} ref={ref} />;
}

/* ------------------------------------------------------- PositionNotation */
export function PositionNotation({ theme, position, flat = false, width = 200, captions, stringNames }: {
  theme: Theme; position: FretPosition; flat?: boolean; width?: number;
  captions: [string, string]; stringNames?: readonly string[];
}) {
  return (
    <div className="notation-pair">
      <figure>
        <GuitarTab theme={theme} position={position} width={width} stringNames={stringNames} />
        <figcaption>{captions[0]}</figcaption>
      </figure>
      <figure>
        <Staff theme={theme} noteVexKey={writtenVexKey(position, flat ? 'b' : '#')} width={width} height={170} />
        <figcaption>{captions[1]}</figcaption>
      </figure>
    </div>
  );
}

/* ----------------------------------------------------------- StaffDiagram */
export interface DiagramNote { vexKey: string; label?: string; highlight?: boolean }

interface DiagramProps {
  theme: Theme;
  clef?: 'treble' | 'alto' | 'bass' | 'none';
  notes?: DiagramNote[];
  numberLines?: boolean;
  numberSpaces?: boolean;
  width?: number;
  height?: number;
  scale?: number;
}

export function StaffDiagram({ theme, clef = 'none', notes = [], numberLines = false, numberSpaces = false, width = 320, height = 150, scale = 1 }: DiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const content = JSON.stringify(notes);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pal = PALETTES[theme];
    const items: DiagramNote[] = JSON.parse(content);
    const ctx = setup(el, width, height, pal);
    const staveX = numberLines ? 28 : 10;
    const staveW = width - staveX - (numberSpaces ? 30 : 20);
    const stave = new Stave(staveX, 20, staveW);
    if (clef !== 'none') stave.addClef(clef);
    styleStave(stave, pal).setContext(ctx).draw();

    const positionClef = clef === 'none' ? 'treble' : clef;
    const staveNotes = items.map(n => makeNote(positionClef, n.vexKey, !!n.highlight, pal));
    if (staveNotes.length) drawNotes(ctx, stave, staveNotes, items.map(n => !!n.highlight), pal);

    ctx.setFont(pal.numberFont, 12, 600);
    ctx.setFillStyle(pal.number);
    if (numberLines) for (let n = 1; n <= 5; n++) ctx.fillText(String(n), staveX - 16, stave.getYForLine(5 - n) + 4);
    if (numberSpaces) for (let n = 1; n <= 4; n++) {
      const y = (stave.getYForLine(5 - n) + stave.getYForLine(4 - n)) / 2;
      ctx.fillText(String(n), staveX + staveW + 10, y + 4);
    }
    const lowest = Math.max(0, ...staveNotes.flatMap(n => n.getYs()));
    const labelY = Math.max(stave.getYForLine(4) + 34, lowest + 26);
    items.forEach((n, i) => {
      if (!n.label) return;
      ctx.setFont(pal.labelFont, 13, n.highlight ? 700 : 500);
      ctx.setFillStyle(n.highlight ? pal.highlight : pal.label);
      const note = staveNotes[i];
      const x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;
      const w = ctx.measureText(n.label).width;
      ctx.fillText(n.label, x - w / 2, labelY);
    });
    fit(el, width, height, scale);
  }, [theme, clef, content, numberLines, numberSpaces, width, height, scale]);
  return <div className={wrapperClass(theme)} ref={ref} />;
}

/* -------------------------------------------------------- MeasureNotation */
export function MeasureNotation({ theme, notes, label, width = 500, highlightIndex, stringNames = OPEN_STRING_LETTERS, scale = 1 }: {
  theme: Theme; notes: MeasureNote[]; label: string; width?: number; highlightIndex?: number;
  stringNames?: readonly string[]; scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const content = JSON.stringify(notes);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pal = PALETTES[theme];
    const items: MeasureNote[] = JSON.parse(content);
    const height = 310;
    const ctx = setup(el, width, height, pal);
    const left = pal.strings ? 32 : 10;
    const staff = new Stave(left, 25, width - left - 10).addClef('treble').addTimeSignature('4/4');
    const tab = new TabStave(left, 180, width - left - 10).addClef('tab').addTimeSignature('4/4');
    const start = Math.max(staff.getNoteStartX(), tab.getNoteStartX());
    styleStave(staff, pal);
    styleStave(tab, pal);
    if (pal.strings) tab.setConfigForLines(Array.from({ length: 6 }, () => ({ visible: false })));
    staff.setNoteStartX(start).setContext(ctx).draw();
    tab.setNoteStartX(start).setContext(ctx).draw();
    const lit = highlightIndex === undefined ? undefined : items[highlightIndex].position.string;
    if (pal.strings) drawStrings(ctx, tab, lit, stringNames, pal);

    const staffNotes = items.map(({ position, duration }, i) => makeNote('treble', writtenVexKey(position), i === highlightIndex, pal, duration));
    const tabNotes = items.map(({ position, duration }, i) => {
      const n = new TabNote({ positions: [{ str: position.string + 1, fret: position.fret }], duration }, duration !== 'w');
      n.render_options.font = pal === PALETTES.paper ? '10pt sans-serif' : `11pt ${READOUT}`;
      const colour = i === highlightIndex ? pal.highlight : pal.glyph;
      n.setStyle({ fillStyle: colour, strokeStyle: colour });
      return n;
    });
    const beams = [...Beam.generateBeams(staffNotes), ...Beam.generateBeams(tabNotes, { stem_direction: 1 })];
    beams.forEach(b => b.setStyle({ fillStyle: pal.glyph, strokeStyle: pal.glyph }));
    const staffVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(staffNotes);
    const tabVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(tabNotes);
    new Formatter().joinVoices([staffVoice]).joinVoices([tabVoice]).format([staffVoice, tabVoice], width - start - 30);
    staffVoice.setStave(staff);
    staffNotes.forEach(n => n.setStave(staff));
    if (pal.halo && highlightIndex !== undefined) halo(ctx, staffNotes[highlightIndex], pal);
    staffVoice.draw(ctx, staff);
    tabVoice.draw(ctx, tab);
    beams.forEach(beam => beam.setContext(ctx).draw());
    fit(el, width, height, scale);
  }, [theme, content, width, highlightIndex, stringNames, scale]);
  return <div className={wrapperClass(theme)} role="img" aria-label={label} ref={ref} />;
}

/* ------------------------------------------------- a measure with a rest */
// Not in the app's data model yet; shown only to prove rests take the ink.
export function RestDemo({ theme, width = 320 }: { theme: Theme; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pal = PALETTES[theme];
    const ctx = setup(el, width, 130, pal);
    const stave = new Stave(10, 10, width - 20).addClef('treble').addTimeSignature('4/4');
    styleStave(stave, pal).setContext(ctx).draw();
    const notes = [
      new StaveNote({ keys: ['g/4'], duration: 'q' }), new StaveNote({ keys: ['b/4'], duration: 'qr' }),
      new StaveNote({ keys: ['a/4'], duration: '8' }), new StaveNote({ keys: ['b/4'], duration: '8' }), new StaveNote({ keys: ['b/4'], duration: 'qr' }),
    ];
    notes.forEach(n => n.setStyle({ fillStyle: pal.glyph, strokeStyle: pal.glyph }));
    const beams = Beam.generateBeams(notes);
    beams.forEach(b => b.setStyle({ fillStyle: pal.glyph, strokeStyle: pal.glyph }));
    const voice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(notes);
    new Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(ctx, stave);
    beams.forEach(b => b.setContext(ctx).draw());
    fit(el, width, 130, 1);
  }, [theme, width]);
  return <div className={wrapperClass(theme)} ref={ref} />;
}

/* --------------------------------------------------------------- Keyboard */
// Judgement piece: real keys are white, so the keys keep a light fill but lose the glare.
export function Keyboard({ theme, highlighted, labels }: { theme: Theme; highlighted?: number; labels: string[] }) {
  const dark = theme === 'ink' || theme === 'linked';
  const white = theme === 'paper' ? '#fafafa' : dark ? '#e3e1d8' : '#dcd9cf';
  const black = theme === 'paper' ? '#242424' : 'var(--bg)';
  const stroke = theme === 'paper' ? '#555' : 'var(--line-strong)';
  return (
    <svg viewBox="0 0 420 190" role="img" aria-label="Keyboard" style={{ width: '100%', maxWidth: 480, display: 'block' }}>
      {labels.map((l, i) => (
        <g key={i}>
          <rect x={i * 60 + 1} y={1} width={58} height={180} rx={4} fill={highlighted === i ? 'var(--accent)' : white} stroke={stroke} />
          {highlighted === i && <circle cx={i * 60 + 30} cy={130} r={8} fill="var(--on-accent)" />}
          <text x={i * 60 + 30} y={164} textAnchor="middle" fill={theme === 'paper' ? '#222' : '#1b1e1b'} fontSize={16} fontWeight={highlighted === i ? 700 : 500}>{l}</text>
        </g>
      ))}
      {[1, 2, 4, 5, 6].map(b => <rect key={b} x={b * 60 - 18} y={1} width={36} height={106} rx={3} fill={black} stroke={theme === 'paper' ? '#111' : 'var(--line-strong)'} />)}
    </svg>
  );
}
