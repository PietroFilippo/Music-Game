import { noteLabel, LETTERS, type LetterNote } from '../../music/notes';
import { beatLabel, RHYTHM_VALUES, type RhythmId } from '../../music/rhythm';
import { shuffle, TREBLE_POSITIONS } from '../../music/theory';
import type { Language, Notation } from '../../types';

export const MODULE_ONE_IDS = [
  'nome-notas', 'notacao-alfabetica', 'nome-figuras',
  'notas-descendentes', 'propriedades-som', 'notas-teclado',
] as const;
export type ModuleOneId = typeof MODULE_ONE_IDS[number];
export type Copy = Record<Language, string>;
export type SoundProperty = 'pitch' | 'duration' | 'dynamics' | 'timbre';

export const SOUND_PROPERTIES: Record<SoundProperty, Copy> = {
  pitch: { pt: 'Altura', en: 'Pitch' },
  duration: { pt: 'Duração', en: 'Duration' },
  dynamics: { pt: 'Intensidade', en: 'Loudness' },
  timbre: { pt: 'Timbre', en: 'Timbre' },
};

export const SOUND_EXAMPLES: { property: SoundProperty; pt: string; en: string }[] = [
  { property: 'pitch', pt: 'Uma nota muda de grave para aguda.', en: 'A note changes from low to high.' },
  { property: 'pitch', pt: 'Na mesma corda, você passa da casa 3 para a casa 5: a nota fica mais aguda.', en: 'On one string, you move from fret 3 to fret 5: the note gets higher.' },
  { property: 'pitch', pt: 'Uma melodia desce para notas cada vez mais graves.', en: 'A melody descends to lower and lower notes.' },
  { property: 'duration', pt: 'Você deixa uma nota soar por quatro tempos em vez de um.', en: 'You let a note ring for four beats instead of one.' },
  { property: 'duration', pt: 'Você abafa uma corda logo depois de tocar, encurtando o som.', en: 'You mute a string just after playing it, shortening the sound.' },
  { property: 'duration', pt: 'Dois sons têm a mesma nota e volume, mas um termina antes.', en: 'Two sounds have the same pitch and volume, but one ends sooner.' },
  { property: 'dynamics', pt: 'O volume de uma nota aumenta, sem mudar a nota.', en: 'A note gets louder without changing its pitch.' },
  { property: 'dynamics', pt: 'Você toca a mesma frase primeiro suave e depois forte.', en: 'You play the same phrase softly, then loudly.' },
  { property: 'dynamics', pt: 'Você abaixa o volume do amplificador.', en: 'You turn down the amplifier volume.' },
  { property: 'timbre', pt: 'Piano e guitarra tocam a mesma nota, mas você reconhece os instrumentos.', en: 'A piano and a guitar play the same note, but you can tell the instruments apart.' },
  { property: 'timbre', pt: 'Com a mesma nota e volume, você troca o som limpo da guitarra por distorção.', en: 'At the same pitch and volume, you switch a guitar from clean sound to distortion.' },
  { property: 'timbre', pt: 'Você reconhece uma flauta pelo caráter do som, mesmo sem vê-la.', en: 'You recognize a flute by its tone color, even without seeing it.' },
];

export type QuestionVisual =
  | { kind: 'staff'; vexKey: string }
  | { kind: 'text'; text: string }
  | { kind: 'rhythm'; value: RhythmId }
  | { kind: 'descending'; notes: string[] }
  | { kind: 'sound'; text: string }
  | { kind: 'keyboard'; note: LetterNote };

export interface ModuleQuestion {
  id: string;
  prompt: string;
  visual: QuestionVisual;
  choices: { value: string; label: string }[];
  correct: string;
  explanation: string;
  fretKey?: string;
}

export function descendingNote(start: LetterNote, steps: number): LetterNote {
  return LETTERS[((LETTERS.indexOf(start) - steps) % 7 + 7) % 7];
}

export function createQuestionPool(id: ModuleOneId, language: Language, notation: Notation): ModuleQuestion[] {
  const text = (pt: string, en: string) => language === 'pt' ? pt : en;
  const name = (note: LetterNote) => noteLabel(note, notation, language);
  const choices = (correct: LetterNote, format: Notation = notation) => shuffle([
    correct, ...shuffle(LETTERS.filter(n => n !== correct)).slice(0, 3),
  ]).map(value => ({ value, label: noteLabel(value, format, language) }));

  switch (id) {
    case 'nome-notas': return TREBLE_POSITIONS.map(note => ({
      id: note.vexKey,
      prompt: text('Qual é o nome desta nota na clave de sol?', 'Name this note in treble clef.'),
      visual: { kind: 'staff', vexKey: note.vexKey },
      choices: choices(note.letter), correct: note.letter, fretKey: note.vexKey,
      explanation: text(
        `${name(note.letter)} fica ${note.kind === 'line' ? 'na linha' : 'no espaço'} ${note.index}, contando de baixo para cima.`,
        `${name(note.letter)} is on ${note.kind} ${note.index}, counting from the bottom.`,
      ),
    }));
    case 'notacao-alfabetica': return LETTERS.flatMap(note => ([false, true].map(toLetter => ({
      id: `${note}-${toLetter}`,
      prompt: toLetter ? text('Qual letra representa esta nota?', 'Which letter represents this solfege name?')
        : text('Qual nome em solfejo corresponde a esta letra?', 'Which solfege name matches this letter?'),
      visual: { kind: 'text' as const, text: noteLabel(note, toLetter ? 'solfege' : 'letter', language) },
      choices: choices(note, toLetter ? 'letter' : 'solfege'), correct: note,
      explanation: `${note} = ${noteLabel(note, 'solfege', language)}.`,
    }))));
    case 'nome-figuras': return RHYTHM_VALUES.map(figure => ({
      id: figure.id,
      prompt: text('Qual é o nome desta figura rítmica?', 'What is the name of this rhythm note?'),
      visual: { kind: 'rhythm', value: figure.id },
      choices: shuffle([figure, ...shuffle(RHYTHM_VALUES.filter(v => v.id !== figure.id)).slice(0, 3)])
        .map(v => ({ value: v.id, label: v[language] })),
      correct: figure.id,
      explanation: text(
        `${figure.pt}. Quando a semínima vale 1 tempo, esta figura vale ${beatLabel(figure.beats, 'pt')}.`,
        `${figure.en}. When a quarter note is 1 beat, this note lasts ${beatLabel(figure.beats, 'en')}.`,
      ),
    }));
    case 'notas-descendentes': return LETTERS.flatMap(start => [1, 2, 3, 4].map(steps => {
      const correct = descendingNote(start, steps);
      const route = Array.from({ length: steps + 1 }, (_, i) => name(descendingNote(start, i)));
      return {
        id: `${start}-${steps}`,
        prompt: text(`Partindo de ${name(start)}, desça ${steps} passo(s) na sequência. Qual a nota?`,
          `Starting on ${name(start)}, go down ${steps} step(s) in the note sequence. Which note?`),
        visual: { kind: 'descending' as const, notes: [name(start), ...Array.from({ length: steps }, () => '?')] },
        choices: choices(correct), correct,
        explanation: `${route.join(' → ')}. ${text('Não conte a nota inicial como um passo.', 'Do not count the starting note as a step.')}`,
      };
    }));
    case 'propriedades-som': return SOUND_EXAMPLES.map((example, i) => ({
      id: `${example.property}-${i}`,
      prompt: text('Qual propriedade do som está em destaque?', 'Which property of sound is being described?'),
      visual: { kind: 'sound', text: example[language] },
      choices: shuffle((Object.keys(SOUND_PROPERTIES) as SoundProperty[]).map(value => ({ value, label: SOUND_PROPERTIES[value][language] }))),
      correct: example.property,
      explanation: ({
        pitch: text('Altura é a diferença entre grave e agudo, não entre fraco e forte.', 'Pitch means low or high, not quiet or loud.'),
        duration: text('Duração é quanto tempo o som permanece.', 'Duration is how long a sound lasts.'),
        dynamics: text('Intensidade descreve o volume: fraco ou forte.', 'Loudness describes volume: quiet or loud.'),
        timbre: text('Timbre é a qualidade que distingue sons, mesmo na mesma nota.', 'Timbre is the tone color that distinguishes sounds, even at the same pitch.'),
      })[example.property],
    }));
    case 'notas-teclado': return LETTERS.map(note => ({
      id: note,
      prompt: text('Qual é a nota da tecla verde?', 'Which note is the green key?'),
      visual: { kind: 'keyboard', note },
      choices: choices(note), correct: note,
      explanation: text(`A sequência das teclas brancas é Dó, Ré, Mi, Fá, Sol, Lá, Si. A tecla marcada é ${name(note)}.`,
        `White keys run C, D, E, F, G, A, B. The highlighted key is ${name(note)}.`),
    }));
  }
}

export function createQuestionDeck(id: ModuleOneId, language: Language, notation: Notation): ModuleQuestion[] {
  const pool = createQuestionPool(id, language, notation);
  const deck: ModuleQuestion[] = [];
  while (deck.length < 10) deck.push(...shuffle(pool));
  return deck.slice(0, 10);
}
