import { SEVENTHS, spellsCleanly } from '../../music/chords';
import { soundingMidi } from '../../music/guitar';
import { majorSevenths, MAJOR_SEVENTH_ROMANS } from '../../music/harmony';
import { spelledPitchClass } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { noteKey, type Copy } from '../fretboard/model';
import { MAJOR_KEYS } from '../module-three/progressions';
import { baseQuestion, board, chordKey, degreeChoices, describeChord, exactPositions, example, notesOf, ROOTS, symbol, type SeventhQuestion } from './common';

export { MAJOR_KEYS } from '../module-three/progressions';
export const GUIDE_TRANSITIONS = [[2, 5], [5, 1]] as const;
export function progressionQuestions(c: Copy): SeventhQuestion[][] {
  const { text } = c;
  const roman = (n: number) => MAJOR_SEVENTH_ROMANS[c.language][n - 1];
  const degree = MAJOR_KEYS.flatMap(key => majorSevenths(key).map((chord): SeventhQuestion => {
    const e = example(chord);
    const chords = majorSevenths(key);
    // The numeral already gives the quality, so every choice shares it: only the root decides.
    // Roots come from the key first, then from other common roots when the key's spell awkwardly.
    const roots = [...shuffle(chords.map(x => x.root)), ...shuffle(ROOTS)];
    const others = roots.filter((r, i) => noteKey(r) !== noteKey(chord.root) && roots.findIndex(x => noteKey(x) === noteKey(r)) === i)
      .map(root => ({ root, quality: chord.quality }))
      .filter(o => spellsCleanly(o.root, SEVENTHS[o.quality])).slice(0, 3);
    return {
      ...baseQuestion(c, e), id: `degree-${noteKey(key)}-${chord.degree}`,
      prompt: text(`Qual acorde é o grau ${roman(chord.degree)} de ${c.spelled(key)} maior?`, `Which chord is degree ${roman(chord.degree)} of ${c.spelled(key)} major?`),
      answer: { kind: 'choice', visual: { kind: 'text', text: MAJOR_SEVENTH_ROMANS[c.language].join(' · ') }, choices: shuffle([chord, ...others]).map(o => ({ value: chordKey(o), label: symbol(c, o) })), correct: chordKey(chord) },
      explanation: `${text('Campo harmônico', 'Harmonized major scale')}: ${chords.map(o => `${roman(o.degree)} = ${symbol(c, o)}`).join(' · ')}. ${describeChord(c, e)}`,
    };
  }));
  const transpose = MAJOR_KEYS.map((key, i): SeventhQuestion => {
    const target = MAJOR_KEYS[(i + 1) % MAJOR_KEYS.length];
    const chords = majorSevenths(target);
    const names = (key: typeof target) => [2, 5, 1].map(n => symbol(c, majorSevenths(key)[n - 1])).join(' – ');
    // Every option is ii–V–I; suffix matching must not reveal the requested key.
    const candidates = MAJOR_KEYS.filter(k => noteKey(k) !== noteKey(target));
    const options = [target, ...shuffle(candidates.filter(k => k.accidental)).slice(0, 1), ...shuffle(candidates.filter(k => !k.accidental)).slice(0, 2)];
    const e = example(chords[1]);
    return {
      ...baseQuestion(c, e), id: `transpose-${noteKey(key)}-${noteKey(target)}`,
      prompt: text(`Transponha ${names(key)} de ${c.spelled(key)} maior para ${c.spelled(target)} maior.`, `Transpose ${names(key)} from ${c.spelled(key)} major to ${c.spelled(target)} major.`),
      answer: { kind: 'choice', visual: { kind: 'text', text: [2, 5, 1].map(roman).join(' – ') }, choices: shuffle(options).map(k => ({ value: noteKey(k), label: names(k) })), correct: noteKey(target) },
      explanation: `${[2, 5, 1].map(roman).join(' – ')} = ${names(target)}. ${[1, 4, 0].map(i => describeChord(c, chords[i])).join(' ')}`,
    };
  });
  const guide = MAJOR_KEYS.flatMap(key => GUIDE_TRANSITIONS.map(([a, b]): SeventhQuestion => {
    const chords = majorSevenths(key);
    const from = example(chords[a - 1]);
    const to = example(chords[b - 1]);
    const source = from.shape.find(t => t.toneIndex === 3)!;
    const targetNote = notesOf(to)[1];
    const fall = (spelledPitchClass(notesOf(from)[3]) - spelledPitchClass(targetNote) + 12) % 12;
    const resolution = soundingMidi(source.position) - fall;
    const accepts = exactPositions(resolution);
    const degree = SEVENTHS[to.quality].tones[1].degree;
    const steps = text(fall === 1 ? '1 semitom abaixo' : `${fall} semitons abaixo`, fall === 1 ? '1 semitone down' : `${fall} semitones down`);
    return {
      ...baseQuestion(c, to), id: `guide-${noteKey(key)}-${a}-${b}`,
      prompt: text(`De ${symbol(c, from)} para ${symbol(c, to)}: a sétima ${c.spelled(notesOf(from)[3])} (♭7) desce por grau conjunto para a terça. Toque a resolução na altura exata.`, `From ${symbol(c, from)} to ${symbol(c, to)}: the seventh ${c.spelled(notesOf(from)[3])} (♭7) falls by step to the third. Tap the resolution at the exact pitch.`),
      answer: { kind: 'board', board: board([{ ...source.position, label: '♭7', tone: 'accent' }]), accepts },
      // The seventh and every place its resolution sounds at that exact pitch, and only those notes.
      reveal: board([{ ...source.position, label: '♭7', tone: 'root' }, ...accepts.map(p => ({ ...p, label: degree, tone: 'accent' as const }))]),
      sound: { notes: [soundingMidi(source.position), resolution], spacing: 0.6 },
      explanation: `${describeChord(c, from)} ${describeChord(c, to)} ${c.spelled(notesOf(from)[3])} (♭7) → ${c.spelled(targetNote)} (${degree}): ${steps}. ${text('Terças e sétimas são notas-guia.', 'Thirds and sevenths are guide tones.')}`,
    };
  }));
  const closest = MAJOR_KEYS.flatMap(key => GUIDE_TRANSITIONS.map(([a, b]): SeventhQuestion => {
    const chords = majorSevenths(key);
    const from = example(chords[a - 1]);
    const to = example(chords[b - 1]);
    const target = notesOf(to)[1];
    const seventh = notesOf(from)[3];
    // Distance to each tone of the next chord, in the nearer direction.
    const distance = (n: typeof seventh) => {
      const up = (spelledPitchClass(n) - spelledPitchClass(seventh) + 12) % 12;
      return Math.min(up, 12 - up);
    };
    const distances = notesOf(to).map(n => `${c.spelled(n)} ${distance(n)}`).join(' · ');
    return {
      ...baseQuestion(c, to), id: `closest-${noteKey(key)}-${a}-${b}`,
      prompt: text(`De ${symbol(c, from)} para ${symbol(c, to)}, qual nota do próximo acorde fica mais próxima da sétima ${c.spelled(notesOf(from)[3])} (♭7)? Considere a oitava mais próxima.`, `From ${symbol(c, from)} to ${symbol(c, to)}, which next chord tone is closest to the seventh ${c.spelled(notesOf(from)[3])} (♭7)? Use the nearest octave.`),
      answer: { kind: 'choice', visual: { kind: 'text', text: `${symbol(c, from)} → ${symbol(c, to)}` }, choices: shuffle(notesOf(to)).map(n => ({ value: noteKey(n), label: c.spelled(n) })), correct: noteKey(target) },
      explanation: `${describeChord(c, from)} ${describeChord(c, to)} ${text(`Semitons a partir de ${c.spelled(seventh)}`, `Semitones from ${c.spelled(seventh)}`)}: ${distances}. ${c.spelled(target)} (${SEVENTHS[to.quality].tones[1].degree}) ${text('é a nota mais próxima; a sétima desce por grau conjunto.', 'is the closest tone; the seventh falls by step.')}`,
    };
  }));
  const landing = MAJOR_KEYS.flatMap(key => majorSevenths(key).flatMap(chord => [1, 2, 3].map((target): SeventhQuestion => {
    const e = example(chord);
    const sequence = target === 1 ? [0, 2, 1] : target === 2 ? [0, 1, 2] : [0, 1, 2, 3];
    const degree = SEVENTHS[e.quality].tones[target].degree;
    return {
      ...baseQuestion(c, e), id: `landing-${noteKey(key)}-${chord.degree}-${target}`,
      prompt: text(`Sobre ${symbol(c, e)}, em qual grau termina a frase ${sequence.map(i => c.spelled(notesOf(e)[i])).join(' → ')}?`, `Over ${symbol(c, e)}, on which degree does the phrase ${sequence.map(i => c.spelled(notesOf(e)[i])).join(' → ')} land?`),
      answer: { kind: 'choice', visual: { kind: 'text', text: text('Identifique a nota-alvo final.', 'Identify the final target tone.') }, choices: degreeChoices(e.quality), correct: degree },
      explanation: `${describeChord(c, e)} ${c.spelled(notesOf(e)[target])} (${degree}) ${text('é a nota-alvo final da frase.', 'is the final target tone of the phrase.')}`,
    };
  })));
  return [degree, transpose, guide, closest, landing];
}
