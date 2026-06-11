import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter } from 'vexflow';

export interface DiagramNote {
  vexKey: string;
  label?: string;
  highlight?: boolean;
}

interface Props {
  clef?: 'treble' | 'alto' | 'bass' | 'none';
  notes?: DiagramNote[];
  numberLines?: boolean;
  numberSpaces?: boolean;
  width?: number;
  height?: number;
}

const INK = '#555';
const HIGHLIGHT = '#059669';

export function StaffDiagram({
  clef = 'none',
  notes = [],
  numberLines = false,
  numberSpaces = false,
  width = 320,
  height = 150,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();

    const staveX = numberLines ? 28 : 10;
    const staveW = width - staveX - (numberSpaces ? 30 : 20);
    const stave = new Stave(staveX, 20, staveW);
    if (clef !== 'none') stave.addClef(clef);
    stave.setContext(ctx).draw();

    const positionClef = clef === 'none' ? 'treble' : clef;
    const staveNotes = notes.map(n => {
      const note = new StaveNote({ clef: positionClef, keys: [n.vexKey], duration: 'w' });
      if (n.highlight) note.setStyle({ fillStyle: HIGHLIGHT, strokeStyle: HIGHLIGHT });
      return note;
    });
    if (staveNotes.length > 0) Formatter.FormatAndDraw(ctx, stave, staveNotes);

    ctx.setFont('system-ui', 12, 600);
    if (numberLines) {
      for (let n = 1; n <= 5; n++) {
        ctx.setFillStyle(INK);
        ctx.fillText(String(n), staveX - 16, stave.getYForLine(5 - n) + 4);
      }
    }
    if (numberSpaces) {
      for (let n = 1; n <= 4; n++) {
        const y = (stave.getYForLine(5 - n) + stave.getYForLine(4 - n)) / 2;
        ctx.setFillStyle(INK);
        ctx.fillText(String(n), staveX + staveW + 10, y + 4);
      }
    }
    notes.forEach((n, i) => {
      if (!n.label) return;
      ctx.setFillStyle(n.highlight ? HIGHLIGHT : INK);
      const x = staveNotes[i].getAbsoluteX();
      ctx.fillText(n.label, x - n.label.length * 3, stave.getYForLine(4) + 34);
    });
  }, [clef, notes, numberLines, numberSpaces, width, height]);

  return <div className="vex-stave" ref={ref} />;
}
