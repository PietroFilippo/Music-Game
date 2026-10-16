import type { ShapeTone } from '../../music/chord-shapes';
import { orderedVoicings } from '../../music/chord-shapes';
import { chordNotes, chordSymbol, SEVENTH_QUALITIES, SEVENTHS, spellsCleanly, type SeventhQuality } from '../../music/chords';
import { OPEN_STRING_MIDI, soundingMidi } from '../../music/guitar';
import { LETTERS, spelledPitchClass, type Accidental, type SpelledNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { noteKey, type Copy, type FretboardQuestion } from '../fretboard/model';
import { ROOTS as TRIAD_ROOTS, shapeBoard } from '../module-three/common';

export { board, hiddenBoard, positionsOf, shapeBoard, shapeKey } from '../module-three/common';
export const ROOTS: SpelledNote[] = [...TRIAD_ROOTS, { letter: 'C', accidental: '#' }, { letter: 'G', accidental: '#' }];
// Both arrays run from low to high. Tone indices 0,1,2,3 mean root, third, fifth, seventh.
export const VOICING_LAYOUTS = [
  { strings: [5, 3, 2, 1], order: [0, 3, 1, 2] },
  { strings: [4, 2, 1, 0], order: [0, 3, 1, 2] },
  { strings: [4, 3, 2, 1], order: [0, 2, 3, 1] },
  { strings: [3, 2, 1, 0], order: [0, 2, 3, 1] },
  { strings: [3, 2, 1, 0], order: [0, 1, 2, 3] },
] as const;

export interface SeventhExample {
  root: SpelledNote;
  quality: SeventhQuality;
  shape: ShapeTone[];
}
export interface SeventhQuestion extends FretboardQuestion {
  chord: Pick<SeventhExample, 'root' | 'quality'>;
}
export const chordKey = (e: Pick<SeventhExample, 'root' | 'quality'>) => `${noteKey(e.root)}-${e.quality}`;
export const symbol = (c: Copy, e: Pick<SeventhExample, 'root' | 'quality'>) => chordSymbol(e.root, SEVENTHS[e.quality], c.language);
export const notesOf = (e: Pick<SeventhExample, 'root' | 'quality'>) => chordNotes(e.root, SEVENTHS[e.quality])!;
export const describeChord = (c: Copy, e: Pick<SeventhExample, 'root' | 'quality'>) =>
  `${symbol(c, e)}: ${notesOf(e).map((n, i) => `${c.spelled(n)} (${i === 0 ? 'R' : SEVENTHS[e.quality].tones[i].degree})`).join(' · ')}.`;
export const baseQuestion = (c: Copy, e: SeventhExample) => ({
  chord: { root: e.root, quality: e.quality }, explanation: describeChord(c, e), reveal: shapeBoard(e.shape),
  sound: { notes: e.shape.map(t => soundingMidi(t.position)), spacing: 0.03 },
});
export const VOICING_EXAMPLES: SeventhExample[] = ROOTS.flatMap(root => SEVENTH_QUALITIES.filter(q => spellsCleanly(root, SEVENTHS[q]))
  .flatMap(quality => VOICING_LAYOUTS.flatMap(l => orderedVoicings(root, SEVENTHS[quality], l.strings, l.order).map(shape => ({ root, quality, shape })))));
export const SEVENTH_EXAMPLES = ROOTS.flatMap(root => SEVENTH_QUALITIES.flatMap(quality => {
  const e = VOICING_EXAMPLES.find(e => noteKey(e.root) === noteKey(root) && e.quality === quality);
  return e ? [e] : [];
}));
export const example = (chord: Pick<SeventhExample, 'root' | 'quality'>): SeventhExample => ({
  ...chord, shape: VOICING_EXAMPLES.find(e => chordKey(e) === chordKey(chord))!.shape,
});
export const exactPositions = (midi: number) => OPEN_STRING_MIDI.map((open, string) => ({ string, fret: midi - open })).filter(p => p.fret >= 0 && p.fret <= 12);
export const qualityChoices = (c: Copy, correct: SeventhQuality, symbols = false, root?: SpelledNote) =>
  shuffle([correct, ...shuffle(SEVENTH_QUALITIES.filter(q => q !== correct)).slice(0, 3)]).map(value => ({
    value, label: symbols ? chordSymbol(root!, SEVENTHS[value], c.language) : SEVENTHS[value].name[c.language],
  }));
export const degreeChoices = (correct: string) => shuffle([correct, ...shuffle(['R', '3', '♭3', '5', '♭5', '♯5', '7', '♭7', '♭♭7'].filter(x => x !== correct)).slice(0, 3)]).map(value => ({ value, label: value }));

/** Two natural and two altered names prevent a lone accidental from revealing the answer. */
export function noteChoices(c: Copy, correct: SpelledNote) {
  const index = LETTERS.indexOf(correct.letter);
  const candidates = [0, -1, 1, -2, 2].flatMap(offset => (['', '#', 'b'] as Accidental[])
    .map(accidental => ({ letter: LETTERS[(index + offset + 7) % 7], accidental })))
    .filter(n => !(['E#', 'B#', 'Fb', 'Cb'].includes(noteKey(n))));
  const picked = [correct];
  for (const altered of [false, true]) for (const n of candidates) {
    if (picked.filter(p => Boolean(p.accidental) === altered).length >= 2) break;
    if (Boolean(n.accidental) !== altered || picked.some(p => spelledPitchClass(p) === spelledPitchClass(n))) continue;
    picked.push(n);
  }
  return shuffle(picked).map(n => ({ value: noteKey(n), label: c.spelled(n) }));
}
