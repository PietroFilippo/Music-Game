import { useEffect, useRef } from 'react';
import { Renderer, TabStave, TabNote, Formatter } from 'vexflow/bravura';
import type { FretPosition } from '../music/guitar';

interface Props {
  positions: FretPosition[];
  width?: number;
  height?: number;
}

export function GuitarTab({ positions, width = 280, height = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const first = positions[0];
  // Redraw only when the shown position changes, not for every new array
  // (timed rounds re-render ten times a second).
  const string = first?.string;
  const fret = first?.fret;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    const stave = new TabStave(10, 10, width - 30);
    stave.addClef('tab').setContext(ctx).draw();
    if (string !== undefined && fret !== undefined) {
      const note = new TabNote({
        positions: [{ str: string + 1, fret }],
        duration: 'w',
      });
      Formatter.FormatAndDraw(ctx, stave, [note]);
    }
  }, [string, fret, width, height]);

  return <div className="vex-stave" ref={ref} />;
}
