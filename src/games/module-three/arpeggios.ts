import { arpeggioShapes, type ShapeTone } from '../../music/chord-shapes';
import { spellsCleanly, TRIADS } from '../../music/chords';
import { OPEN_STRING_MIDI, soundingMidi, type FretPosition } from '../../music/guitar';
import { spell, spelledPitchClass } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { STRINGS, type Copy } from '../fretboard/model';
import { baseQuestion, board, chordKey, describeChord, notesOf, qualityChoices, ROOTS, shapeKey, symbol, type TriadExample, type TriadQuestion } from './common';

/** Shapes for a first course: no skipped strings and at most a three-fret stretch. */
export function beginnerArpeggios(root: FretPosition, quality: 'major' | 'minor'): ShapeTone[][] {
  return arpeggioShapes(root, TRIADS[quality], { maxSpan: 3 })
    .filter(shape => shape.every((t, i) => i === 0 || shape[i - 1].position.string - t.position.string <= 1));
}

export const ARPEGGIO_EXAMPLES: TriadExample[] = ROOTS.flatMap(root => (['major', 'minor'] as const)
  .filter(q => spellsCleanly(root, TRIADS[q]))
  .flatMap(quality => [5, 4, 3].flatMap(string => {
    const fret = (spelledPitchClass(root) - OPEN_STRING_MIDI[string] % 12 + 12) % 12;
    return beginnerArpeggios({ string, fret }, quality).slice(0, 2).map(shape => ({ root, quality, shape }));
  })));

export function arpeggioQuestions(c: Copy): TriadQuestion[][] {
  const { text } = c;
  const base = (e: TriadExample) => ({ ...baseQuestion(c, e), sound: { notes: e.shape.map(t => soundingMidi(t.position)), spacing: 0.3 } });
  const next = ARPEGGIO_EXAMPLES.flatMap(e => [false, true].flatMap(descending => [1, 2, 3].map((index): TriadQuestion => {
    const sequence = descending ? [...e.shape].reverse() : e.shape;
    const target = sequence[index];
    const accepts = STRINGS.map(string => ({ string, fret: soundingMidi(target.position) - OPEN_STRING_MIDI[string] })).filter(p => p.fret >= 0 && p.fret <= 12);
    const path = sequence.map(t => `${c.spelled(notesOf(e)[t.toneIndex])} (${t.degree})`).join(' → ');
    return {
      ...base(e),
      id: `next-${chordKey(e)}-${shapeKey(e.shape)}-${descending ? 'down' : 'up'}-${index}`,
      prompt: text(`Arpejo ${descending ? 'descendente' : 'ascendente'} de ${symbol(c, e)}: ${sequence.slice(0, index).map(t => t.degree).join(' → ')} → ? Toque a próxima nota na altura exata.`,
        `${descending ? 'Descending' : 'Ascending'} ${symbol(c, e)} arpeggio: ${sequence.slice(0, index).map(t => t.degree).join(' → ')} → ? Tap the next note at the exact pitch.`),
      answer: { kind: 'board', board: board(sequence.slice(0, index).map(t => ({ ...t.position, label: t.degree, tone: t.toneIndex === 0 ? 'root' : 'plain' }))), accepts },
      explanation: `${describeChord(c, e)} ${path}. ${c.where(target.position)}.`,
      sound: { notes: sequence.map(t => soundingMidi(t.position)), spacing: 0.3 },
    };
  })));
  const degree = ARPEGGIO_EXAMPLES.map((e, i): TriadQuestion => {
    const target = e.shape[i % 4];
    return {
      ...base(e),
      id: `degree-${chordKey(e)}-${shapeKey(e.shape)}`,
      prompt: text(`Qual grau está marcado no arpejo de ${symbol(c, e)}?`, `Which degree is marked in the ${symbol(c, e)} arpeggio?`),
      answer: { kind: 'choice', visual: { kind: 'board', board: board(e.shape.map(t => ({ ...t.position, label: t === target ? '?' : c.shortSpelled(notesOf(e)[t.toneIndex]), tone: t === target ? 'accent' : 'plain' }))) },
        choices: shuffle(['R', '3', '♭3', '5']).map(value => ({ value, label: value })), correct: target.degree },
      explanation: `${describeChord(c, e)} ${c.spelled(notesOf(e)[target.toneIndex])} = ${target.degree} (${c.where(target.position)}).`,
    };
  });
  const quality = ARPEGGIO_EXAMPLES.map((e): TriadQuestion => ({
    ...base(e),
    id: `quality-${chordKey(e)}-${shapeKey(e.shape)}`,
    prompt: text(`Qual é a qualidade deste arpejo, com fundamental ${c.spelled(e.root)}?`, `What is the quality of this arpeggio, with root ${c.spelled(e.root)}?`),
    answer: {
      kind: 'choice',
      // The roots are shown, so the quality is judged from the distance to the third.
      visual: { kind: 'board', board: board(e.shape.map(t => ({ ...t.position, label: t.toneIndex === 0 ? 'R' : '?', tone: t.toneIndex === 0 ? 'root' : 'plain' }))) },
      choices: qualityChoices(c), correct: e.quality,
    },
    explanation: `${describeChord(c, e)} ${text('A terça fica', 'The third is')} ${TRIADS[e.quality].tones[1].semitones} ${text('semitons acima da fundamental', 'semitones above the root')}.`,
  }));
  const transpose = ARPEGGIO_EXAMPLES.filter(e => e.shape.every(t => t.position.fret >= 1 && t.position.fret <= 10)
    && spellsCleanly(spell((soundingMidi(e.shape[0].position) + 2) % 12, '#'), TRIADS[e.quality])).map((e): TriadQuestion => {
    const target = { string: e.shape[0].position.string, fret: e.shape[0].position.fret + 2 };
    const moved = { root: spell(soundingMidi(target) % 12, '#'), quality: e.quality };
    return {
      ...base(e),
      id: `transpose-${chordKey(e)}-${shapeKey(e.shape)}`,
      prompt: text(`Mova o arpejo de ${symbol(c, e)} duas casas acima. Toque a nova fundamental na ${target.string + 1}ª corda.`,
        `Move the ${symbol(c, e)} arpeggio up two frets. Tap the new root on string ${target.string + 1}.`),
      answer: { kind: 'board', board: base(e).reveal, accepts: [target] },
      explanation: text(`Duas casas = um tom. A nova fundamental é ${c.dual(soundingMidi(target) % 12)}. Os graus permanecem iguais: mova todas as casas +2.`,
        `Two frets = a whole step. The new root is ${c.dual(soundingMidi(target) % 12)}. The degrees stay the same: move every fret +2.`) + ` ${describeChord(c, moved)}`,
      // This question's solution is the transposed chord, including its musical context.
      chord: moved,
      reveal: board(e.shape.map(t => ({ ...t.position, fret: t.position.fret + 2, label: t.degree, tone: t.toneIndex === 0 ? 'root' : 'plain' }))),
      sound: { notes: e.shape.map(t => soundingMidi(t.position) + 2), spacing: 0.3 },
    };
  }).filter(q => spellsCleanly(q.chord.root, TRIADS[q.chord.quality]));
  return [next, degree, quality, transpose];
}
