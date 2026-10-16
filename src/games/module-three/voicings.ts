import { inversionOf } from '../../music/chord-shapes';
import { TRIADS } from '../../music/chords';
import { shuffle } from '../../music/theory';
import type { Copy } from '../fretboard/model';
import { baseQuestion, board, chordKey, hiddenBoard, namedBoard, notesOf, positionsOf, shapeKey, symbol, symbolChoices, VOICING_EXAMPLES, type TriadQuestion } from './common';

export function voicingQuestions(c: Copy): TriadQuestion[][] {
  const { text } = c;
  const inversionNames = [text('Posição fundamental', 'Root position'), text('1ª inversão', '1st inversion'), text('2ª inversão', '2nd inversion'), text('Não é uma tríade completa', 'Not a complete triad')];
  const inversion = VOICING_EXAMPLES.map((e): TriadQuestion => {
    const i = inversionOf(e.root, TRIADS[e.quality], positionsOf(e.shape));
    // Examples are ordered by sounding pitch, not by fret or string number.
    const bass = e.shape[0];
    return {
      ...baseQuestion(c, e),
      id: `inversion-${chordKey(e)}-${shapeKey(e.shape)}`,
      prompt: text(`Qual é a inversão de ${symbol(c, e)} neste grupo de cordas?`, `Which inversion of ${symbol(c, e)} is on this string set?`),
      answer: { kind: 'choice', visual: { kind: 'board', board: namedBoard(c, e) }, choices: shuffle([0, 1, 2, 3]).map(value => ({ value: String(value), label: inversionNames[value] })), correct: String(i) },
      explanation: `${baseQuestion(c, e).explanation} ${text('O baixo é', 'The bass is')} ${c.spelled(notesOf(e)[bass.toneIndex])} (${bass.degree}): ${inversionNames[bass.toneIndex]}.`,
    };
  });
  const degree = VOICING_EXAMPLES.map((e, index): TriadQuestion => {
    const target = e.shape[index % 3];
    return {
      ...baseQuestion(c, e),
      id: `degree-${chordKey(e)}-${shapeKey(e.shape)}-${index % 3}`,
      prompt: text(`Qual é o grau da nota marcada em ${symbol(c, e)}?`, `What is the degree of the marked note in ${symbol(c, e)}?`),
      answer: { kind: 'choice', visual: { kind: 'board', board: board(e.shape.map(t => ({ ...t.position, label: t === target ? '?' : c.shortSpelled(notesOf(e)[t.toneIndex]), tone: t === target ? 'accent' : 'plain' }))) },
        choices: shuffle(['R', '3', '♭3', '5']).map(value => ({ value, label: value })), correct: target.degree },
      explanation: `${baseQuestion(c, e).explanation} ${c.spelled(notesOf(e)[target.toneIndex])} = ${target.degree} (${c.where(target.position)}).`,
    };
  });
  const root = VOICING_EXAMPLES.map((e): TriadQuestion => ({
    ...baseQuestion(c, e),
    id: `root-${chordKey(e)}-${shapeKey(e.shape)}`,
    prompt: text(`Toque a fundamental de ${symbol(c, e)} entre as três posições marcadas.`, `Tap the root of ${symbol(c, e)} among the three marked positions.`),
    answer: { kind: 'board', board: hiddenBoard(e.shape), accepts: positionsOf(e.shape.filter(t => t.toneIndex === 0)) },
  }));
  const chord = VOICING_EXAMPLES.map((e): TriadQuestion => ({
    ...baseQuestion(c, e),
    id: `chord-${chordKey(e)}-${shapeKey(e.shape)}`,
    prompt: text(`Qual cifra tem estas notas, com fundamental ${c.spelled(e.root)}?`, `Which chord symbol has these notes, with root ${c.spelled(e.root)}?`),
    answer: { kind: 'choice', visual: { kind: 'board', board: namedBoard(c, e) }, choices: symbolChoices(c, e.root), correct: e.quality },
  }));
  return [inversion, degree, root, chord];
}
