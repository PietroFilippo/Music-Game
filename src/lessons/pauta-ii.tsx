import type { ReactNode } from 'react';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { StaffDiagram, type DiagramNote } from '../components/StaffDiagram';
import { Fretboard } from '../components/Fretboard';
import { TREBLE_POSITIONS } from '../music/theory';
import { noteLabel, LETTERS, type LetterNote } from '../music/notes';
import type { FretPosition } from '../music/guitar';
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
      title: 'As notas têm uma ordem',
      text: 'As sete notas musicais formam uma sequência que se repete: Dó, Ré, Mi, Fá, Sol, Lá, Si — e depois Dó de novo, sempre em ciclo.',
    },
    {
      title: 'Cada posição é a próxima nota',
      text: 'Subir uma posição na pauta (de linha para espaço, ou de espaço para linha) é avançar uma nota na sequência. Da 1ª linha à 5ª, cada passo leva à nota vizinha.',
    },
    {
      title: 'Contando para cima',
      text: 'Exemplo: começando no Mi (E) da 1ª linha, conte 3 posições para cima: Fá, Sol, Lá. A resposta é Lá (A).',
    },
    {
      title: 'Contando para baixo',
      text: 'Para baixo é o contrário: a sequência anda em reverso. Do Dó (C) do 3º espaço, conte 2 para baixo: Si, Lá. O ciclo também vale ao contrário — antes do Dó vem o Si.',
    },
    {
      title: 'Na guitarra',
      text: 'Notas vizinhas ficam perto no braço: na corda mi aguda, Mi (solta), Fá (casa 1) e Sol (casa 3). Subir na pauta é subir no braço. No jogo, a posição no braço aparece depois de cada resposta.',
    },
    {
      title: 'Como jogar',
      text: 'No jogo Pauta II, uma nota aparece na pauta com o nome dela. Conte o número pedido de posições para cima ou para baixo e diga em qual nota você chegou. Lembre: cada posição é uma nota da sequência.',
    },
  ],
  en: [
    {
      title: 'Notes come in order',
      text: 'The seven notes form a repeating sequence: C, D, E, F, G, A, B — then C again, cycling forever.',
    },
    {
      title: 'Each position is the next note',
      text: 'Moving up one position on the staff (line to space, or space to line) advances one note in the sequence. From line 1 to line 5, every step is the neighboring note.',
    },
    {
      title: 'Counting up',
      text: 'Example: starting on E (mi) on line 1, count 3 positions up: F, G, A. The answer is A (la).',
    },
    {
      title: 'Counting down',
      text: 'Going down reverses the sequence. From C (do) in the 3rd space, count 2 down: B, A. The cycle works backwards too — before C comes B.',
    },
    {
      title: 'On the guitar',
      text: 'Neighboring notes sit close on the neck: on the high E string, E (open), F (fret 1) and G (fret 3). Up the staff means up the neck. In the game, the fretboard position shows after every answer.',
    },
    {
      title: 'How to play',
      text: 'In Staff II, a note appears on the staff with its name. Count the requested number of positions up or down and name the note you land on. Remember: every position is one note of the sequence.',
    },
  ],
};

const CYCLE: LetterNote[] = [...LETTERS, 'C'];

const E_STRING_FRETS: FretPosition[] = [
  { string: 0, fret: 0 },
  { string: 0, fret: 1 },
  { string: 0, fret: 3 },
];

function Text({ children }: { children: ReactNode }) {
  return <p style={{ maxWidth: 560, margin: '0 auto 22px' }}>{children}</p>;
}

function NoteCycle({ labelFor }: { labelFor: (l: LetterNote) => string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        fontSize: 19,
        fontWeight: 600,
      }}
    >
      {CYCLE.map((l, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: i === 0 || i === CYCLE.length - 1 ? 'var(--accent)' : 'var(--fg)' }}>
            {labelFor(l)}
          </span>
          {i < CYCLE.length - 1 && <span style={{ color: 'var(--fg-muted)' }}>→</span>}
        </span>
      ))}
      <span style={{ color: 'var(--fg-muted)' }}>…</span>
    </div>
  );
}

export function PautaIILesson({ onExit, onPractice }: LessonProps) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const c = COPY[lang];
  const labelFor = (letter: LetterNote) => noteLabel(letter, settings.notation, lang);

  const scaleNotes: DiagramNote[] = TREBLE_POSITIONS.map(p => ({
    vexKey: p.vexKey,
    label: labelFor(p.letter),
  }));

  const countUpNotes: DiagramNote[] = [
    { vexKey: 'e/4', label: labelFor('E'), highlight: true },
    { vexKey: 'f/4', label: labelFor('F') },
    { vexKey: 'g/4', label: labelFor('G') },
    { vexKey: 'a/4', label: labelFor('A'), highlight: true },
  ];

  const countDownNotes: DiagramNote[] = [
    { vexKey: 'c/5', label: labelFor('C'), highlight: true },
    { vexKey: 'b/4', label: labelFor('B') },
    { vexKey: 'a/4', label: labelFor('A'), highlight: true },
  ];

  const guitarNotes: DiagramNote[] = [
    { vexKey: 'e/4', label: labelFor('E'), highlight: true },
    { vexKey: 'f/4', label: labelFor('F') },
    { vexKey: 'g/4', label: labelFor('G') },
  ];

  const steps: LessonStep[] = [
    {
      title: c[0].title,
      body: (
        <>
          <Text>{c[0].text}</Text>
          <NoteCycle labelFor={labelFor} />
        </>
      ),
    },
    {
      title: c[1].title,
      body: (
        <>
          <Text>{c[1].text}</Text>
          <StaffDiagram width={560} height={175} notes={scaleNotes} numberLines />
        </>
      ),
    },
    {
      title: c[2].title,
      body: (
        <>
          <Text>{c[2].text}</Text>
          <StaffDiagram width={400} height={175} notes={countUpNotes} numberLines />
        </>
      ),
    },
    {
      title: c[3].title,
      body: (
        <>
          <Text>{c[3].text}</Text>
          <StaffDiagram width={360} height={175} notes={countDownNotes} numberLines />
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
            <StaffDiagram clef="treble" width={300} height={175} notes={guitarNotes} />
            <Fretboard positions={E_STRING_FRETS} highlightFirst={false} />
          </div>
        </>
      ),
    },
    {
      title: c[5].title,
      body: (
        <>
          <Text>{c[5].text}</Text>
          <NoteCycle labelFor={labelFor} />
        </>
      ),
    },
  ];

  return (
    <LessonShell title={t('games.pauta-ii')} steps={steps} onExit={onExit} onPractice={onPractice} />
  );
}
