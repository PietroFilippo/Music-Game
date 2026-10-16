import { useEffect, useRef } from 'react';
import { Accidental, Beam, Formatter, Renderer, Stave, StaveNote, TabNote, TabStave, Voice } from 'vexflow/bravura';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { writtenVexKey } from '../music/guitar';
import type { MeasureNote } from '../music/measure';

interface Props {
  notes: MeasureNote[];
  label: string;
}

/** A complete 4/4 measure, with matching rhythmic tab below written guitar notation. */
export function MeasureNotation({ notes, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useMediaQuery('(max-width: 480px)') ? 320 : 500;
  // Timers and inline lesson arrays must not trigger another VexFlow render.
  const content = JSON.stringify(notes);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const items: MeasureNote[] = JSON.parse(content);
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, 310);
    const ctx = renderer.getContext();
    const staff = new Stave(10, 25, width - 20).addClef('treble').addTimeSignature('4/4');
    const tab = new TabStave(10, 180, width - 20).addClef('tab').addTimeSignature('4/4');
    const start = Math.max(staff.getNoteStartX(), tab.getNoteStartX());
    staff.setNoteStartX(start).setContext(ctx).draw();
    tab.setNoteStartX(start).setContext(ctx).draw();
    const staffNotes = items.map(({ position, duration }) => {
      const key = writtenVexKey(position);
      const note = new StaveNote({ keys: [key], duration, auto_stem: true });
      const accidental = key.split('/')[0].slice(1);
      if (accidental) note.addModifier(new Accidental(accidental), 0);
      return note;
    });
    const tabNotes = items.map(({ position, duration }) => new TabNote({
      positions: [{ str: position.string + 1, fret: position.fret }], duration,
    }, duration !== 'w'));
    const beams = [...Beam.generateBeams(staffNotes), ...Beam.generateBeams(tabNotes, { stem_direction: 1 })];
    const staffVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(staffNotes);
    const tabVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(tabNotes);
    new Formatter().joinVoices([staffVoice]).joinVoices([tabVoice])
      .format([staffVoice, tabVoice], width - start - 30);
    staffVoice.draw(ctx, staff);
    tabVoice.draw(ctx, tab);
    beams.forEach(beam => beam.setContext(ctx).draw());
  }, [content, width]);

  return <div className="vex-stave" role="img" aria-label={label} ref={ref} />;
}
