import { useEffect, useRef } from 'react';
import { Formatter, TabNote, TabStave } from 'vexflow/bravura';
import type { FretPosition } from '../music/guitar';
import { useStringNames } from './useStringNames';
import { drawStrings, fitDrawing, hideTabLines, INK, startDrawing, STRING_NAMES_WIDTH, styleStave, TAB_FONT } from './notation';

interface Props {
  positions: FretPosition[];
  width?: number;
  height?: number;
}

// Tablature drawn like the neck: six named strings, the played one lit.
export function GuitarTab({ positions, width = 280, height = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const names = useStringNames();
  const first = positions[0];
  // Redraw only when the shown position changes, not for every new array
  // (timed rounds re-render ten times a second).
  const string = first?.string;
  const fret = first?.fret;
  const nameKey = names.join('|');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = startDrawing(el, width, height);
    const stave = new TabStave(STRING_NAMES_WIDTH, 10, width - STRING_NAMES_WIDTH - 16).addClef('tab');
    styleStave(stave);
    hideTabLines(stave);
    stave.setContext(ctx).draw();
    drawStrings(ctx, stave, nameKey.split('|'), string);
    if (string !== undefined && fret !== undefined) {
      const note = new TabNote({ positions: [{ str: string + 1, fret }], duration: 'w' });
      note.render_options.font = TAB_FONT;
      note.setStyle({ fillStyle: INK.highlight, strokeStyle: INK.highlight });
      Formatter.FormatAndDraw(ctx, stave, [note]);
    }
    fitDrawing(el, width, height);
  }, [string, fret, width, height, nameKey]);

  return <div className="vex-stave vex-tab" ref={ref} />;
}
