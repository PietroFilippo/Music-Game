import { TRIADS } from '../../music/chords';
import { OPEN_STRING_MIDI, soundingMidi } from '../../music/guitar';
import { spelledPitchClass } from '../../music/notes';
import { noteKey, STRINGS, type Copy } from '../fretboard/model';
import { baseQuestion, board, chordKey, noteChoices, notesOf, qualityChoices, symbol, symbolChoices, TRIAD_EXAMPLES, type TriadQuestion } from './common';

export function formulaQuestions(c: Copy): TriadQuestion[][] {
  const { text } = c;
  const spellTone = TRIAD_EXAMPLES.flatMap(e => [1, 2].map(i => {
    const note = notesOf(e)[i];
    const degree = TRIADS[e.quality].tones[i].degree;
    return {
      ...baseQuestion(c, e),
      id: `spell-${chordKey(e)}-${i}`,
      prompt: text(`Qual nota é a ${i === 1 ? 'terça' : 'quinta'} (${degree}) de ${symbol(c, e)}?`,
        `Which note is the ${i === 1 ? 'third' : 'fifth'} (${degree}) of ${symbol(c, e)}?`),
      answer: {
        kind: 'choice' as const,
        visual: { kind: 'text' as const, text: TRIADS[e.quality].tones.map(t => t.degree === '1' ? 'R' : t.degree).join(' – ') },
        choices: noteChoices(c, note), correct: noteKey(note),
      },
    };
  }));
  const quality = TRIAD_EXAMPLES.map((e): TriadQuestion => ({
    ...baseQuestion(c, e),
    id: `quality-${chordKey(e)}`,
    prompt: text(`Qual é a qualidade da tríade com fundamental ${c.spelled(e.root)}?`, `What is the quality of this triad with root ${c.spelled(e.root)}?`),
    answer: { kind: 'choice', visual: { kind: 'text', text: notesOf(e).map(c.spelled).join(' – ') }, choices: qualityChoices(c), correct: e.quality },
    explanation: `${baseQuestion(c, e).explanation} ${text('Distâncias da fundamental', 'Distances from the root')}: ${TRIADS[e.quality].tones.map(t => t.semitones).join(', ')} ${text('semitons', 'semitones')}.`,
  }));
  const symbols = TRIAD_EXAMPLES.map((e): TriadQuestion => ({
    ...baseQuestion(c, e),
    id: `symbol-${chordKey(e)}`,
    prompt: text(`Qual cifra representa a tríade ${c.spelled(e.root)} ${TRIADS[e.quality].name.pt}?`, `Which symbol represents the ${c.spelled(e.root)} ${TRIADS[e.quality].name.en} triad?`),
    answer: { kind: 'choice', visual: { kind: 'text', text: notesOf(e).map(c.spelled).join(' – ') }, choices: symbolChoices(c, e.root), correct: e.quality },
    explanation: `${baseQuestion(c, e).explanation} ${e.quality === 'diminished'
      ? text('Nesta tríade: m(♭5), dim e o símbolo inglês ° indicam R–♭3–♭5. Em cifras brasileiras, ° costuma indicar um acorde diminuto de quatro notas; confira o contexto.',
        'For this triad: °, dim and Brazilian m(♭5) mean R–♭3–♭5. In Brazilian charts, ° usually means a four-note diminished chord; check the context.')
      : e.quality === 'augmented'
        ? text('(♯5), +, aum e aug são cifras alternativas para R–3–♯5.', '(♯5), +, aum and aug are alternative symbols for R–3–♯5.')
        : e.quality === 'minor'
          ? text('m, min e − indicam a terça menor (♭3); a quinta continua justa (5).', 'm, min and − indicate the minor third (♭3); the fifth stays perfect (5).')
          : text('Sem sufixo, a cifra indica uma tríade maior; maj também aparece em cifras em inglês.', 'No suffix means a major triad; maj also occurs in English chord charts.')}`,
  }));
  const missing = TRIAD_EXAMPLES.flatMap(e => [1, 2].map((i): TriadQuestion => {
    const root = { string: 5, fret: (spelledPitchClass(e.root) - OPEN_STRING_MIDI[5] % 12 + 12) % 12 };
    const midi = soundingMidi(root) + TRIADS[e.quality].tones[i].semitones;
    const accepts = STRINGS.map(string => ({ string, fret: midi - OPEN_STRING_MIDI[string] })).filter(p => p.fret >= 0 && p.fret <= 12);
    const degree = TRIADS[e.quality].tones[i].degree;
    return {
      ...baseQuestion(c, e),
      id: `missing-${chordKey(e)}-${i}`,
      prompt: text(`Toque a ${i === 1 ? 'terça' : 'quinta'} (${degree}) de ${symbol(c, e)}, acima de ${c.spelled(e.root)} (R).`,
        `Tap the ${i === 1 ? 'third' : 'fifth'} (${degree}) of ${symbol(c, e)}, above ${c.spelled(e.root)} (R).`),
      answer: { kind: 'board', board: board([{ ...root, label: 'R', tone: 'root' }]), accepts },
      reveal: board([{ ...root, label: 'R', tone: 'root' }, ...accepts.map(p => ({ ...p, label: degree, tone: 'accent' as const }))]),
      sound: { notes: [soundingMidi(root), midi], spacing: 0.03 },
    };
  }));
  return [spellTone, quality, symbols, missing];
}
