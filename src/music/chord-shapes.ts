import type { ChordQuality } from './chords';
import { OPEN_STRING_MIDI, pitchClassAt, soundingMidi, type FretPosition } from './guitar';
import { spelledPitchClass, type SpelledNote } from './notes';

export interface ShapeTone {
  position: FretPosition;
  toneIndex: number;
  degree: string;
}

export interface ShapeOptions {
  maxFret?: number;
  maxSpan?: number;
}

const degree = (quality: ChordQuality, i: number) => i === 0 ? 'R' : quality.tones[i].degree;
const span = (positions: FretPosition[]) => Math.max(...positions.map(p => p.fret)) - Math.min(...positions.map(p => p.fret));

/** Bass alone determines inversion; the order of the upper voices does not. */
export function inversionOf(root: SpelledNote, quality: ChordQuality, positions: FretPosition[]): number {
  if (!positions.length) return -1;
  const bass = positions.reduce((a, b) => soundingMidi(a) < soundingMidi(b) ? a : b);
  const offset = (pitchClassAt(bass) - spelledPitchClass(root) + 12) % 12;
  return quality.tones.findIndex(t => t.semitones % 12 === offset);
}

/** Each tone exactly once, one per string, all voices within an octave. */
export function closeVoicings(root: SpelledNote, quality: ChordQuality, strings: readonly number[], options: ShapeOptions = {}): ShapeTone[][] {
  const { maxFret = 12, maxSpan = 4 } = options;
  if (strings.length !== quality.tones.length || new Set(strings).size !== strings.length || strings.some(s => s < 0 || s > 5)) return [];
  const rootPc = spelledPitchClass(root);
  const candidates = strings.map(string => Array.from({ length: maxFret + 1 }, (_, fret) => ({ string, fret }))
    .flatMap(position => {
      const i = quality.tones.findIndex(t => (rootPc + t.semitones) % 12 === pitchClassAt(position));
      return i < 0 ? [] : [{ position, toneIndex: i, degree: degree(quality, i) }];
    }));
  const out: ShapeTone[][] = [];
  const visit = (shape: ShapeTone[]) => {
    if (shape.length === strings.length) {
      const sorted = [...shape].sort((a, b) => soundingMidi(a.position) - soundingMidi(b.position));
      if (soundingMidi(sorted.at(-1)!.position) - soundingMidi(sorted[0].position) < 12) out.push(sorted);
      return;
    }
    for (const tone of candidates[shape.length]) {
      if (shape.some(t => t.toneIndex === tone.toneIndex)) continue;
      const next = [...shape, tone];
      if (span(next.map(t => t.position)) <= maxSpan) visit(next);
    }
  };
  visit([]);
  return out.sort((a, b) => Math.min(...a.map(t => t.position.fret)) - Math.min(...b.map(t => t.position.fret)));
}

/** Root through octave, in pitch order, with at most two notes per string. */
export function arpeggioShapes(root: FretPosition, quality: ChordQuality, options: ShapeOptions = {}): ShapeTone[][] {
  const { maxFret = 12, maxSpan = 4 } = options;
  if (root.string < 0 || root.string > 5 || root.fret < 0 || root.fret > maxFret) return [];
  const base = soundingMidi(root);
  const offsets = [...quality.tones.map(t => t.semitones), 12];
  const out: ShapeTone[][] = [];
  const visit = (shape: ShapeTone[]) => {
    if (shape.length === offsets.length) {
      out.push(shape);
      return;
    }
    const previous = shape.at(-1)!.position;
    for (let string = previous.string; string >= 0; string--) {
      const position = { string, fret: base + offsets[shape.length] - OPEN_STRING_MIDI[string] };
      if (position.fret < 0 || position.fret > maxFret || shape.filter(t => t.position.string === string).length >= 2) continue;
      if (span([...shape.map(t => t.position), position]) > maxSpan) continue;
      const i = shape.length % quality.tones.length;
      visit([...shape, { position, toneIndex: i, degree: degree(quality, i) }]);
    }
  };
  visit([{ position: root, toneIndex: 0, degree: 'R' }]);
  return out.sort((a, b) => span(a.map(t => t.position)) - span(b.map(t => t.position)));
}

/** Sum of the movements of pitch-ordered voices, in semitones. */
export function voiceLeadingDistance(from: FretPosition[], to: FretPosition[]): number {
  if (!from.length || from.length !== to.length) return Infinity;
  const pitches = (positions: FretPosition[]) => positions.map(soundingMidi).sort((a, b) => a - b);
  const a = pitches(from);
  return pitches(to).reduce((sum, p, i) => sum + Math.abs(p - a[i]), 0);
}

/** Strings and tone indices are both supplied from bass to treble. Upper-voice order is not inversion. */
export function orderedVoicings(root: SpelledNote, quality: ChordQuality, strings: readonly number[], order: readonly number[], options: ShapeOptions = {}): ShapeTone[][] {
  const { maxFret = 12, maxSpan = 5 } = options;
  const count = quality.tones.length;
  if (strings.length !== count || order.length !== count || order[0] !== 0
    || new Set(strings).size !== count || new Set(order).size !== count
    || strings.some(s => !Number.isInteger(s) || s < 0 || s > 5)
    || order.some(i => !Number.isInteger(i) || i < 0 || i >= count)) return [];
  const pc = spelledPitchClass(root);
  const out: ShapeTone[][] = [];
  const visit = (shape: ShapeTone[]) => {
    if (shape.length === count) { out.push(shape); return; }
    const i = shape.length;
    const toneIndex = order[i];
    for (let fret = 0; fret <= maxFret; fret++) {
      const position = { string: strings[i], fret };
      if (pitchClassAt(position) !== (pc + quality.tones[toneIndex].semitones) % 12) continue;
      if (shape.length && soundingMidi(position) <= soundingMidi(shape.at(-1)!.position)) continue;
      const next = [...shape, { position, toneIndex, degree: degree(quality, toneIndex) }];
      if (span(next.map(t => t.position)) <= maxSpan) visit(next);
    }
  };
  visit([]);
  return out;
}
