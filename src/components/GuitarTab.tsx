import { useEffect, useRef } from 'react';
import { Renderer, TabStave, TabNote, Formatter } from 'vexflow';
import type { FretPosition } from '../music/guitar';

interface Props {
  positions: FretPosition[];
  width?: number;
  height?: number;
}

export function GuitarTab({ positions, width = 280, height = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    const stave = new TabStave(10, 10, width - 30);
    stave.addClef('tab').setContext(ctx).draw();
    if (positions.length) {
      const p = positions[0];
      const note = new TabNote({
        positions: [{ str: p.string + 1, fret: p.fret }],
        duration: 'w',
      });
      Formatter.FormatAndDraw(ctx, stave, [note]);
    }
  }, [positions, width, height]);

  return <div className="vex-stave" ref={ref} />;
}
