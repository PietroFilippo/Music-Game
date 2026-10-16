import { closeVoicings, voiceLeadingDistance } from '../../music/chord-shapes';
import { TRIADS } from '../../music/chords';
import { majorTriads, MAJOR_ROMANS } from '../../music/harmony';
import { soundingMidi } from '../../music/guitar';
import { spelledPitchClass, type SpelledNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { noteKey, type Copy } from '../fretboard/model';
import { baseQuestion, chordKey, describeChord, hiddenBoard, noteChoices, notesOf, positionsOf, shapeBoard, shapeKey, STRING_SETS, symbol, type TriadExample, type TriadQuestion } from './common';

export const MAJOR_KEYS: SpelledNote[] = [
  ...(['C', 'G', 'D', 'A', 'E', 'F'] as const).map(letter => ({ letter, accidental: '' as const })),
  { letter: 'B', accidental: 'b' }, { letter: 'E', accidental: 'b' },
];
export const PROGRESSIONS = [[1, 4, 5], [1, 5, 6, 4], [2, 5, 1]];
const example = (chord: ReturnType<typeof majorTriads>[number]): TriadExample => ({
  ...chord, shape: closeVoicings(chord.root, TRIADS[chord.quality], STRING_SETS[0])[0],
});

export function progressionQuestions(c: Copy): TriadQuestion[][] {
  const { text } = c;
  const roman = (n: number) => MAJOR_ROMANS[c.language][n - 1];
  const degree = MAJOR_KEYS.flatMap(key => majorTriads(key).map((chord): TriadQuestion => {
    const e = example(chord);
    const chords = majorTriads(key);
    const options = [chord, ...shuffle(chords.filter(x => x.degree !== chord.degree)).slice(0, 3)];
    return {
      ...baseQuestion(c, e),
      id: `degree-${noteKey(key)}-${chord.degree}`,
      prompt: text(`Qual acorde é o grau ${roman(chord.degree)} de ${c.spelled(key)} maior?`, `Which chord is degree ${roman(chord.degree)} of ${c.spelled(key)} major?`),
      answer: { kind: 'choice', visual: { kind: 'text', text: MAJOR_ROMANS[c.language].join(' · ') },
        choices: shuffle(options).map(o => ({ value: chordKey(o), label: symbol(c, o) })), correct: chordKey(e) },
      explanation: `${text('Campo harmônico de', 'Harmonized major scale of')} ${c.spelled(key)}: ${chords.map(o => `${roman(o.degree)} = ${symbol(c, o)}`).join(' · ')}. ${describeChord(c, e)}`,
    };
  }));
  const transpose = MAJOR_KEYS.flatMap((key, i) => PROGRESSIONS.map((degrees): TriadQuestion => {
    const targetKey = MAJOR_KEYS[(i + 1) % MAJOR_KEYS.length];
    const original = majorTriads(key);
    const destination = majorTriads(targetKey);
    const options = [0, 1, 2, 3].map(shift => degrees.map(n => destination[(n - 1 + shift) % 7]));
    const e = example(options[0][0]);
    const names = (chords: typeof original) => chords.map(o => symbol(c, o)).join(' – ');
    return {
      ...baseQuestion(c, e),
      id: `transpose-${noteKey(key)}-${noteKey(targetKey)}-${degrees.join('.')}`,
      prompt: text(`Transponha ${names(degrees.map(n => original[n - 1]))}, de ${c.spelled(key)} maior para ${c.spelled(targetKey)} maior.`,
        `Transpose ${names(degrees.map(n => original[n - 1]))}, from ${c.spelled(key)} major to ${c.spelled(targetKey)} major.`),
      answer: { kind: 'choice', visual: { kind: 'text', text: degrees.map(roman).join(' – ') },
        choices: shuffle([0, 1, 2, 3]).map(value => ({ value: String(value), label: names(options[value]) })), correct: '0' },
      explanation: `${degrees.map(roman).join(' – ')} = ${names(options[0])}. ${text('Mantenha os graus e as qualidades na nova tonalidade.', 'Keep the degrees and qualities in the new key.')} ${options[0].map(o => describeChord(c, o)).join(' ')}`,
    };
  }));
  const closest = MAJOR_KEYS.flatMap(key => [[1, 4], [5, 1], [2, 5]].flatMap(([a, b]): TriadQuestion[] => {
    const chords = majorTriads(key);
    const from = example(chords[a - 1]);
    const to = chords[b - 1];
    const candidates = STRING_SETS.flatMap(strings => closeVoicings(to.root, TRIADS[to.quality], strings));
    const distance = (shape: TriadExample['shape']) => voiceLeadingDistance(positionsOf(from.shape), positionsOf(shape));
    const sorted = candidates.sort((x, y) => distance(x) - distance(y));
    const unique = sorted.filter((s, i) => sorted.findIndex(t => distance(t) === distance(s)) === i).slice(0, 4);
    if (unique.length < 4) return [];
    const e = { ...to, shape: unique[0] };
    const label = (shape: TriadExample['shape']) => [...shape].sort((x, y) => x.position.string - y.position.string)
      .map(t => `${t.position.string + 1}:${t.position.fret}`).join(' · ');
    return [{
      ...baseQuestion(c, e),
      id: `closest-${noteKey(key)}-${a}-${b}`,
      prompt: text(`De ${symbol(c, from)} para ${symbol(c, e)}: qual opção move menos as três vozes? Leia corda:casa.`,
        `From ${symbol(c, from)} to ${symbol(c, e)}: which option moves the three voices least? Read string:fret.`),
      answer: { kind: 'choice', visual: { kind: 'board', board: shapeBoard(from.shape) }, choices: shuffle(unique).map(s => ({ value: shapeKey(s), label: label(s) })), correct: shapeKey(e.shape) },
      explanation: `${describeChord(c, from)} ${describeChord(c, e)} ${text('Do baixo ao agudo, movimentos', 'From low to high, movements')}: ${e.shape.map((t, i) => Math.abs(soundingMidi(t.position) - soundingMidi(from.shape[i].position))).join(' + ')} = ${distance(e.shape)} ${text('semitons no total; as outras opções movem mais.', 'semitones in total; the other options move further.')}`,
    }];
  }));
  const common = MAJOR_KEYS.flatMap(key => [[1, 4], [4, 5], [5, 1], [2, 5], [1, 6]].flatMap(([a, b]): TriadQuestion[] => {
    const chords = majorTriads(key);
    const from = example(chords[a - 1]);
    const to = example(chords[b - 1]);
    const shared = notesOf(from).filter(n => notesOf(to).some(m => spelledPitchClass(n) === spelledPitchClass(m)));
    if (shared.length !== 1) return [];
    const note = shared[0];
    return [{
      ...baseQuestion(c, to),
      id: `common-${noteKey(key)}-${a}-${b}`,
      prompt: text(`Qual nota é comum a ${symbol(c, from)} e ${symbol(c, to)}?`, `Which note is common to ${symbol(c, from)} and ${symbol(c, to)}?`),
      answer: { kind: 'choice', visual: { kind: 'text', text: `${symbol(c, from)} → ${symbol(c, to)}` }, choices: noteChoices(c, note), correct: noteKey(note) },
      explanation: `${describeChord(c, from)} ${describeChord(c, to)} ${c.spelled(note)}: ${text('mantenha essa nota na mesma altura quando possível.', 'keep this note at the same pitch when possible.')}`,
    }];
  }));
  const root = MAJOR_KEYS.flatMap(key => majorTriads(key).map((chord): TriadQuestion => {
    const e = example(chord);
    return {
      ...baseQuestion(c, e),
      id: `root-${noteKey(key)}-${chord.degree}`,
      prompt: text(`Grau ${roman(chord.degree)} de ${c.spelled(key)} maior: toque a fundamental entre as posições marcadas.`,
        `Degree ${roman(chord.degree)} of ${c.spelled(key)} major: tap the root among the marked positions.`),
      answer: { kind: 'board', board: hiddenBoard(e.shape), accepts: positionsOf(e.shape.filter(t => t.toneIndex === 0)) },
      explanation: `${roman(chord.degree)} = ${symbol(c, e)}. ${describeChord(c, e)}`,
    };
  }));
  return [degree, transpose, closest, common, root];
}
