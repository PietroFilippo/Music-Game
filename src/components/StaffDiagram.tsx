import { useEffect, useRef } from 'react';
import { Stave } from 'vexflow/bravura';
import { drawNotes, fitDrawing, INK, inkNote, READOUT_FONT, startDrawing, styleStave, TEXT_FONT } from './notation';

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

export function StaffDiagram({
  clef = 'none',
  notes = [],
  numberLines = false,
  numberSpaces = false,
  width = 320,
  height = 150,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Inline lesson arrays must not trigger another VexFlow render.
  const content = JSON.stringify(notes);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items: DiagramNote[] = JSON.parse(content);
    const ctx = startDrawing(el, width, height);

    const staveX = numberLines ? 28 : 10;
    const staveW = width - staveX - (numberSpaces ? 30 : 20);
    const stave = new Stave(staveX, 20, staveW);
    if (clef !== 'none') stave.addClef(clef);
    styleStave(stave).setContext(ctx).draw();

    const positionClef = clef === 'none' ? 'treble' : clef;
    const staveNotes = items.map(n => inkNote(positionClef, n.vexKey, n.highlight));
    if (staveNotes.length > 0) drawNotes(ctx, stave, staveNotes, items.map(n => !!n.highlight));

    // Line and space numbers are smaller than the 10-unit gap between lines,
    // so neighbouring numbers never touch.
    ctx.setFont(READOUT_FONT, 8.5, 700);
    ctx.setFillStyle(INK.muted);
    if (numberLines) {
      for (let n = 1; n <= 5; n++) ctx.fillText(String(n), staveX - 15, stave.getYForLine(5 - n) + 3.5);
    }
    if (numberSpaces) {
      for (let n = 1; n <= 4; n++) {
        const y = (stave.getYForLine(5 - n) + stave.getYForLine(4 - n)) / 2;
        ctx.fillText(String(n), staveX + staveW + 10, y + 3.5);
      }
    }
    // Labels share one row below the staff, lowered if ledger-line notes reach
    // it, each centred under its notehead.
    const lowestNote = Math.max(0, ...staveNotes.flatMap(n => n.getYs()));
    const labelY = Math.max(stave.getYForLine(4) + 34, lowestNote + 26);
    items.forEach((n, i) => {
      if (!n.label) return;
      ctx.setFont(TEXT_FONT, 13, n.highlight ? 700 : 500);
      ctx.setFillStyle(n.highlight ? INK.highlight : INK.label);
      const note = staveNotes[i];
      const x = (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;
      ctx.fillText(n.label, x - ctx.measureText(n.label).width / 2, labelY);
    });
    fitDrawing(el, width, height);
  }, [clef, content, numberLines, numberSpaces, width, height]);

  return <div className="vex-stave vex-diagram" ref={ref} />;
}
