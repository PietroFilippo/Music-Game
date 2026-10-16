import { arpeggioShapes, type ShapeTone } from '../../music/chord-shapes';
import { SEVENTH_QUALITIES, SEVENTHS, spellsCleanly } from '../../music/chords';
import { OPEN_STRING_MIDI, soundingMidi, type FretPosition } from '../../music/guitar';
import { spell, spelledPitchClass } from '../../music/notes';
import type { Copy } from '../fretboard/model';
import { baseQuestion, board, chordKey, degreeChoices, describeChord, exactPositions, notesOf, qualityChoices, ROOTS, rootedBoard, shapeKey, symbol, type SeventhExample, type SeventhQuestion } from './common';

/** Adjacent-string movement avoids teaching jumps over unplayed strings. */
export function beginnerArpeggios(root: FretPosition, quality: typeof SEVENTHS[keyof typeof SEVENTHS]): ShapeTone[][] {
  return arpeggioShapes(root, quality, { maxSpan: 4 }).filter(shape => shape.every((t, i) => i === 0
    || shape[i - 1].position.string - t.position.string <= 1));
}

export const ARPEGGIO_EXAMPLES: SeventhExample[] = ROOTS.flatMap(root => SEVENTH_QUALITIES
  .filter(q => spellsCleanly(root, SEVENTHS[q])).flatMap(quality => [5, 4, 3].flatMap(string => {
    const fret = (spelledPitchClass(root) - OPEN_STRING_MIDI[string] % 12 + 12) % 12;
    return beginnerArpeggios({ string, fret }, SEVENTHS[quality]).slice(0, 1).map(shape => ({ root, quality, shape }));
  })));

export function arpeggioQuestions(c: Copy): SeventhQuestion[][] {
  const { text } = c;
  const base = (e: SeventhExample) => ({ ...baseQuestion(c, e), sound: { notes: e.shape.map(t => soundingMidi(t.position)), spacing: 0.3 } });
  const next = ARPEGGIO_EXAMPLES.flatMap(e => [false, true].flatMap(down => [1, 2, 3, 4].map((i): SeventhQuestion => {
    const sequence = down ? [...e.shape].reverse() : e.shape;
    const target = sequence[i];
    return {
      ...base(e), id: `next-${chordKey(e)}-${shapeKey(e.shape)}-${down ? 'down' : 'up'}-${i}`,
      prompt: text(`Arpejo ${down ? 'descendente' : 'ascendente'} de ${symbol(c, e)}: ${sequence.slice(0, i).map(t => t.degree).join(' → ')} → ? Toque a próxima nota na altura exata.`, `${down ? 'Descending' : 'Ascending'} ${symbol(c, e)} arpeggio: ${sequence.slice(0, i).map(t => t.degree).join(' → ')} → ? Tap the next note at the exact pitch.`),
      answer: { kind: 'board', board: board(sequence.slice(0, i).map(t => ({ ...t.position, label: t.degree, tone: t.toneIndex === 0 ? 'root' : 'plain' }))), accepts: exactPositions(soundingMidi(target.position)) },
      explanation: `${describeChord(c, e)} ${sequence.map(t => `${c.spelled(notesOf(e)[t.toneIndex])} (${t.degree})`).join(' → ')}. ${c.where(target.position)}.`,
      sound: { notes: sequence.map(t => soundingMidi(t.position)), spacing: 0.3 },
    };
  })));
  const degree = ARPEGGIO_EXAMPLES.map((e, i): SeventhQuestion => {
    const target = e.shape[i % 5];
    return {
      ...base(e), id: `degree-${chordKey(e)}-${shapeKey(e.shape)}`,
      prompt: text(`Qual grau está marcado no arpejo de ${symbol(c, e)}?`, `Which degree is marked in the ${symbol(c, e)} arpeggio?`),
      answer: { kind: 'choice', visual: { kind: 'board', board: board(e.shape.map(t => ({ ...t.position, label: t === target ? '?' : c.shortSpelled(notesOf(e)[t.toneIndex]), tone: t === target ? 'accent' : 'plain' }))) }, choices: degreeChoices(target.degree), correct: target.degree },
      explanation: `${describeChord(c, e)} ${c.spelled(notesOf(e)[target.toneIndex])} = ${target.degree} (${c.where(target.position)}).`,
    };
  });
  const quality = ARPEGGIO_EXAMPLES.map((e): SeventhQuestion => ({
    ...base(e), id: `quality-${chordKey(e)}-${shapeKey(e.shape)}`,
    prompt: text(`Qual é a qualidade deste arpejo com fundamental ${c.spelled(e.root)}?`, `What is the quality of this arpeggio with root ${c.spelled(e.root)}?`),
    answer: { kind: 'choice', visual: { kind: 'board', board: rootedBoard(e.shape) }, choices: qualityChoices(c, e.quality), correct: e.quality },
  }));
  const transpose = ARPEGGIO_EXAMPLES.filter(e => e.shape.every(t => t.position.fret >= 1 && t.position.fret <= 10)
    && spellsCleanly(spell(spelledPitchClass(e.root) + 2, '#'), SEVENTHS[e.quality])).map((e): SeventhQuestion => {
    const moved = { root: spell(spelledPitchClass(e.root) + 2, '#'), quality: e.quality, shape: e.shape.map(t => ({ ...t, position: { ...t.position, fret: t.position.fret + 2 } })) };
    return {
      ...base(moved), id: `transpose-${chordKey(e)}-${shapeKey(e.shape)}`,
      prompt: text(`Mova o arpejo de ${symbol(c, e)} duas casas acima. Toque a nova fundamental na ${e.shape[0].position.string + 1}ª corda.`, `Move the ${symbol(c, e)} arpeggio up two frets. Tap the new root on string ${e.shape[0].position.string + 1}.`),
      answer: { kind: 'board', board: base(e).reveal, accepts: [moved.shape[0].position] },
      explanation: `${describeChord(c, e)} ${describeChord(c, moved)} ${text('Duas casas = um tom. Mova todas as notas +2, preservando os graus.', 'Two frets = a whole step. Move every note +2, preserving the degrees.')}`,
    };
  });
  return [next, degree, quality, transpose];
}
