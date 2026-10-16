import { shuffle } from '../../music/theory';
import type { Copy } from '../fretboard/model';
import { baseQuestion, board, chordKey, degreeChoices, hiddenBoard, notesOf, qualityChoices, rootedBoard, shapeKey, symbol, VOICING_EXAMPLES, type SeventhQuestion } from './common';

const ORDERS = ['1–7–3–5', '1–5–7–3', '1–3–5–7', '1–3–7–5'];
export function voicingQuestions(c: Copy): SeventhQuestion[][] {
  const { text } = c;
  const order = VOICING_EXAMPLES.map((e): SeventhQuestion => {
    const correct = e.shape.map(t => [1, 3, 5, 7][t.toneIndex]).join('–');
    return {
      ...baseQuestion(c, e), id: `order-${chordKey(e)}-${shapeKey(e.shape)}`,
      prompt: text(`Qual é a ordem dos graus de ${symbol(c, e)}, do baixo ao agudo? Ignore as alterações ao escolher a ordem.`, `What is the degree order of ${symbol(c, e)}, from bass to treble? Ignore alterations when choosing the order.`),
      answer: { kind: 'choice', visual: { kind: 'board', board: board(e.shape.map(t => ({ ...t.position, label: c.shortSpelled(notesOf(e)[t.toneIndex]), tone: 'plain' }))) }, choices: shuffle(ORDERS).map(value => ({ value, label: value })), correct },
      explanation: `${baseQuestion(c, e).explanation} ${e.shape.map(t => t.degree).join(' → ')}. ${text('R é o baixo: posição fundamental em todas estas formações.', 'R is the bass: all these voicings are in root position.')}`,
    };
  });
  const degree = VOICING_EXAMPLES.map((e, i): SeventhQuestion => {
    const target = e.shape[i % 4];
    return {
      ...baseQuestion(c, e), id: `degree-${chordKey(e)}-${shapeKey(e.shape)}-${target.toneIndex}`,
      prompt: text(`Qual grau está marcado em ${symbol(c, e)}?`, `Which degree is marked in ${symbol(c, e)}?`),
      answer: { kind: 'choice', visual: { kind: 'board', board: board(e.shape.map(t => ({ ...t.position, label: t === target ? '?' : c.shortSpelled(notesOf(e)[t.toneIndex]), tone: t === target ? 'accent' : 'plain' }))) }, choices: degreeChoices(target.degree), correct: target.degree },
      explanation: `${baseQuestion(c, e).explanation} ${c.spelled(notesOf(e)[target.toneIndex])} = ${target.degree}, ${c.where(target.position)}.`,
    };
  });
  const tap = VOICING_EXAMPLES.flatMap(e => [1, 3].map((i): SeventhQuestion => ({
    ...baseQuestion(c, e), id: `tap-${chordKey(e)}-${shapeKey(e.shape)}-${i}`,
    prompt: text(`Toque a ${i === 1 ? 'terça' : 'sétima'} de ${symbol(c, e)} entre as quatro posições marcadas.`, `Tap the ${i === 1 ? 'third' : 'seventh'} of ${symbol(c, e)} among the four marked positions.`),
    answer: { kind: 'board', board: hiddenBoard(e.shape), accepts: e.shape.filter(t => t.toneIndex === i).map(t => t.position) },
  })));
  const quality = VOICING_EXAMPLES.map((e): SeventhQuestion => ({
    ...baseQuestion(c, e), id: `quality-${chordKey(e)}-${shapeKey(e.shape)}`,
    prompt: text(`Qual é a qualidade desta formação com fundamental ${c.spelled(e.root)}?`, `What is the quality of this voicing with root ${c.spelled(e.root)}?`),
    answer: { kind: 'choice', visual: { kind: 'board', board: rootedBoard(e.shape) }, choices: qualityChoices(c, e.quality), correct: e.quality },
  }));
  return [order, degree, tap, quality];
}
