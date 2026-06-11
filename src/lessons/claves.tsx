import type { ReactNode } from 'react';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { StaffDiagram } from '../components/StaffDiagram';
import { Fretboard } from '../components/Fretboard';
import { fretsForVexKey } from '../music/guitar';
import { noteLabel, type LetterNote } from '../music/notes';
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
      title: 'Por que existem claves?',
      text: 'Sem referência, a pauta não diz o nome de nenhuma nota — uma nota na 2ª linha poderia ser qualquer uma. A clave resolve isso: ela fixa o nome de uma linha, e todas as outras posições seguem a sequência a partir dela.',
    },
    {
      title: 'Clave de Sol',
      text: 'A clave de sol "enrola" na 2ª linha: ela diz que essa linha é o Sol (G). É a clave das melodias mais agudas — e da guitarra.',
    },
    {
      title: 'Clave de Fá',
      text: 'A clave de fá tem dois pontos ao redor da 4ª linha: essa linha é o Fá (F). É usada para sons graves, como o baixo e o violoncelo.',
    },
    {
      title: 'Clave de Dó',
      text: 'A clave de dó aponta o Dó (C) com o centro do desenho. Na forma mais comum (clave de contralto), o centro fica na 3ª linha. É a clave da viola.',
    },
    {
      title: 'E a guitarra?',
      text: 'Partituras de guitarra usam sempre a clave de sol. Com ela, o Sol da 2ª linha fica nessas posições do braço. As outras claves você vai reconhecer em partituras de outros instrumentos.',
    },
    {
      title: 'Como jogar',
      text: 'No jogo Claves, uma clave aparece sozinha na pauta. Diga qual nota ela fixa: Sol (G), Fá (F) ou Dó (C). Olhe para onde o desenho aponta: o enrolado, os dois pontos ou o centro.',
    },
  ],
  en: [
    {
      title: 'Why clefs exist',
      text: 'Without a reference, the staff names no notes — a note on line 2 could be anything. A clef fixes the name of one line, and every other position follows the sequence from there.',
    },
    {
      title: 'The treble clef (G clef)',
      text: "The treble clef curls around line 2: that line is G (sol). It's the clef for higher melodies — and for the guitar.",
    },
    {
      title: 'The bass clef (F clef)',
      text: "The bass clef has two dots around line 4: that line is F (fa). It's used for low sounds, like the bass and the cello.",
    },
    {
      title: 'The alto clef (C clef)',
      text: "The C clef points to C (do) with the center of its shape. In its most common form (the alto clef), the center sits on line 3. It's the viola's clef.",
    },
    {
      title: 'What about the guitar?',
      text: "Guitar sheet music always uses the treble clef. With it, the G on line 2 lives at these fretboard spots. You'll meet the other clefs in music for other instruments.",
    },
    {
      title: 'How to play',
      text: 'In Clefs, a clef appears alone on the staff. Name the note it anchors: G (sol), F (fa) or C (do). Look where the shape points: the curl, the two dots, or the center.',
    },
  ],
};

const G4_FRETS = fretsForVexKey('g/4');

function Text({ children }: { children: ReactNode }) {
  return <p style={{ maxWidth: 560, margin: '0 auto 22px' }}>{children}</p>;
}

export function ClavesLesson({ onExit, onPractice }: LessonProps) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const c = COPY[lang];
  const labelFor = (letter: LetterNote) => noteLabel(letter, settings.notation, lang);

  const steps: LessonStep[] = [
    {
      title: c[0].title,
      body: (
        <>
          <Text>{c[0].text}</Text>
          <StaffDiagram
            width={320}
            height={175}
            notes={[{ vexKey: 'g/4', label: '?', highlight: true }]}
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
            notes={[{ vexKey: 'g/4', label: labelFor('G'), highlight: true }]}
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
            clef="bass"
            width={320}
            height={175}
            notes={[{ vexKey: 'f/3', label: labelFor('F'), highlight: true }]}
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
            clef="alto"
            width={320}
            height={175}
            notes={[{ vexKey: 'c/4', label: labelFor('C'), highlight: true }]}
            numberLines
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
            <StaffDiagram
              clef="treble"
              width={300}
              height={175}
              notes={[{ vexKey: 'g/4', label: labelFor('G'), highlight: true }]}
            />
            <Fretboard positions={G4_FRETS} />
          </div>
        </>
      ),
    },
    {
      title: c[5].title,
      body: (
        <>
          <Text>{c[5].text}</Text>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <StaffDiagram clef="treble" width={170} />
            <StaffDiagram clef="bass" width={170} />
            <StaffDiagram clef="alto" width={170} />
          </div>
        </>
      ),
    },
  ];

  return (
    <LessonShell title={t('games.claves')} steps={steps} onExit={onExit} onPractice={onPractice} />
  );
}
