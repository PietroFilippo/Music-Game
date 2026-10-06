import type { FretMarker } from '../../components/Fretboard';
import { naturalAt, naturalFrets, OPEN_STRING_MIDI, positionKey, soundingMidi, type FretPosition } from '../../music/guitar';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, type BoardView, type Copy, type ModuleTwoQuestion } from './model';

export type PairRelation = 'octave' | 'two-octaves' | 'unison' | 'different';
const RELATIONS: PairRelation[] = ['octave', 'two-octaves', 'unison', 'different'];

/** The position of the same note one octave higher on another string, if it is on frets 0–12. */
export function octaveOn(p: FretPosition, string: number): FretPosition | null {
  const fret = soundingMidi(p) + 12 - OPEN_STRING_MIDI[string];
  return fret >= 0 && fret <= NECK_FRETS ? { string, fret } : null;
}

/** The same pitch on the next thinner string, if it is on frets 0–12. */
export function unisonOn(p: FretPosition): FretPosition | null {
  if (p.string === 0) return null;
  const string = p.string - 1;
  const fret = soundingMidi(p) - OPEN_STRING_MIDI[string];
  return fret >= 0 && fret <= NECK_FRETS ? { string, fret } : null;
}

export function relationOf(a: FretPosition, b: FretPosition): PairRelation {
  const distance = Math.abs(soundingMidi(b) - soundingMidi(a));
  return distance === 12 ? 'octave' : distance === 24 ? 'two-octaves' : distance === 0 ? 'unison' : 'different';
}

// Octaves on the Neck: octave shapes across strings and the same pitch in two places.
export function octaveQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text } = c;
  const label = (p: FretPosition) => c.short(naturalAt(p)!);
  const naturalsOn = (string: number) => naturalFrets(string).map(fret => ({ string, fret }));
  // Strings 3 and 2 are tuned 4 frets apart instead of 5, which shifts shapes that cross them.
  const crossesB = (from: number, to: number) => from >= 2 && to <= 1;
  const board = (markers: FretMarker[], highlightStrings: number[] = []): BoardView =>
    ({ markers, highlightStrings, stringLabels: 'name', showFretNumbers: true });

  const octaveStarts = [5, 4, 3, 2].flatMap(string => naturalsOn(string)
    .filter(p => octaveOn(p, string - 2)));

  const findOctave = octaveStarts.map((p): ModuleTwoQuestion => {
    const target = octaveOn(p, p.string - 2)!;
    const frets = target.fret - p.fret;
    return {
      id: `octave-${positionKey(p)}`,
      prompt: text(
        `Toque na oitava acima de ${c.name(naturalAt(p)!)} na ${target.string + 1}ª corda.`,
        `Tap the octave above ${c.name(naturalAt(p)!)} on string ${target.string + 1}.`,
      ),
      answer: {
        kind: 'board',
        board: board([{ ...p, label: label(p), tone: 'root' }], [target.string]),
        accepts: [target],
      },
      explanation: text(
        `Duas cordas acima e ${frets} casas à frente: ${c.where(p)} → ${c.where(target)}.${crossesB(p.string, target.string) ? ' Ao passar da 3ª para a 2ª corda, o desenho anda uma casa a mais.' : ''}`,
        `Two strings over and ${frets} frets up: ${c.where(p)} → ${c.where(target)}.${crossesB(p.string, target.string) ? ' Crossing from string 3 to string 2 moves the shape one fret further.' : ''}`,
      ),
      reveal: board([{ ...p, label: label(p), tone: 'root' }, { ...target, label: label(target), tone: 'accent' }], [target.string]),
      notation: target,
    };
  });

  const unisonStarts = [5, 4, 3, 2, 1].flatMap(string => naturalsOn(string).filter(p => unisonOn(p)));

  const findUnison = unisonStarts.map((p): ModuleTwoQuestion => {
    const target = unisonOn(p)!;
    const frets = p.fret - target.fret;
    return {
      id: `unison-${positionKey(p)}`,
      prompt: text(
        `Toque no mesmo som de ${c.name(naturalAt(p)!)} na ${target.string + 1}ª corda.`,
        `Tap the same pitch as ${c.name(naturalAt(p)!)} on string ${target.string + 1}.`,
      ),
      answer: {
        kind: 'board',
        board: board([{ ...p, label: label(p), tone: 'root' }], [target.string]),
        accepts: [target],
      },
      explanation: text(
        `Na corda vizinha mais aguda, o mesmo som fica ${frets} casas para trás: ${c.where(p)} = ${c.where(target)}.${frets === 4 ? ' Da 3ª para a 2ª corda são 4 casas, não 5.' : ''}`,
        `On the next higher string, the same pitch is ${frets} frets lower: ${c.where(p)} = ${c.where(target)}.${frets === 4 ? ' From string 3 to string 2 it is 4 frets, not 5.' : ''}`,
      ),
      reveal: board([{ ...p, label: label(p), tone: 'root' }, { ...target, label: label(target), tone: 'accent' }], [target.string]),
      notation: target,
    };
  });

  const relationLabel: Record<PairRelation, string> = {
    octave: text('Mesma nota, uma oitava acima', 'Same note, one octave higher'),
    'two-octaves': text('Mesma nota, duas oitavas acima', 'Same note, two octaves higher'),
    unison: text('Exatamente o mesmo som', 'Exactly the same pitch'),
    different: text('Notas diferentes', 'Different notes'),
  };
  // A few pairs of each kind; "different" pairs miss an octave shape by one fret.
  const every = <T,>(items: T[], step: number) => items.filter((_, i) => i % step === 0);
  const pairs: [FretPosition, FretPosition][] = [
    ...every(octaveStarts, 4).map((p): [FretPosition, FretPosition] => [p, octaveOn(p, p.string - 2)!]),
    ...naturalsOn(5).filter(p => p.fret <= 10).map((p): [FretPosition, FretPosition] => [p, { string: 0, fret: p.fret }]),
    ...every(unisonStarts, 4).map((p): [FretPosition, FretPosition] => [p, unisonOn(p)!]),
    ...every(octaveStarts, 4).map((p, i): [FretPosition, FretPosition] => {
      const octave = octaveOn(p, p.string - 2)!;
      const shift = octave.fret === NECK_FRETS ? -1 : octave.fret === 0 || i % 2 === 0 ? 1 : -1;
      return [p, { ...octave, fret: octave.fret + shift }];
    }),
  ];

  const classify = pairs.map(([a, b]): ModuleTwoQuestion => {
    const relation = relationOf(a, b);
    const names = (p: FretPosition) => c.dual(soundingMidi(p) % 12);
    return {
      id: `pair-${positionKey(a)}-${positionKey(b)}`,
      prompt: text('Como se relacionam as notas das posições 1 e 2?', 'How are the notes at positions 1 and 2 related?'),
      answer: {
        kind: 'choice',
        visual: { kind: 'board', board: board([{ ...a, label: '1', tone: 'root' }, { ...b, label: '2', tone: 'accent' }]) },
        choices: shuffle(RELATIONS).map(value => ({ value, label: relationLabel[value] })),
        correct: relation,
      },
      explanation: text(
        `1 é ${names(a)} (${c.where(a)}) e 2 é ${names(b)} (${c.where(b)}): ${relationLabel[relation].toLowerCase()}.`,
        `1 is ${names(a)} (${c.where(a)}) and 2 is ${names(b)} (${c.where(b)}): ${relationLabel[relation].toLowerCase()}.`,
      ),
      reveal: board([
        { ...a, label: c.shortPitch(soundingMidi(a) % 12), tone: 'root' },
        { ...b, label: c.shortPitch(soundingMidi(b) % 12), tone: 'accent' },
      ]),
    };
  });

  return [findOctave, findUnison, classify];
}
