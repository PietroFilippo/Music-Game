import { chordSymbol, SEVENTHS, spellsCleanly } from '../../music/chords';
import { OPEN_STRING_MIDI, soundingMidi } from '../../music/guitar';
import { spelledPitchClass } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { noteKey, type Copy } from '../fretboard/model';
import { baseQuestion, board, chordKey, describeChord, exactPositions, noteChoices, notesOf, qualityChoices, SEVENTH_EXAMPLES, symbol, type SeventhQuestion } from './common';

export function formulaQuestions(c: Copy): SeventhQuestion[][] {
  const { text } = c;
  const spell = SEVENTH_EXAMPLES.flatMap(e => [1, 2, 3].map((i): SeventhQuestion => ({
    ...baseQuestion(c, e), id: `spell-${chordKey(e)}-${i}`,
    prompt: text(`Qual nota é o grau ${SEVENTHS[e.quality].tones[i].degree} de ${symbol(c, e)}?`, `Which note is degree ${SEVENTHS[e.quality].tones[i].degree} of ${symbol(c, e)}?`),
    answer: { kind: 'choice', visual: { kind: 'text', text: SEVENTHS[e.quality].tones.map(t => t.degree).join(' – ') }, choices: noteChoices(c, notesOf(e)[i]), correct: noteKey(notesOf(e)[i]) },
  })));
  const quality = SEVENTH_EXAMPLES.map((e): SeventhQuestion => ({
    ...baseQuestion(c, e), id: `quality-${chordKey(e)}`,
    prompt: text(`Qual é a qualidade desta tétrade com fundamental ${c.spelled(e.root)}?`, `What is the quality of this seventh chord with root ${c.spelled(e.root)}?`),
    answer: { kind: 'choice', visual: { kind: 'text', text: notesOf(e).map(c.spelled).join(' – ') }, choices: qualityChoices(c, e.quality), correct: e.quality },
  }));
  const symbols = SEVENTH_EXAMPLES.map((e): SeventhQuestion => ({
    ...baseQuestion(c, e), id: `symbol-${chordKey(e)}`,
    prompt: text(`Qual cifra representa ${c.spelled(e.root)} com os graus abaixo?`, `Which symbol represents ${c.spelled(e.root)} with the degrees below?`),
    answer: { kind: 'choice', visual: { kind: 'text', text: SEVENTHS[e.quality].tones.map(t => t.degree).join(' – ') }, choices: qualityChoices(c, e.quality, true, e.root), correct: e.quality },
    explanation: `${describeChord(c, e)} PT ${chordSymbol(e.root, SEVENTHS[e.quality], 'pt')} = EN ${chordSymbol(e.root, SEVENTHS[e.quality], 'en')}. ${text('Sufixos alternativos', 'Alternative suffixes')}: ${[...new Set([...SEVENTHS[e.quality].alternatives.pt, ...SEVENTHS[e.quality].alternatives.en])].join(', ') || '7'}.`,
  }));
  const changed = SEVENTH_EXAMPLES.flatMap(e => {
    const next = ({ maj7: 'dom7', dom7: 'm7', m7: 'm7b5', m7b5: 'dim7' } as const)[e.quality as 'maj7' | 'dom7' | 'm7' | 'm7b5'];
    if (!next || !spellsCleanly(e.root, SEVENTHS[next])) return [];
    const to = { root: e.root, quality: next };
    const i = SEVENTHS[e.quality].tones.findIndex((t, i) => t.semitones !== SEVENTHS[next].tones[i].semitones);
    return [{
      ...baseQuestion(c, e), id: `changed-${chordKey(e)}-${next}`,
      prompt: text(`De ${symbol(c, e)} para ${symbol(c, to)}, qual grau muda?`, `From ${symbol(c, e)} to ${symbol(c, to)}, which degree changes?`),
      answer: { kind: 'choice' as const, visual: { kind: 'text' as const, text: `${symbol(c, e)} → ${symbol(c, to)}` }, choices: shuffle([0, 1, 2, 3]).map(value => ({ value: String(value), label: text(['Fundamental', 'Terça', 'Quinta', 'Sétima'][value], ['Root', 'Third', 'Fifth', 'Seventh'][value]) })), correct: String(i) },
      explanation: `${describeChord(c, e)} ${describeChord(c, to)} ${c.spelled(notesOf(e)[i])} (${SEVENTHS[e.quality].tones[i].degree}) → ${c.spelled(notesOf(to)[i])} (${SEVENTHS[next].tones[i].degree}).`,
    }];
  });
  const seventh = SEVENTH_EXAMPLES.map((e): SeventhQuestion => {
    const root = { string: 5, fret: (spelledPitchClass(e.root) - OPEN_STRING_MIDI[5] % 12 + 12) % 12 };
    const accepts = exactPositions(soundingMidi(root) + SEVENTHS[e.quality].tones[3].semitones);
    const degree = SEVENTHS[e.quality].tones[3].degree;
    return {
      ...baseQuestion(c, e), id: `seventh-${chordKey(e)}`,
      prompt: text(`Toque a sétima (${degree}) de ${symbol(c, e)} acima da fundamental marcada ${c.spelled(e.root)} (R), na altura exata.`, `Tap the seventh (${degree}) of ${symbol(c, e)} above the marked root ${c.spelled(e.root)} (R), at the exact pitch.`),
      answer: { kind: 'board', board: board([{ ...root, label: 'R', tone: 'root' }]), accepts },
      reveal: board([{ ...root, label: 'R', tone: 'root' }, ...accepts.map(p => ({ ...p, label: degree, tone: 'accent' as const }))]),
      sound: { notes: [soundingMidi(root), soundingMidi(accepts[0])], spacing: 0.03 },
      explanation: `${describeChord(c, e)} ${text('A sétima está', 'The seventh is')} ${SEVENTHS[e.quality].tones[3].semitones} ${text('semitons acima de R.', 'semitones above R.')} ${e.quality === 'dim7' ? text('♭♭7 é uma sétima diminuta: soa como 6, mas mantém a letra da sétima.', '♭♭7 is a diminished seventh: it sounds like 6 but keeps the seventh letter.') : ''}`,
    };
  });
  return [spell, quality, symbols, changed, seventh];
}
