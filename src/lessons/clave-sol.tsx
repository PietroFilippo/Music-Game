import type { ReactNode } from 'react';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { StaffDiagram, type DiagramNote } from '../components/StaffDiagram';
import { Fretboard } from '../components/Fretboard';
import { noteLabel, shortNoteLabel, type LetterNote } from '../music/notes';
import { useI18n } from '../hooks/useI18n';
import { useSettings } from '../SettingsContext';
import type { Language } from '../types';
import type { LessonProps } from './index';

interface StepCopy {
  title: string;
  text: string;
}

const COPY: Record<Language, StepCopy[]> = {
  pt: [
    {
      title: 'A clave de sol fixa o Sol',
      text: 'Como você viu na lição de claves, a clave de sol marca a 2ª linha como Sol (G). A partir dessa âncora, dá para nomear qualquer nota da pauta. Neste jogo, você começa com três: Sol, Lá e Si.',
    },
    {
      title: 'Lá: o vizinho de cima',
      text: 'Subindo uma posição a partir do Sol da 2ª linha, chegamos ao 2º espaço: é o Lá (A) — a próxima nota da sequência.',
    },
    {
      title: 'Si: mais um passo',
      text: 'Mais uma posição acima, na 3ª linha, fica o Si (B). Sol na linha, Lá no espaço, Si na linha seguinte: linha, espaço, linha.',
    },
    {
      title: 'As três juntas',
      text: "Sol (G) na 2ª linha — a linha do 'enrolado' da clave. Lá (A) no 2º espaço. Si (B) na 3ª linha, bem no meio da pauta. Na dúvida, conte a partir do Sol.",
    },
    {
      title: 'Na guitarra',
      text: 'As três ficam na primeira posição: Sol é a 3ª corda solta, Lá é a 3ª corda na casa 2 e Si é a 2ª corda solta. São algumas das primeiras notas que guitarristas aprendem a ler. No jogo, depois de responder, você vê a posição em tablatura e no braço.',
    },
    {
      title: 'Como jogar',
      text: 'No jogo Clave de Sol, uma das três notas aparece na pauta: diga se é Sol (G), Lá (A) ou Si (B). Use a âncora: a linha do enrolado é sempre o Sol.',
    },
  ],
  en: [
    {
      title: 'The treble clef anchors G',
      text: 'As you saw in the Clefs lesson, the treble clef marks line 2 as G (sol). From that anchor you can name any note on the staff. In this game you start with three: G, A and B.',
    },
    {
      title: 'A: the neighbor above',
      text: "One position up from G on line 2 is the 2nd space: that's A (la) — the next note in the sequence.",
    },
    {
      title: 'B: one more step',
      text: 'One more position up, on line 3, sits B (ti). G on a line, A in a space, B on the next line: line, space, line.',
    },
    {
      title: 'The three together',
      text: 'G (sol) on line 2 — the line the clef curls around. A (la) in the 2nd space. B (ti) on line 3, right in the middle of the staff. When in doubt, count from G.',
    },
    {
      title: 'On the guitar',
      text: 'All three sit in first position: G is the open 3rd string, A is the 3rd string at fret 2, and B is the open 2nd string. They are among the first notes guitarists learn to read. In the game, after answering you see the position in tab and on the fretboard.',
    },
    {
      title: 'How to play',
      text: "In Treble Clef, one of the three notes appears on the staff: say whether it's G (sol), A (la) or B (ti). Use the anchor: the curl line is always G.",
    },
  ],
};

function Text({ children }: { children: ReactNode }) {
  return <p style={{ maxWidth: 560, margin: '0 auto 22px' }}>{children}</p>;
}

export function ClaveSolLesson({ onExit, onPractice }: LessonProps) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const c = COPY[lang];
  const labelFor = (letter: LetterNote) => noteLabel(letter, settings.notation, lang);

  // Written G4, A4 and B4 in first position.
  const gabFrets = [
    { string: 2, fret: 0, label: shortNoteLabel('G', settings.notation, lang) },
    { string: 2, fret: 2, label: shortNoteLabel('A', settings.notation, lang) },
    { string: 1, fret: 0, label: shortNoteLabel('B', settings.notation, lang) },
  ];

  const gabNotes = (highlight: LetterNote[]): DiagramNote[] => [
    { vexKey: 'g/4', label: labelFor('G'), highlight: highlight.includes('G') },
    { vexKey: 'a/4', label: labelFor('A'), highlight: highlight.includes('A') },
    { vexKey: 'b/4', label: labelFor('B'), highlight: highlight.includes('B') },
  ];

  const steps: LessonStep[] = [
    {
      title: c[0].title,
      body: (
        <>
          <Text>{c[0].text}</Text>
          <StaffDiagram
            clef="treble"
            width={320}
            height={175}
            notes={[{ vexKey: 'g/4', label: labelFor('G'), highlight: true }]}
            numberLines
          />
        </>
      ),
    },
    {
      title: c[1].title,
      body: (
        <>
          <Text>{c[1].text}</Text>
          <StaffDiagram
            clef="treble"
            width={320}
            height={175}
            notes={gabNotes(['A']).slice(0, 2)}
            numberLines
          />
        </>
      ),
    },
    {
      title: c[2].title,
      body: (
        <>
          <Text>{c[2].text}</Text>
          <StaffDiagram
            clef="treble"
            width={340}
            height={175}
            notes={gabNotes(['B'])}
            numberLines
          />
        </>
      ),
    },
    {
      title: c[3].title,
      body: (
        <>
          <Text>{c[3].text}</Text>
          <StaffDiagram
            clef="treble"
            width={340}
            height={175}
            notes={gabNotes(['G', 'A', 'B'])}
            numberLines
            numberSpaces
          />
        </>
      ),
    },
    {
      title: c[4].title,
      body: (
        <>
          <Text>{c[4].text}</Text>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <StaffDiagram clef="treble" width={340} height={175} notes={gabNotes(['G', 'A', 'B'])} />
            <Fretboard markers={gabFrets} frets={5} />
          </div>
        </>
      ),
    },
    {
      title: c[5].title,
      body: (
        <>
          <Text>{c[5].text}</Text>
          <StaffDiagram
            clef="treble"
            width={320}
            height={175}
            notes={[{ vexKey: 'a/4', label: '?', highlight: true }]}
            numberLines
          />
        </>
      ),
    },
  ];

  return (
    <LessonShell
      title={t('games.clave-sol')}
      steps={steps}
      onExit={onExit}
      onPractice={onPractice}
    />
  );
}
