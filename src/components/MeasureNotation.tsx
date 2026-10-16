import { useEffect, useRef } from 'react';
import { Beam, Formatter, Stave, TabNote, TabStave, Voice } from 'vexflow/bravura';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { writtenVexKey } from '../music/guitar';
import type { MeasureNote } from '../music/measure';
import {
  drawHalo, drawStrings, fitDrawing, hideTabLines, INK, inkNote, startDrawing, STRING_NAMES_WIDTH, styleStave, TAB_FONT,
} from './notation';
import { useStringNames } from './useStringNames';

interface Props {
  notes: MeasureNote[];
  label: string;
  /** A note to point at: ringed on the staff, its number and string lit in the tab. */
  highlightIndex?: number;
}

const HEIGHT = 310;

/** A complete 4/4 measure, with matching rhythmic tab below written guitar notation. */
export function MeasureNotation({ notes, label, highlightIndex }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useMediaQuery('(max-width: 480px)') ? 320 : 500;
  const names = useStringNames().join('|');
  // Timers and inline lesson arrays must not trigger another VexFlow render.
  const content = JSON.stringify(notes);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items: MeasureNote[] = JSON.parse(content);
    const ctx = startDrawing(el, width, HEIGHT);
    const left = STRING_NAMES_WIDTH;
    const staff = new Stave(left, 25, width - left - 10).addClef('treble').addTimeSignature('4/4');
    const tab = new TabStave(left, 180, width - left - 10).addClef('tab').addTimeSignature('4/4');
    const start = Math.max(staff.getNoteStartX(), tab.getNoteStartX());
    styleStave(staff);
    styleStave(tab);
    hideTabLines(tab);
    staff.setNoteStartX(start).setContext(ctx).draw();
    tab.setNoteStartX(start).setContext(ctx).draw();
    const marked = highlightIndex === undefined ? undefined : items[highlightIndex];
    drawStrings(ctx, tab, names.split('|'), marked?.position.string);

    const staffNotes = items.map(({ position, duration }, i) =>
      inkNote('treble', writtenVexKey(position), i === highlightIndex, duration));
    const tabNotes = items.map(({ position, duration }, i) => {
      const note = new TabNote({ positions: [{ str: position.string + 1, fret: position.fret }], duration }, duration !== 'w');
      note.render_options.font = TAB_FONT;
      const color = i === highlightIndex ? INK.highlight : INK.glyph;
      note.setStyle({ fillStyle: color, strokeStyle: color });
      return note;
    });
    const beams = [...Beam.generateBeams(staffNotes), ...Beam.generateBeams(tabNotes, { stem_direction: 1 })];
    beams.forEach(beam => beam.setStyle({ fillStyle: INK.glyph, strokeStyle: INK.glyph }));
    const staffVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(staffNotes);
    const tabVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(tabNotes);
    new Formatter().joinVoices([staffVoice]).joinVoices([tabVoice])
      .format([staffVoice, tabVoice], width - start - 30);
    // The ring goes behind the notehead, so it is drawn before the notes.
    if (highlightIndex !== undefined) {
      staffVoice.setStave(staff);
      staffNotes.forEach(note => note.setStave(staff));
      drawHalo(ctx, staffNotes[highlightIndex]);
    }
    staffVoice.draw(ctx, staff);
    tabVoice.draw(ctx, tab);
    beams.forEach(beam => beam.setContext(ctx).draw());
    fitDrawing(el, width, HEIGHT);
  }, [content, width, highlightIndex, names]);

  return <div className="vex-stave vex-measure" role="img" aria-label={label} ref={ref} />;
}
