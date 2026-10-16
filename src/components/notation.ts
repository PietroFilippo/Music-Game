import { Accidental, Formatter, Renderer, Stave, StaveNote, TabStave, Voice } from 'vexflow/bravura';

// Notation is drawn in the app's own colours instead of on a paper card
// (docs/design/REDESIGN.md, section 10): lines a step quieter than the
// fretboard strings, glyphs in the text colour, a highlighted note in the
// accent with a ring, numbers and string names in the muted colour.
export const INK = {
  line: 'var(--staff-line)',
  glyph: 'var(--fg)',
  highlight: 'var(--accent)',
  halo: 'var(--accent-soft)',
  label: 'var(--fg-2)',
  muted: 'var(--muted)',
};
export const READOUT_FONT = "Bahnschrift, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif";
export const TEXT_FONT = "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif";
/** Tab numbers, in the readout face. */
export const TAB_FONT = `11pt ${READOUT_FONT}`;

export type DrawingContext = ReturnType<Renderer['getContext']>;

// The colour behind the drawing: the first ancestor with an opaque background.
function backgroundBehind(el: HTMLElement): string {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    const alpha = color.match(/rgba\([^)]*,\s*([\d.]+)\)/);
    if (color && color !== 'transparent' && (!alpha || Number(alpha[1]) === 1)) return color;
  }
  return 'var(--bg)';
}

/** A fresh SVG drawing in `el`, with the ink colours set. */
export function startDrawing(el: HTMLDivElement, width: number, height: number): DrawingContext {
  el.innerHTML = '';
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const ctx = renderer.getContext();
  // Tab numbers clear a box behind themselves so they read over the line.
  ctx.setBackgroundFillStyle(backgroundBehind(el));
  ctx.setFillStyle(INK.glyph);
  ctx.setStrokeStyle(INK.glyph);
  return ctx;
}

/** Lines and barlines in the line colour; clefs and time signatures in the glyph colour. */
export function styleStave<T extends Stave>(stave: T): T {
  stave.setStyle({ strokeStyle: INK.line, fillStyle: INK.line });
  stave.setDefaultLedgerLineStyle({ strokeStyle: INK.glyph, fillStyle: INK.glyph });
  for (const modifier of stave.getModifiers()) {
    const color = modifier.getCategory() === 'Barline' ? INK.line : INK.glyph;
    modifier.setStyle({ strokeStyle: color, fillStyle: color });
  }
  return stave;
}

/**
 * Scales the finished drawing with CSS, so VexFlow's layout is untouched:
 * the surrounding layout sets `--notation-scale`, and the drawing never grows
 * wider than its container.
 */
export function fitDrawing(el: HTMLDivElement, width: number, height: number) {
  const svg = el.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.style.width = `calc(${width}px * var(--notation-scale, 1))`;
  svg.style.height = 'auto';
}

/** A note in the glyph colour, or the accent when highlighted. */
export function inkNote(clef: string, vexKey: string, highlighted = false, duration = 'w'): StaveNote {
  const note = new StaveNote({ clef, keys: [vexKey], duration, auto_stem: true });
  const accidental = vexKey.split('/')[0].slice(1);
  if (accidental) note.addModifier(new Accidental(accidental), 0);
  const color = highlighted ? INK.highlight : INK.glyph;
  note.setStyle({ fillStyle: color, strokeStyle: color });
  note.setLedgerLineStyle({ fillStyle: color, strokeStyle: color });
  return note;
}

// A soft ring behind a highlighted notehead, so the highlight never relies on colour alone.
export function drawHalo(ctx: DrawingContext, note: StaveNote) {
  const x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;
  const y = note.getYs()[0];
  ctx.save();
  ctx.setFillStyle(INK.halo);
  ctx.setStrokeStyle(INK.highlight);
  ctx.setLineWidth(1.5);
  ctx.beginPath();
  ctx.arc(x, y, 10.5, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Formats whole notes on a stave and draws them, with rings behind the highlighted ones. */
export function drawNotes(ctx: DrawingContext, stave: Stave, notes: StaveNote[], highlighted: boolean[] = []) {
  const voice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes);
  new Formatter().joinVoices([voice]).formatToStave([voice], stave);
  voice.setStave(stave);
  notes.forEach(note => note.setStave(stave));
  notes.forEach((note, i) => { if (highlighted[i]) drawHalo(ctx, note); });
  voice.draw(ctx, stave);
}

/** Room at the left of a tab stave for the string names. */
export const STRING_NAMES_WIDTH = 32;

/** Hides a tab stave's own lines; `drawStrings` draws them like the neck instead. */
export function hideTabLines(stave: TabStave) {
  stave.setConfigForLines(Array.from({ length: 6 }, () => ({ visible: false })));
}

/**
 * The six tab lines drawn like the fretboard's strings: thicker towards the
 * 6th string, named at the left (string 1 on top, as on the neck), and the
 * string being played lit in the accent.
 */
export function drawStrings(ctx: DrawingContext, stave: TabStave, names: readonly string[], lit?: number) {
  const x1 = stave.getX();
  const x2 = x1 + stave.getWidth();
  for (let s = 0; s < 6; s++) {
    const y = stave.getYForLine(s);
    const on = s === lit;
    const color = on ? INK.highlight : INK.muted;
    ctx.save();
    ctx.setStrokeStyle(color);
    ctx.setLineWidth(on ? 3 : 1 + s * 0.3);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setFont(READOUT_FONT, 11, 600);
    ctx.setFillStyle(color);
    ctx.fillText(names[s], x1 - 9 - ctx.measureText(names[s]).width, y + 3.5);
    ctx.restore();
  }
}
