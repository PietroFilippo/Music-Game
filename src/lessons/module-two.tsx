import type { ReactNode } from 'react';
import { Fretboard, type FretMarker, type MarkerTone } from '../components/Fretboard';
import { FretboardExplorer } from '../components/FretboardExplorer';
import { GuitarTab } from '../components/GuitarTab';
import { HearButton } from '../components/HearButton';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { StaffDiagram } from '../components/StaffDiagram';
import type { ModuleTwoId } from '../games/module-two/questions';
import { useI18n } from '../hooks/useI18n';
import { naturalAt, naturalFrets, OPEN_STRING_LETTERS, pitchClassAt, writtenVexKey } from '../music/guitar';
import { INTERVALS } from '../music/intervals';
import { shortNoteLabel, spell, spelledLabel, type SpelledNote } from '../music/notes';
import { useSettings } from '../SettingsContext';
import type { LessonProps } from './index';

const LOW_TO_HIGH = [5, 4, 3, 2, 1, 0];

export function ModuleTwoLesson({ id, onExit, onPractice }: LessonProps & { id: ModuleTwoId }) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const text = (pt: string, en: string) => (lang === 'pt' ? pt : en);
  const step = (ptTitle: string, enTitle: string, pt: string, en: string, visual: ReactNode): LessonStep => ({
    title: text(ptTitle, enTitle),
    body: <><p className="lesson-copy">{text(pt, en)}</p><div className="lesson-visual">{visual}</div></>,
  });
  // A labeled natural-note marker.
  const at = (string: number, fret: number, tone: MarkerTone = 'plain'): FretMarker => ({
    string, fret, tone, label: shortNoteLabel(naturalAt({ string, fret })!, settings.notation, lang),
  });
  const naturals = (string: number, accent: (fret: number) => boolean = () => false) =>
    naturalFrets(string).map(fret => at(string, fret, accent(fret) ? 'accent' : 'plain'));
  const openName = (string: number) => shortNoteLabel(OPEN_STRING_LETTERS[string], settings.notation, lang);
  const shortSpelled = (note: SpelledNote) =>
    spelledLabel(note, settings.notation === 'solfege' ? 'solfege' : 'letter', lang);
  // A marker named with sharps or flats; notes between naturals use the root color.
  const spelledAt = (string: number, fret: number, prefer: '#' | 'b' = '#', tone?: MarkerTone): FretMarker => {
    const note = spell(pitchClassAt({ string, fret }), prefer);
    return { string, fret, label: shortSpelled(note), tone: tone ?? (note.accidental ? 'root' : 'plain') };
  };
  const chromatic = (string: number, prefer: '#' | 'b') => {
    const frets = Array.from({ length: 13 }, (_, fret) => fret);
    return (prefer === 'b' ? frets.reverse() : frets).map(fret => shortSpelled(spell(pitchClassAt({ string, fret }), prefer)));
  };
  const sequence = (items: string[]) => <div className="note-sequence">
    {items.map((item, i) => <span key={i}>{i > 0 && '→ '}{item}</span>)}
  </div>;

  // A marker labeled with a degree such as R, ♭3 or 5.
  const degree = (string: number, fret: number, label: string, tone: MarkerTone = 'accent'): FretMarker =>
    ({ string, fret, label, tone });
  const listen = (...buttons: { notes: number[]; label?: string; spacing?: number }[]) =>
    <div className="lesson-visual">{buttons.map((b, i) => <HearButton key={i} {...b} />)}</div>;

  const lessons: Record<ModuleTwoId, LessonStep[]> = {
    'cordas-afinacao': [
      step('Seis cordas, numeradas de 1 a 6', 'Six strings, numbered 1 to 6',
        'As cordas são numeradas da mais fina para a mais grossa. A 1ª corda é a mais fina e aguda; a 6ª é a mais grossa e grave. Segurando a guitarra para tocar, a 1ª corda é a que fica mais perto do chão.',
        'Strings are numbered from the thinnest to the thickest. String 1 is the thinnest and highest-sounding; string 6 is the thickest and lowest. When you hold the guitar to play, string 1 is the one closest to the floor.',
        <Fretboard frets={5} stringLabels="number" highlightStrings={[0, 5]} />),
      step('A 1ª corda fica em cima no diagrama', 'Diagrams put string 1 on top',
        'Nos diagramas deste app e na tablatura, a linha de cima é a 1ª corda e a de baixo é a 6ª. É o contrário do que você vê olhando para a guitarra, com a 6ª corda em cima. Na tablatura, cada número é uma casa: 0 é a corda solta.',
        'In this app’s diagrams and in tablature, the top line is string 1 and the bottom line is string 6. That is the opposite of what you see looking down at your guitar, where string 6 is on top. In tab, each number is a fret: 0 means the open string.',
        <>
          <Fretboard frets={5} stringLabels="both" markers={[{ string: 5, fret: 0, label: '0', tone: 'accent' }]} />
          <GuitarTab positions={[{ string: 5, fret: 0 }]} width={200} />
        </>),
      step('Afinação padrão', 'Standard tuning',
        'Da 6ª para a 1ª corda, as cordas soltas são Mi, Lá, Ré, Sol, Si e Mi (E, A, D, G, B, E). A 6ª e a 1ª são as duas cordas Mi: mesmo nome, duas oitavas de distância. Um afinador mostra essas letras.',
        'From string 6 to string 1, the open strings are E, A, D, G, B and E. Strings 6 and 1 are both E: same name, two octaves apart. A tuner displays these letters.',
        <>
          <Fretboard frets={5} stringLabels="number" markers={LOW_TO_HIGH.map(s => at(s, 0, 'accent'))} />
          {sequence(LOW_TO_HIGH.map(s => `${s + 1} ${openName(s)}`))}
        </>),
      step('Conferindo a afinação', 'Checking your tuning',
        'Na maioria das cordas, a casa 5 tem a mesma nota da corda solta vizinha mais aguda: a casa 5 da 6ª corda é igual à 5ª corda solta (Lá), e assim por diante. A exceção é a 3ª corda: use a casa 4 para conferir a 2ª corda (Si). Essa exceção entre a 3ª e a 2ª corda volta sempre que você move desenhos pelo braço.',
        'On most strings, fret 5 matches the next higher open string: fret 5 on string 6 equals open string 5 (A), and so on. The exception is string 3: use fret 4 to check string 2 (B). This exception between strings 3 and 2 comes back whenever you move shapes across the neck.',
        <Fretboard frets={5} stringLabels="number" markers={[
          at(5, 5, 'accent'), at(4, 0, 'accent'), at(4, 5, 'accent'), at(3, 0, 'accent'), at(3, 5, 'accent'),
          at(2, 0, 'accent'), at(2, 4, 'root'), at(1, 0, 'root'), at(1, 5, 'accent'), at(0, 0, 'accent'),
        ]} />),
      step('As cordas soltas na pauta', 'Open strings on the staff',
        'A música para guitarra é escrita uma oitava acima do som real, para caber melhor na clave de sol. Mesmo assim, as cordas graves usam linhas suplementares: a 6ª corda solta é o Mi abaixo de três linhas suplementares, e a 1ª corda solta é o Mi do 4º espaço.',
        'Guitar music is written an octave above how it sounds so it fits the treble clef. Even so, the low strings need ledger lines: the open 6th string is the E below three ledger lines, and the open 1st string is the E in the 4th space.',
        <StaffDiagram clef="treble" width={480} height={185} notes={LOW_TO_HIGH.map(s => ({
          vexKey: writtenVexKey({ string: s, fret: 0 }),
          label: openName(s),
          highlight: s === 0 || s === 5,
        }))} />),
      step('No seu instrumento', 'On your guitar',
        'Toque cada corda solta da 6ª para a 1ª, dizendo o número e a nota em voz alta: “6 – Mi, 5 – Lá…”. Depois volte da 1ª para a 6ª. Por fim, confira a afinação com a casa 5 (casa 4 na 3ª corda). No jogo, você vai identificar, nomear e selecionar as cordas no diagrama.',
        'Play each open string from 6 to 1, saying its number and note aloud: “6 – E, 5 – A…”. Then go back from 1 to 6. Finally, check your tuning with fret 5 (fret 4 on string 3). In the quiz, you will identify, name and tap strings on the diagram.',
        sequence(LOW_TO_HIGH.map(s => `${s + 1} ${openName(s)}`))),
    ],
    'notas-braco': [
      step('Uma casa, um semitom', 'One fret, one semitone',
        'Cada casa sobe a nota em um semitom, a menor distância na guitarra. A maioria das notas naturais vizinhas fica a duas casas de distância (um tom). Mi–Fá e Si–Dó ficam a apenas uma casa — como as teclas brancas sem tecla preta entre elas.',
        'Each fret raises the pitch by one semitone, the smallest step on the guitar. Most neighboring natural notes are two frets apart (a whole tone). E–F and B–C are only one fret apart, like the white keys with no black key between them.',
        <Fretboard stringLabels="name" showFretNumbers highlightStrings={[5]}
          markers={naturals(5, fret => [0, 1, 7, 8].includes(fret))} />),
      step('Conte a partir da corda solta', 'Count up from the open string',
        'Para achar uma nota, comece no nome da corda solta e siga a sequência. Na 5ª corda (Lá): Si na casa 2, Dó na 3, Ré na 5, Mi na 7, Fá na 8, Sol na 10 e Lá de novo na 12.',
        'To find a note, start from the open-string name and walk through the sequence. On string 5 (A): B at fret 2, C at 3, D at 5, E at 7, F at 8, G at 10 and A again at 12.',
        <Fretboard stringLabels="name" showFretNumbers highlightStrings={[4]}
          markers={naturals(4, fret => fret === 0 || fret === 12)} />),
      step('Casa 12: a oitava', 'Fret 12: the octave',
        'Na casa 12, cada corda volta à nota da corda solta, uma oitava acima. É a casa com marcação dupla. Depois dela, o mapa de notas se repete.',
        'At fret 12, every string plays its open-string note again, one octave higher. It is the fret with the double dot. Past fret 12, the note map repeats.',
        <Fretboard stringLabels="name" showFretNumbers
          markers={LOW_TO_HIGH.flatMap(s => [at(s, 0, 'accent'), at(s, 12, 'accent')])} />),
      step('Referências nas cordas Mi', 'Landmarks on the E strings',
        'A 6ª e a 1ª corda têm as mesmas notas nas mesmas casas. Sol, Lá e Si caem nas casas 3, 5 e 7, as primeiras com marcação; Dó fica na 8 e Ré na 10. Use essas referências para achar notas nas outras cordas.',
        'Strings 6 and 1 have the same notes at the same frets. G, A and B fall on frets 3, 5 and 7, the first dotted frets; C is at 8 and D at 10. Use these landmarks to find notes on the other strings.',
        <Fretboard stringLabels="name" showFretNumbers highlightStrings={[0, 5]}
          markers={[...naturals(0, fret => [3, 5, 7].includes(fret)), ...naturals(5, fret => [3, 5, 7].includes(fret))]} />),
      step('Explore o braço', 'Explore the fretboard',
        'Toque em qualquer posição para ver o nome da nota, a tablatura e como ela é escrita na pauta. Mostre todas as notas naturais ou destaque a mesma nota em todas as oitavas. As posições entre as notas naturais são sustenidos e bemóis, o próximo tópico.',
        'Tap any position to see its note name, its tab and how it is written on the staff. Show every natural note, or highlight the same note in every octave. Positions between natural notes are sharps and flats, the next topic.',
        <FretboardExplorer initial={{ string: 4, fret: 3 }} />),
      step('No seu instrumento', 'On your guitar',
        'Na 5ª corda, toque Lá, Si, Dó, Ré, Mi, Fá, Sol e Lá, da corda solta até a casa 12, dizendo cada nome em voz alta; depois desça. Repita na 6ª corda, de Mi a Mi. Por fim, encontre todas as notas Dó entre as casas 0 e 12: há uma em cada corda.',
        'On string 5, play A, B, C, D, E, F, G and A from the open string to fret 12, naming each note aloud, then come back down. Repeat on string 6, from E to E. Finally, find every C between frets 0 and 12: there is one on each string.',
        sequence(naturalFrets(4).map(fret => `${at(4, fret).label} ${fret}`))),
    ],
    'sustenidos-bemois': [
      step('Entre as notas naturais', 'Between the natural notes',
        'A maioria das notas naturais vizinhas fica a duas casas de distância. A casa do meio também tem nome: ela leva um sustenido (♯) ou um bemol (♭). Na 6ª corda, a casa 2 fica entre Fá (casa 1) e Sol (casa 3): é Fá♯, também chamada Sol♭.',
        'Most neighboring natural notes are two frets apart. The fret in between has a name too, with a sharp (♯) or a flat (♭). On string 6, fret 2 sits between F (fret 1) and G (fret 3): it is F♯, also called G♭.',
        <Fretboard frets={5} stringLabels="name" showFretNumbers highlightStrings={[5]}
          markers={[0, 1, 2, 3, 4, 5].map(fret => spelledAt(5, fret))} />),
      step('Sustenido: uma casa acima', 'Sharp: one fret up',
        'O sustenido (♯) sobe a nota um semitom: uma casa em direção ao corpo da guitarra. Na 5ª corda, Dó está na casa 3, então Dó♯ fica na casa 4.',
        'A sharp (♯) raises a note one semitone: one fret toward the body of the guitar. On string 5, C is at fret 3, so C♯ is at fret 4.',
        <Fretboard frets={5} stringLabels="name" showFretNumbers
          markers={[spelledAt(4, 3, '#', 'plain'), spelledAt(4, 4, '#', 'accent')]} />),
      step('Bemol: uma casa abaixo', 'Flat: one fret down',
        'O bemol (♭) desce a nota um semitom: uma casa em direção à cabeça da guitarra. Na 5ª corda, Si está na casa 2, então Si♭ fica na casa 1.',
        'A flat (♭) lowers a note one semitone: one fret toward the headstock. On string 5, B is at fret 2, so B♭ is at fret 1.',
        <Fretboard frets={5} stringLabels="name" showFretNumbers
          markers={[spelledAt(4, 1, 'b', 'accent'), spelledAt(4, 2, 'b', 'plain')]} />),
      step('Um som, dois nomes', 'One sound, two names',
        'Dó♯ e Ré♭ são a mesma casa e o mesmo som. O nome usado depende da tonalidade e do contexto, o que você verá nas escalas. Entre Mi e Fá, e entre Si e Dó, não há casa intermediária: uma casa acima de Mi já é Fá.',
        'C♯ and D♭ are the same fret and the same sound. Which name is used depends on the key and the context, which you will see with scales. There is no fret between E and F, or between B and C: one fret above E is already F.',
        <>{[1, 3, 6, 8, 10].map(pc => <div className="reference-card" key={pc}>
          <strong>{shortSpelled(spell(pc, '#'))} = {shortSpelled(spell(pc, 'b'))}</strong>
        </div>)}</>),
      step('Na pauta', 'On the staff',
        'Na pauta, o acidente fica logo antes da nota, na mesma linha ou espaço. O ♯ sobe, o ♭ desce e o bequadro (♮) cancela os dois. Dentro do compasso, o acidente também vale para as próximas notas na mesma linha ou espaço.',
        'On the staff, the accidental is written just before the note, on the same line or space. ♯ raises, ♭ lowers, and the natural sign (♮) cancels them. Within a measure, the accidental also applies to later notes on the same line or space.',
        <StaffDiagram clef="treble" width={420} height={175} notes={[
          { vexKey: 'f/4', label: shortSpelled({ letter: 'F', accidental: '' }) },
          { vexKey: 'f#/4', label: shortSpelled({ letter: 'F', accidental: '#' }), highlight: true },
          { vexKey: 'g/4', label: shortSpelled({ letter: 'G', accidental: '' }) },
          { vexKey: 'gb/4', label: shortSpelled({ letter: 'G', accidental: 'b' }), highlight: true },
        ]} />),
      step('No seu instrumento', 'On your guitar',
        'Na 6ª corda, toque casa por casa, da corda solta até a casa 12, dizendo o nome de cada nota: subindo, use sustenidos (Mi, Fá, Fá♯, Sol…); descendo, use bemóis (Mi, Mi♭, Ré, Ré♭…). Depois repita na 5ª corda.',
        'On string 6, play one fret at a time from the open string to fret 12, naming every note: going up, use sharps (E, F, F♯, G…); coming down, use flats (E, E♭, D, D♭…). Then repeat on string 5.',
        <>{sequence(chromatic(5, '#'))}{sequence(chromatic(5, 'b'))}</>),
    ],
    oitavas: [
      step('O que é uma oitava', 'What an octave is',
        'Duas notas a 12 semitons de distância têm o mesmo nome: a mais aguda vibra duas vezes mais rápido. Essa distância é a oitava. Numa mesma corda, a casa 12 é a oitava da corda solta.',
        'Two notes 12 semitones apart share the same name: the higher one vibrates twice as fast. That distance is an octave. On one string, fret 12 is the octave of the open string.',
        <Fretboard stringLabels="name" showFretNumbers highlightStrings={[4]}
          markers={[at(4, 0, 'root'), at(4, 12, 'accent')]} />),
      step('Duas cordas, duas casas', 'Two strings over, two frets up',
        'A partir das cordas 6 e 5, a oitava fica duas cordas na direção das cordas finas e duas casas à frente. Sol na 6ª corda, casa 3, tem a oitava na 4ª corda, casa 5; Dó na 5ª corda, casa 3, tem a oitava na 3ª corda, casa 5.',
        'From strings 6 and 5, the octave is two strings toward the thin strings and two frets up. G at fret 3 of string 6 has its octave at fret 5 of string 4; C at fret 3 of string 5 has its octave at fret 5 of string 3.',
        <Fretboard frets={7} stringLabels="name" showFretNumbers
          markers={[at(5, 3, 'root'), at(3, 5, 'accent'), at(4, 3, 'root'), at(2, 5, 'accent')]} />),
      step('Atenção à 2ª corda', 'Mind the 2nd string',
        'Quando o desenho passa da 3ª para a 2ª corda, ele anda uma casa a mais, porque essas duas cordas são afinadas a 4 casas de distância, não 5. Da 4ª corda para a 2ª, e da 3ª para a 1ª, a oitava fica três casas à frente: Sol na 4ª corda, casa 5, tem a oitava na 2ª corda, casa 8.',
        'When a shape crosses from string 3 to string 2, it moves one fret further, because those strings are tuned 4 frets apart instead of 5. From string 4 to string 2, and from string 3 to string 1, the octave is three frets up: G at fret 5 of string 4 has its octave at fret 8 of string 2.',
        <Fretboard frets={9} stringLabels="name" showFretNumbers
          markers={[at(3, 5, 'root'), at(1, 8, 'accent'), at(2, 2, 'root'), at(0, 5, 'accent')]} />),
      step('O mesmo som em dois lugares', 'One pitch, two places',
        'A mesma nota, na mesma altura, também aparece em outra corda: cinco casas para trás na corda vizinha mais aguda, ou quatro casas da 3ª para a 2ª corda. Dó na 6ª corda, casa 8, soa igual à 5ª corda, casa 3.',
        'The very same pitch also appears on another string: five frets lower on the next higher string, or four frets from string 3 to string 2. C at fret 8 of string 6 sounds the same as fret 3 of string 5.',
        <Fretboard frets={9} stringLabels="name" showFretNumbers highlightStrings={[5, 4]}
          markers={[at(5, 8, 'root'), at(4, 3, 'accent')]} />),
      step('Encontre todas as oitavas', 'Find every octave',
        'Toque em uma posição: o explorador destaca a mesma nota em todas as oitavas entre as casas 0 e 12. Procure os desenhos de oitava e os sons repetidos.',
        'Tap a position: the explorer highlights the same note in every octave between frets 0 and 12. Look for the octave shapes and the repeated pitches.',
        <FretboardExplorer initial={{ string: 5, fret: 3 }} showSameNote />),
      step('No seu instrumento', 'On your guitar',
        'Toque Sol na 6ª corda, casa 3, depois a oitava na 4ª corda, casa 5, e a seguinte na 2ª corda, casa 8. Repita a partir de Lá: 6ª corda, casa 5 → 4ª corda, casa 7 → 2ª corda, casa 10. Ouça as três soarem como a mesma nota, cada vez mais aguda.',
        'Play G at fret 3 of string 6, then its octave at fret 5 of string 4, then the next one at fret 8 of string 2. Repeat from A: string 6 fret 5 → string 4 fret 7 → string 2 fret 10. Listen to all three sound like the same note, higher each time.',
        <Fretboard frets={12} stringLabels="name" showFretNumbers markers={[
          at(5, 3, 'accent'), at(3, 5, 'accent'), at(1, 8, 'accent'),
          at(5, 5, 'root'), at(3, 7, 'root'), at(1, 10, 'root'),
        ]} />),
    ],
    intervalos: [
      step('A distância entre duas notas', 'The distance between two notes',
        'Um intervalo é a distância entre duas notas, contada em semitons. Numa mesma corda, basta contar as casas: de Dó (5ª corda, casa 3) até Mi (casa 7) são 4 casas, ou 4 semitons.',
        'An interval is the distance between two notes, counted in semitones. On one string, just count the frets: from C (string 5, fret 3) to E (fret 7) is 4 frets, or 4 semitones.',
        <>
          <Fretboard frets={9} stringLabels="name" showFretNumbers highlightStrings={[4]}
            markers={[degree(4, 3, 'R', 'root'), degree(4, 7, '3')]} />
          {listen({ notes: [48, 52] })}
        </>),
      step('Número e qualidade', 'Number and quality',
        'O número do intervalo conta os nomes de nota, incluindo as duas pontas: de Dó a Mi são três (Dó, Ré, Mi), uma 3ª. A qualidade vem dos semitons: 3 semitons formam uma 3ª menor; 4, uma 3ª maior. A 4ª, a 5ª e a oitava são chamadas justas.',
        'The interval number counts letter names, including both ends: C to E spans three (C, D, E), a 3rd. The quality comes from the semitones: 3 semitones make a minor 3rd; 4 make a major 3rd. 4ths, 5ths and octaves are called perfect.',
        <div className="interval-table">{INTERVALS.map(i => <div className="reference-card" key={i.semitones}>
          <strong>{i[lang]}</strong>{i.semitones} {text('semitons', 'semitones')} · {i.degree}
        </div>)}</div>),
      step('Em outra corda', 'Across the strings',
        'Passar para a corda vizinha mais aguda soma 5 semitons (4 da 3ª para a 2ª corda). Assim, a partir de Sol na 6ª corda, casa 3: a 4ª justa fica na mesma casa da 5ª corda; a 5ª justa, duas casas à frente dela; e a oitava, duas cordas acima e duas casas à frente.',
        'Moving to the next higher string adds 5 semitones (4 from string 3 to string 2). So from G at fret 3 of string 6: the perfect 4th is at the same fret on string 5; the perfect 5th is two frets up from there; and the octave is two strings over and two frets up.',
        <>
          <Fretboard frets={7} stringLabels="name" showFretNumbers
            markers={[degree(5, 3, 'R', 'root'), degree(4, 3, '4'), degree(4, 5, '5'), degree(3, 5, '8')]} />
          {listen(
            { notes: [43, 48], label: text('4ª justa', 'Perfect 4th') },
            { notes: [43, 50], label: text('5ª justa', 'Perfect 5th') },
            { notes: [43, 55], label: text('Oitava', 'Octave') },
          )}
        </>),
      step('Terça maior e terça menor', 'Major and minor thirds',
        'A 3ª maior soa mais clara e a 3ª menor, mais escura. A partir de Lá na 6ª corda, casa 5: a 3ª menor (Dó) está na 5ª corda, casa 3; a 3ª maior (Dó♯), uma casa à frente, na casa 4. Essa única casa é a diferença entre um acorde maior e um menor.',
        'A major 3rd sounds bright and a minor 3rd sounds dark. From A at fret 5 of string 6: the minor 3rd (C) is at fret 3 of string 5; the major 3rd (C♯) is one fret up, at fret 4. That single fret is the difference between a major and a minor chord.',
        <>
          <Fretboard frets={7} stringLabels="name" showFretNumbers
            markers={[degree(5, 5, 'R', 'root'), degree(4, 3, '♭3', 'plain'), degree(4, 4, '3')]} />
          {listen(
            { notes: [45, 48], label: text('3ª menor', 'Minor 3rd') },
            { notes: [45, 49], label: text('3ª maior', 'Major 3rd') },
          )}
        </>),
      step('Graus', 'Degrees',
        'Contados a partir da fundamental (R, do inglês "root"), os intervalos viram graus: 1, ♭3, 3, 5, ♭7… Acordes e escalas são feitos de graus. Dó, Mi e Sol são os graus 1, 3 e 5 de Dó: a tríade de Dó maior, tema do Módulo 3.',
        'Counted from the root (R), intervals become degrees: 1, ♭3, 3, 5, ♭7… Chords and scales are built from degrees. C, E and G are degrees 1, 3 and 5 of C: the C major triad, coming in Module 3.',
        <>
          <Fretboard frets={7} stringLabels="name" showFretNumbers
            markers={[degree(4, 3, 'R', 'root'), degree(3, 2, '3'), degree(3, 5, '5')]} />
          {listen(
            { notes: [48, 52, 55], spacing: 0.45, label: text('Uma por vez', 'One at a time') },
            { notes: [48, 52, 55], spacing: 0.03, label: text('Juntas', 'Together') },
          )}
        </>),
      step('No seu instrumento', 'On your guitar',
        'A partir de Sol (6ª corda, casa 3), toque cada intervalo e volte à fundamental: a 4ª (5ª corda, casa 3), a 5ª (5ª corda, casa 5) e a oitava (4ª corda, casa 5). Cante as notas. Depois compare a 3ª menor e a 3ª maior a partir de Lá (6ª corda, casa 5).',
        'From G (string 6, fret 3), play each interval and return to the root: the 4th (string 5, fret 3), the 5th (string 5, fret 5) and the octave (string 4, fret 5). Sing the notes. Then compare the minor and major 3rd from A (string 6, fret 5).',
        <Fretboard frets={7} stringLabels="name" showFretNumbers markers={[
          degree(5, 3, 'R', 'root'), degree(4, 3, '4'), degree(4, 5, '5'), degree(3, 5, '8'),
          degree(5, 5, 'R', 'root'), degree(4, 4, '3', 'plain'),
        ]} />),
    ],
  };

  return <LessonShell title={t(`games.${id}`)} steps={lessons[id]} onExit={onExit} onPractice={onPractice} />;
}
