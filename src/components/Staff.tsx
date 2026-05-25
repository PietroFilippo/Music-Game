import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter } from 'vexflow';

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
    el.innerHTML = '';
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    const stave = new Stave(10, 20, width - 30);
    stave.addClef(clef).setContext(ctx).draw();
    if (noteVexKey) {
      const note = new StaveNote({ clef, keys: [noteVexKey], duration: 'w' });
      Formatter.FormatAndDraw(ctx, stave, [note]);
    }
  }, [clef, noteVexKey, width, height]);

  return <div className="vex-stave" ref={ref} />;
}
