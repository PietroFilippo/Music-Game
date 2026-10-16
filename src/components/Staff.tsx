import { useEffect, useRef } from 'react';
import { Stave } from 'vexflow/bravura';
import { drawNotes, fitDrawing, inkNote, startDrawing, styleStave } from './notation';

interface Props {
  clef?: 'treble' | 'alto' | 'bass';
  noteVexKey?: string;
  width?: number;
  height?: number;
}

export function Staff({ clef = 'treble', noteVexKey, width = 280, height = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = startDrawing(el, width, height);
    const stave = new Stave(10, 20, width - 30).addClef(clef);
    styleStave(stave).setContext(ctx).draw();
    if (noteVexKey) drawNotes(ctx, stave, [inkNote(clef, noteVexKey)]);
    fitDrawing(el, width, height);
  }, [clef, noteVexKey, width, height]);

  return <div className="vex-stave vex-staff" ref={ref} />;
}
