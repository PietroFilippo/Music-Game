import type { ReactNode } from 'react';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { StaffDiagram, type DiagramNote } from '../components/StaffDiagram';
import { Fretboard } from '../components/Fretboard';
import { fretsForVexKey } from '../music/guitar';
import { TREBLE_POSITIONS } from '../music/theory';
import { noteLabel, type LetterNote } from '../music/notes';
import { useI18n } from '../hooks/useI18n';
import { useSettings } from '../SettingsContext';
import type { Language } from '../types';
import type { LessonProps } from './index';

interface StepCopy {
  title: string;
  text: string;
  caption?: string;
}

const COPY: Record<Language, StepCopy[]> = {
  pt: [
    {
      title: 'A pauta',
      text: 'A pauta (ou pentagrama) é o conjunto de cinco linhas horizontais onde escrevemos as notas musicais. Entre as linhas há quatro espaços — as notas também são escritas neles.',
    },
    {
      title: 'Contamos de baixo para cima',
      text: 'As linhas são numeradas de baixo para cima: a 1ª linha é a mais baixa e a 5ª, a mais alta. Os espaços seguem a mesma regra, do 1º ao 4º.',
    },
    {
      title: 'Linha, espaço, linha, espaço…',
      text: 'Cada nota ocupa uma linha ou um espaço. Subindo a pauta, as posições sempre se alternam: linha, espaço, linha, espaço… Cada passo leva à nota vizinha.',
      caption: 'Notas nas linhas destacadas em verde.',
    },
    {
      title: 'O ponto de referência',
      text: 'A posição sozinha não diz o nome da nota — é preciso uma referência. Se a 1ª linha for Mi (E), o 1º espaço só pode ser Fá (F), a 2ª linha Sol (G), e assim por diante. Definir essa referência é o trabalho das claves, que você verá no jogo Claves.',
    },
    {
      title: 'Na guitarra',
      text: 'Com a clave de sol, a nota da 1ª linha é Mi (E) — a corda mi aguda solta da guitarra. A mesma nota também aparece em outras casas do braço. No jogo, após cada resposta, você vê a posição no braço.',
    },
    {
      title: 'Como jogar',
      text: 'No jogo Pauta I, uma nota aparece marcada na pauta e você diz qual linha ou espaço ela ocupa — contando sempre de baixo para cima. Esta, por exemplo, está na 3ª linha.',
    },
  ],
  en: [
    {
      title: 'The staff',
      text: 'The staff is a set of five horizontal lines where musical notes are written. Between the lines there are four spaces — notes are written in them too.',
    },
    {
      title: 'Count from the bottom up',
      text: 'Lines are numbered from the bottom up: line 1 is the lowest, line 5 the highest. Spaces follow the same rule, 1st to 4th.',
    },
    {
      title: 'Line, space, line, space…',
      text: 'Every note sits on a line or in a space. Moving up the staff, positions always alternate: line, space, line, space… Each step is the neighboring note.',
      caption: 'Notes on lines highlighted in green.',
    },
    {
      title: 'The reference point',
      text: "Position alone doesn't name a note — you need a reference. If line 1 is E (mi), the 1st space must be F (fa), line 2 G (sol), and so on. Setting that reference is what clefs do — you'll meet them in the Clefs game.",
    },
    {
      title: 'On the guitar',
      text: 'With the treble clef, the note on line 1 is E (mi) — the open high E string of the guitar. The same note also lives in other spots on the neck. In the game, you see the fretboard position after every answer.',
    },
    {
      title: 'How to play',
      text: 'In Staff I, a note is marked on the staff and you name the line or space it occupies — always counting from the bottom. This one, for example, is on line 3.',
    },
  ],
};

const SCALE_NOTES: DiagramNote[] = TREBLE_POSITIONS.map(p => ({
  vexKey: p.vexKey,
  highlight: p.kind === 'line',
}));

const E4_FRETS = fretsForVexKey('e/4');

function Text({ children }: { children: ReactNode }) {
  return <p style={{ maxWidth: 560, margin: '0 auto 22px' }}>{children}</p>;
}

function Caption({ children }: { children: ReactNode }) {
  return <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 10 }}>{children}</p>;
}

export function PautaILesson({ onExit, onPractice }: LessonProps) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const c = COPY[lang];
  const label = (letter: LetterNote) => noteLabel(letter, settings.notation, lang);

  const refNotes: DiagramNote[] = [
    { vexKey: 'e/4', label: label('E'), highlight: true },
    { vexKey: 'f/4', label: label('F') },
    { vexKey: 'g/4', label: label('G') },
    { vexKey: 'a/4', label: label('A') },
  ];

  const steps: LessonStep[] = [
    {
      title: c[0].title,
      body: (
        <>
          <Text>{c[0].text}</Text>
          <StaffDiagram width={360} />
        </>
      ),
    },
    {
      title: c[1].title,
      body: (
        <>
          <Text>{c[1].text}</Text>
          <StaffDiagram width={360} numberLines numberSpaces />
        </>
      ),
    },
    {
      title: c[2].title,
      body: (
        <>
          <Text>{c[2].text}</Text>
          <StaffDiagram width={520} notes={SCALE_NOTES} />
          <Caption>{c[2].caption}</Caption>
        </>
      ),
    },
    {
      title: c[3].title,
      body: (
        <>
          <Text>{c[3].text}</Text>
          <StaffDiagram width={400} height={175} notes={refNotes} numberLines />
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
            <StaffDiagram
              clef="treble"
              width={300}
              height={175}
              notes={[{ vexKey: 'e/4', label: label('E'), highlight: true }]}
            />
            <Fretboard positions={E4_FRETS} />
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
            width={360}
            notes={[{ vexKey: 'b/4', highlight: true }]}
            numberLines
            numberSpaces
          />
        </>
      ),
    },
  ];

  return (
    <LessonShell title={t('games.pauta-i')} steps={steps} onExit={onExit} onPractice={onPractice} />
  );
}
