import { fretsForVexKey, naturalAt, positionKey, soundingMidi, type FretPosition } from '../../music/guitar';
import { DURATION_BEATS, type MeasureDuration, type MeasureNote } from '../../music/measure';
import { beatLabel, RHYTHM_VALUES } from '../../music/rhythm';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, type BoardView, type Copy, type ModuleTwoQuestion } from '../fretboard/model';

const STAFF_NOTES = ['e/3', 'a/3', 'c/4', 'e/4', 'g/4', 'b/4', 'c/5', 'e/5', 'g/5'];
const PATTERNS: MeasureDuration[][] = [
  ['w'], ['h', 'h'], ['q', 'q', 'q', 'q'], ['8', '8', '8', '8', '8', '8', '8', '8'],
  ['h', 'q', '8', '8'], ['8', '8', 'q', 'h'],
];

export const READING_MEASURES = [0, 1, 5].flatMap(string => PATTERNS.map((durations, pattern) => ({
  id: `${string}-${pattern}`,
  notes: durations.map((duration, i): MeasureNote => ({
    position: { string, fret: [3, 5, 7, 5, 3, 5, 7, 5][i] - (string === 1 ? 2 : 0) }, duration,
  })),
})));

export function measureSound(notes: MeasureNote[]) {
  const even = notes.every(n => n.duration === notes[0].duration);
  return { notes: notes.map(n => soundingMidi(n.position)), spacing: even ? DURATION_BEATS[notes[0].duration] * 0.6 : 0.6 };
}

export function readingQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text } = c;
  const board = (positions: FretPosition[]): BoardView => ({
    markers: positions.map(p => ({ ...p, label: c.short(naturalAt(p)!), tone: 'accent' })),
    stringLabels: 'name', showFretNumbers: true,
  });
  const writtenName = (key: string) => c.withOctave(naturalAt(fretsForVexKey(key, NECK_FRETS)[0])!, Number(key.split('/')[1]));
  const octaveRule = text('A guitarra soa uma oitava abaixo da nota escrita.', 'The guitar sounds one octave below the written note.');

  const findPosition = STAFF_NOTES.map((vexKey): ModuleTwoQuestion => {
    const accepts = fretsForVexKey(vexKey, NECK_FRETS);
    return {
      id: `staff-position-${vexKey}`,
      prompt: text('Toque em qualquer posição que corresponda à nota escrita (casas 0 a 12).',
        'Tap any position that matches the written note (frets 0–12).'),
      answer: { kind: 'board', visual: { kind: 'staff', vexKey }, board: board([]), accepts },
      explanation: `${writtenName(vexKey)}: ${accepts.map(c.where).join(' / ')}. ${octaveRule}`,
      reveal: board(accepts), notation: accepts[0],
    };
  });

  const matchTab = STAFF_NOTES.map((vexKey): ModuleTwoQuestion => {
    const p = fretsForVexKey(vexKey, NECK_FRETS)[0];
    const candidates = [p.fret, ...Array.from({ length: 13 }, (_, fret) => fret)
      .filter(fret => fret !== p.fret).sort((a, b) => Math.abs(a - p.fret) - Math.abs(b - p.fret)).slice(0, 3)];
    return {
      id: `staff-tab-${vexKey}`,
      prompt: text(`Qual tablatura corresponde à nota escrita na ${p.string + 1}ª corda?`,
        `Which tab matches the written note on string ${p.string + 1}?`),
      answer: {
        kind: 'choice', visual: { kind: 'staff', vexKey },
        choices: shuffle(candidates).map(fret => ({ value: positionKey({ string: p.string, fret }), label: c.where({ string: p.string, fret }) })),
        correct: positionKey(p),
      },
      explanation: text(
        `${writtenName(vexKey)} corresponde à ${c.where(p)}. Na tablatura, escreva ${p.fret} na linha ${p.string + 1}, contando de cima. ${octaveRule}`,
        `${writtenName(vexKey)} matches ${c.where(p)}. In tab, write ${p.fret} on line ${p.string + 1}, counting from the top. ${octaveRule}`,
      ),
      reveal: board([p]), notation: p,
    };
  });

  const readDuration = READING_MEASURES.map(({ id, notes }): ModuleTwoQuestion => {
    const index = notes.length > 2 ? 2 : 0;
    const target = notes[index];
    const beats = DURATION_BEATS[target.duration];
    const rhythm = RHYTHM_VALUES.find(r => r.beats === beats)!;
    const even = notes.every(n => n.duration === notes[0].duration);
    return {
      id: `duration-${id}`,
      prompt: text(`Quanto dura a nota ${index + 1} da tablatura? Em 4/4, a semínima vale um tempo.`,
        `How long does tab note ${index + 1} last? In 4/4, the quarter note gets one beat.`),
      answer: {
        kind: 'choice',
        visual: { kind: 'measure', notes, label: text('Compasso em 4/4: pauta e tablatura com ritmo', '4/4 measure: staff and rhythmic tab') },
        choices: shuffle([4, 2, 1, 0.5]).map(n => ({ value: String(n), label: beatLabel(n, c.language) })),
        correct: String(beats),
      },
      explanation: text(
        `A nota ${index + 1} (${c.where(target.position)}) é uma ${rhythm.pt.toLowerCase()}: ${beatLabel(beats, 'pt')}. As figuras acima e abaixo indicam o mesmo ritmo; o compasso soma 4 tempos.`,
        `Note ${index + 1} (${c.where(target.position)}) is ${/^[aeiou]/i.test(rhythm.en) ? 'an' : 'a'} ${rhythm.en.toLowerCase()}: ${beatLabel(beats, 'en')}. The symbols above and below show the same rhythm; the measure totals 4 beats.`,
      ) + (even ? '' : text(' O áudio toca apenas as alturas, com espaçamento uniforme.', ' Audio plays only the pitches, evenly spaced.')),
      reveal: board([...new Map(notes.map(n => [positionKey(n.position), n.position])).values()]),
      notation: target.position, sound: measureSound(notes),
    };
  });

  return [findPosition, matchTab, readDuration];
}
