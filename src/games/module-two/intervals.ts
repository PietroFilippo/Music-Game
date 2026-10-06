import type { FretMarker } from '../../components/Fretboard';
import { naturalAt, naturalFrets, OPEN_STRING_MIDI, positionKey, soundingMidi, type FretPosition } from '../../music/guitar';
import { INTERVALS, intervalBySemitones, spellInterval, type Interval } from '../../music/intervals';
import { LETTERS, type SpelledNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, type BoardView, type Choice, type Copy, type ModuleTwoQuestion } from './model';

// Spellings this course does not use yet.
const RARE = new Set(['E#', 'B#', 'Fb', 'Cb']);

/** The position an interval above `root` on `string`, if it is on frets 0–12. */
export function intervalOn(root: FretPosition, semitones: number, string: number): FretPosition | null {
  const fret = soundingMidi(root) + semitones - OPEN_STRING_MIDI[string];
  return fret >= 0 && fret <= NECK_FRETS ? { string, fret } : null;
}

// Intervals: name, find and spell the distance between two notes.
export function intervalQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text } = c;
  const name = (interval: Interval) => interval[c.language];
  // The answer and its neighbors by size, so players must count.
  const intervalChoices = (semitones: number): Choice[] => {
    const nearby = INTERVALS.filter(i => i.semitones !== semitones)
      .sort((a, b) => Math.abs(a.semitones - semitones) - Math.abs(b.semitones - semitones))
      .slice(0, 4);
    return shuffle([intervalBySemitones(semitones), ...shuffle(nearby).slice(0, 3)])
      .map(i => ({ value: String(i.semitones), label: name(i) }));
  };
  const rootMarker = (p: FretPosition): FretMarker => ({ ...p, label: 'R', tone: 'root' });
  const board = (markers: FretMarker[], highlightStrings: number[] = []): BoardView =>
    ({ markers, highlightStrings, stringLabels: 'name', showFretNumbers: true });
  // How the semitones add up between two positions.
  const counting = (root: FretPosition, target: FretPosition, semitones: number) => {
    if (root.string === target.string) {
      return text(`Na mesma corda, conte as casas: ${target.fret - root.fret} casas = ${semitones} semitons.`,
        `On the same string, count the frets: ${target.fret - root.fret} frets = ${semitones} semitones.`);
    }
    const crossing = OPEN_STRING_MIDI[target.string] - OPEN_STRING_MIDI[root.string];
    const frets = target.fret - root.fret;
    return text(
      `A corda seguinte soma ${crossing} semitons${crossing === 4 ? ' (da 3ª para a 2ª corda são 4, não 5)' : ''}; com ${frets} casas de diferença, são ${semitones} semitons.`,
      `The next string adds ${crossing} semitones${crossing === 4 ? ' (from string 3 to string 2 it is 4, not 5)' : ''}; with a ${frets}-fret difference, that makes ${semitones} semitones.`,
    );
  };

  // Roots on strings 6, 5 and 4, frets 0–7, for shapes on one string or the next.
  const roots = [5, 4, 3].flatMap(string => naturalFrets(string, 7).map(fret => ({ string, fret })));
  const placements = INTERVALS.flatMap(interval => roots.flatMap(root => [root.string, root.string - 1]
    .map(string => intervalOn(root, interval.semitones, string))
    .filter((target): target is FretPosition => target !== null)
    .map(target => ({ interval, root, target }))));
  // Spread each interval over a few roots and shapes.
  const sample = (step: number, offset: number) =>
    INTERVALS.flatMap(interval => placements.filter(p => p.interval === interval).filter((_, i) => i % step === offset));

  const nameOnBoard = sample(7, 0).map(({ interval, root, target }): ModuleTwoQuestion => ({
    id: `name-${interval.semitones}-${positionKey(root)}-${positionKey(target)}`,
    prompt: text('Qual é o intervalo da fundamental (R) até a nota marcada?', 'What interval is it from the root (R) up to the marked note?'),
    answer: {
      kind: 'choice',
      visual: { kind: 'board', board: board([rootMarker(root), { ...target, label: '?', tone: 'accent' }]) },
      choices: intervalChoices(interval.semitones),
      correct: String(interval.semitones),
    },
    explanation: `${counting(root, target, interval.semitones)} ${text('É uma', 'That is a')} ${name(interval)}.`,
    reveal: board([rootMarker(root), { ...target, label: interval.degree, tone: 'accent' }]),
    notation: target,
  }));

  const findOnBoard = sample(7, 3).map(({ interval, root, target }): ModuleTwoQuestion => ({
    id: `find-${interval.semitones}-${positionKey(root)}-${target.string}`,
    prompt: text(
      `Toque na ${name(interval)} acima de ${c.name(naturalAt(root)!)} (R) na ${target.string + 1}ª corda.`,
      `Tap the ${name(interval)} above ${c.name(naturalAt(root)!)} (R) on string ${target.string + 1}.`,
    ),
    answer: { kind: 'board', board: board([rootMarker(root)], [target.string]), accepts: [target] },
    explanation: `${name(interval)}: ${interval.semitones} ${text('semitons', 'semitones')}. ${counting(root, target, interval.semitones)}`,
    reveal: board([rootMarker(root), { ...target, label: interval.degree, tone: 'accent' }], [target.string]),
    notation: target,
  }));

  const spelled = LETTERS.flatMap(letter => INTERVALS
    .filter(interval => interval.semitones !== 6 && interval.semitones !== 12)
    .map(interval => ({ interval, root: { letter, accidental: '' } as SpelledNote, target: spellInterval({ letter, accidental: '' }, interval) }))
    .filter((q): q is { interval: Interval; root: SpelledNote; target: SpelledNote } =>
      q.target !== null && !RARE.has(`${q.target.letter}${q.target.accidental}`)));

  const nameFromNotes = spelled.map(({ interval, root, target }): ModuleTwoQuestion => {
    const rootIndex = LETTERS.indexOf(root.letter);
    // Show the interval on the neck: the root on string 5, the target on the first string where it fits.
    const rootPosition = { string: 4, fret: naturalFrets(4).find(f => naturalAt({ string: 4, fret: f }) === root.letter)! };
    const targetPosition = [4, 3, 2, 1, 0].map(string => intervalOn(rootPosition, interval.semitones, string))
      .find((p): p is FretPosition => p !== null)!;
    const letters = Array.from({ length: interval.number }, (_, i) => c.short(LETTERS[(rootIndex + i) % 7])).join(', ');
    return {
      id: `spell-${root.letter}-${interval.semitones}`,
      prompt: text(`Qual é o intervalo de ${c.spelled(root)} até ${c.spelled(target)}, subindo?`,
        `What interval is it from ${c.spelled(root)} up to ${c.spelled(target)}?`),
      answer: {
        kind: 'choice',
        visual: { kind: 'text', text: `${c.shortSpelled(root)} → ${c.shortSpelled(target)}` },
        choices: intervalChoices(interval.semitones),
        correct: String(interval.semitones),
      },
      explanation: text(
        `${interval.number} nomes de nota (${letters}) e ${interval.semitones} semitons: ${name(interval)}.`,
        `${interval.number} letter names (${letters}) and ${interval.semitones} semitones: a ${name(interval)}.`,
      ),
      reveal: board([rootMarker(rootPosition), { ...targetPosition, label: interval.degree, tone: 'accent' }]),
      notation: { ...targetPosition, flat: target.accidental === 'b' },
    };
  });

  return [nameOnBoard, findOnBoard, nameFromNotes];
}
