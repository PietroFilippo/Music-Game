import type { FretMarker } from '../../components/Fretboard';
import { closeVoicings, type ShapeTone } from '../../music/chord-shapes';
import { chordNotes, chordSymbol, spellsCleanly, TRIAD_QUALITIES, TRIADS, type TriadQuality } from '../../music/chords';
import { positionKey, soundingMidi } from '../../music/guitar';
import { LETTERS, spelledPitchClass, type SpelledNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { noteKey, type BoardView, type Choice, type Copy, type FretboardQuestion } from '../fretboard/model';

export const ROOTS: SpelledNote[] = [
  ...(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const).map(letter => ({ letter, accidental: '' as const })),
  { letter: 'B', accidental: 'b' }, { letter: 'E', accidental: 'b' }, { letter: 'F', accidental: '#' },
];
export const STRING_SETS = [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]] as const;

export interface TriadExample {
  root: SpelledNote;
  quality: TriadQuality;
  shape: ShapeTone[];
}

/** Musical context accompanies the question so banks can be audited independently of prose. */
export interface TriadQuestion extends FretboardQuestion {
  chord: Pick<TriadExample, 'root' | 'quality'>;
}

export const shapeKey = (shape: ShapeTone[]) => shape.map(t => positionKey(t.position)).join('_');
export const chordKey = (e: Pick<TriadExample, 'root' | 'quality'>) => `${noteKey(e.root)}-${e.quality}`;
export const symbol = (c: Copy, e: Pick<TriadExample, 'root' | 'quality'>) => chordSymbol(e.root, TRIADS[e.quality], c.language);
export const notesOf = (e: Pick<TriadExample, 'root' | 'quality'>) => chordNotes(e.root, TRIADS[e.quality])!;
export const positionsOf = (shape: ShapeTone[]) => shape.map(t => t.position);
export const board = (markers: FretMarker[]): BoardView => ({ markers, stringLabels: 'number', showFretNumbers: true });
export const shapeBoard = (shape: ShapeTone[], highlight?: number): BoardView => board(shape.map((t, i) => ({
  ...t.position, label: t.degree, tone: i === highlight ? 'accent' : t.toneIndex === 0 ? 'root' : 'plain',
})));
export const hiddenBoard = (shape: ShapeTone[]): BoardView => board(shape.map(t => ({ ...t.position, label: '?', tone: 'plain' })));
export const namedBoard = (c: Copy, e: TriadExample): BoardView => board(e.shape.map(t => ({
  ...t.position, label: c.shortSpelled(notesOf(e)[t.toneIndex]), tone: 'plain',
})));
export const describeChord = (c: Copy, e: Pick<TriadExample, 'root' | 'quality'>) =>
  `${symbol(c, e)}: ${notesOf(e).map((n, i) => `${c.spelled(n)} (${i === 0 ? 'R' : TRIADS[e.quality].tones[i].degree})`).join(' · ')}.`;
// E♯, B♯, F♭ and C♭ would be odd distractors in a course that never uses them.
const RARE = new Set(['E#', 'B#', 'Fb', 'Cb']);
/** The note plus three neighbors by letter, mixing natural and altered spellings so no choice stands out. */
export const noteChoices = (c: Copy, note: SpelledNote): Choice[] => {
  const index = LETTERS.indexOf(note.letter);
  const pool = shuffle([-1, 0, 1].flatMap(d => (['', '#', 'b'] as const)
    .map((accidental): SpelledNote => ({ letter: LETTERS[(index + d + 7) % 7], accidental })))
    .filter(n => !RARE.has(noteKey(n))));
  const used = new Set([spelledPitchClass(note)]);
  const picked: SpelledNote[] = [];
  const take = (n: SpelledNote | undefined) => {
    if (!n || used.has(spelledPitchClass(n)) || picked.length === 3) return;
    used.add(spelledPitchClass(n));
    picked.push(n);
  };
  take(pool.find(n => n.accidental && !used.has(spelledPitchClass(n))));
  take(pool.find(n => !n.accidental && !used.has(spelledPitchClass(n))));
  pool.forEach(take);
  return shuffle([note, ...picked]).map(n => ({ value: noteKey(n), label: c.spelled(n) }));
};
export const qualityChoices = (c: Copy) => shuffle(TRIAD_QUALITIES).map(value => ({ value, label: TRIADS[value].name[c.language] }));
export const symbolChoices = (c: Copy, root: SpelledNote) => shuffle(TRIAD_QUALITIES).map(value => ({
  value, label: chordSymbol(root, TRIADS[value], c.language),
}));
export const baseQuestion = (c: Copy, e: TriadExample) => ({
  chord: { root: e.root, quality: e.quality },
  explanation: describeChord(c, e),
  reveal: shapeBoard(e.shape),
  sound: { notes: e.shape.map(t => soundingMidi(t.position)), spacing: 0.03 },
});

export const TRIAD_EXAMPLES: TriadExample[] = ROOTS.flatMap(root => TRIAD_QUALITIES
  .filter(q => spellsCleanly(root, TRIADS[q]))
  .map(quality => ({ root, quality, shape: closeVoicings(root, TRIADS[quality], STRING_SETS[0])[0] })));

export const VOICING_EXAMPLES: TriadExample[] = ROOTS.flatMap(root => (['major', 'minor'] as const)
  .filter(q => spellsCleanly(root, TRIADS[q]))
  .flatMap(quality => STRING_SETS.flatMap(strings => {
    const shapes = closeVoicings(root, TRIADS[quality], strings);
    return [0, 1, 2].flatMap(i => {
      const shape = shapes.find(s => s[0].toneIndex === i);
      return shape ? [{ root, quality, shape }] : [];
    });
  })));
