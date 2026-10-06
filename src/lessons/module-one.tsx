import type { ReactNode } from 'react';
import { Fretboard } from '../components/Fretboard';
import { Keyboard } from '../components/Keyboard';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { RhythmFigure } from '../components/RhythmFigure';
import { StaffDiagram } from '../components/StaffDiagram';
import { SOUND_PROPERTIES, type ModuleOneId, type SoundProperty } from '../games/module-one/questions';
import { useI18n } from '../hooks/useI18n';
import { fretsForVexKey } from '../music/guitar';
import { LETTERS, noteLabel, shortNoteLabel, type LetterNote } from '../music/notes';
import { beatLabel, RHYTHM_VALUES, type RhythmId } from '../music/rhythm';
import { TREBLE_POSITIONS } from '../music/theory';
import { useSettings } from '../SettingsContext';
import type { LessonProps } from './index';

export function ModuleOneLesson({ id, onExit, onPractice }: LessonProps & { id: ModuleOneId }) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const text = (pt: string, en: string) => lang === 'pt' ? pt : en;
  const name = (letter: LetterNote) => noteLabel(letter, settings.notation, lang);
  const step = (ptTitle: string, enTitle: string, pt: string, en: string, visual: ReactNode): LessonStep => ({
    title: text(ptTitle, enTitle),
    body: <><p className="lesson-copy">{text(pt, en)}</p><div className="lesson-visual">{visual}</div></>,
  });
  const sequence = (letters: LetterNote[], arrow = '→') => <div className="note-sequence">
    {letters.map((letter, i) => <span key={i}>{i > 0 && `${arrow} `}{name(letter)}</span>)}
  </div>;
  const mapping = (letters: LetterNote[]) => letters.map(letter => <div className="reference-card" key={letter}>
    <strong>{letter}</strong>{noteLabel(letter, 'solfege', lang)}
  </div>);
  const staff = (keys: string[]) => <StaffDiagram clef="treble" width={Math.min(540, 160 + keys.length * 55)} height={175}
    notes={keys.map(vexKey => ({ vexKey, label: name(vexKey[0].toUpperCase() as LetterNote), highlight: true }))} />;
  const rhythms = (ids: RhythmId[]) => <div className="rhythm-reference">
    {RHYTHM_VALUES.filter(v => ids.includes(v.id)).map(v => <figure key={v.id}>
      <RhythmFigure value={v.id} label={v[lang]} />
      <figcaption><strong>{v[lang]}</strong><br />{beatLabel(v.beats, lang)}</figcaption>
    </figure>)}
  </div>;
  const keyboard = (highlighted?: LetterNote) => <Keyboard language={lang} notation={settings.notation} showLabels highlighted={highlighted} />;
  const property = (id: SoundProperty, pt: string, en: string) => <div className="reference-card">
    <strong>{SOUND_PROPERTIES[id][lang]}</strong>{text(pt, en)}
  </div>;

  const lessons: Record<ModuleOneId, LessonStep[]> = {
    'nome-notas': [
      step('Sete nomes que se repetem', 'Seven repeating names',
        'As notas naturais são Dó, Ré, Mi, Fá, Sol, Lá e Si. Depois de Si vem outro Dó, mais agudo. O nome volta a aparecer, mas a altura muda. Vamos ampliar a leitura para todas as linhas e espaços da pauta.',
        'The natural notes are C, D, E, F, G, A and B. After B comes another C, higher in pitch. Names repeat at different heights. Now we will read all the lines and spaces of the staff.',
        sequence([...LETTERS, 'C'])),
      step('As cinco linhas', 'The five lines',
        'Na clave de sol, as linhas são Mi, Sol, Si, Ré e Fá, de baixo para cima. Entre duas linhas há uma nota no espaço: por isso os nomes das linhas pulam uma nota da sequência.',
        'In treble clef, the lines are E, G, B, D and F from bottom to top. A space note sits between each pair of lines, so the line names skip every other note in the sequence.',
        staff(['e/4', 'g/4', 'b/4', 'd/5', 'f/5'])),
      step('Os quatro espaços', 'The four spaces',
        'Os espaços são Fá, Lá, Dó e Mi, também de baixo para cima. Em letras, formam F–A–C–E. Use os espaços junto com as linhas para ler sem adivinhar.',
        'The spaces are F, A, C and E, also from bottom to top. They spell FACE. Learn the spaces alongside the lines so you can work out a note instead of guessing.',
        staff(['f/4', 'a/4', 'c/5', 'e/5'])),
      step('Use uma nota conhecida', 'Start from a familiar note',
        'A clave de sol ancora Sol na segunda linha. Um passo acima é Lá, depois Si. Um passo abaixo é Fá, depois Mi. Cada passo troca linha por espaço ou espaço por linha.',
        'Treble clef anchors G on line 2. One step above is A, then B. One step below is F, then E. Each step moves from a line to a space or from a space to a line.',
        staff(['e/4', 'f/4', 'g/4', 'a/4', 'b/4'])),
      step('Encontre no braço', 'Find it on the fretboard',
        'A música para guitarra é escrita uma oitava acima do som real. Na primeira posição, as notas da pauta ocupam quatro cordas: Mi e Fá na 4ª (casas 2 e 3), Sol e Lá na 3ª (solta e casa 2), Si, Dó e Ré na 2ª (solta, casas 1 e 3) e Mi e Fá na 1ª (solta e casa 1). O desenho depois da resposta mostra essa posição.',
        'Guitar music is written an octave above how it sounds. In first position, the staff notes use four strings: E and F on the 4th (frets 2 and 3), G and A on the 3rd (open and fret 2), B, C and D on the 2nd (open, frets 1 and 3), and E and F on the 1st (open and fret 1). The feedback diagram shows this position.',
        <Fretboard frets={5} markers={TREBLE_POSITIONS.map(p => ({
          ...fretsForVexKey(p.vexKey)[0], label: shortNoteLabel(p.letter, settings.notation, lang),
        }))} />),
      step('Como jogar', 'How to play',
        'Leia a nota na clave de sol e escolha o nome correto. São dez rodadas, cobrindo as cinco linhas e os quatro espaços. Depois de responder, revise o nome, a posição na pauta e a posição no braço.',
        'Read the treble-clef note and choose its name. Ten rounds cover the five lines and four spaces. After answering, review the name, staff position and fretboard position.',
        <StaffDiagram clef="treble" notes={[{ vexKey: 'd/5', label: '?', highlight: true }]} />),
    ],
    'notacao-alfabetica': [
      step('Dois nomes, a mesma nota', 'Two names for the same note',
        'Você verá nomes em solfejo e em letras. Neste aplicativo, Dó corresponde a C, Ré a D e assim por diante. Essa correspondência fixa ajuda a ler cifras, afinadores e materiais de guitarra.',
        'You will see solfege names and letter names. This app uses a fixed mapping: Do means C, Re means D, and so on. It helps connect lessons to tuners and guitar chord symbols.',
        mapping(['C', 'D', 'E'])),
      step('Complete o mapa', 'Complete the mapping',
        'Fá é F, Sol é G, Lá é A e Si é B. As letras vão de A até G e voltam a A. A sequência do solfejo começa em Dó, que corresponde a C, e não a A.',
        'Fa is F, Sol is G, La is A and Ti is B. Letters go from A to G and wrap back to A. The solfege sequence starts on Do, which maps to C, not A.',
        mapping(['F', 'G', 'A', 'B'])),
      step('O ciclo das letras', 'The letter cycle',
        'Lendo a partir de Dó: C, D, E, F, G, A, B, C. Depois de G vem A; depois de B vem C. A ordem musical continua mesmo quando a letra volta ao começo do alfabeto.',
        'Starting from Do, read C, D, E, F, G, A, B, C. G is followed by A, and B by C. The musical sequence keeps going when the alphabet wraps around.',
        <div className="note-sequence">C → D → E → F → G → A → B → C</div>),
      step('Si em português, Ti em inglês', 'Si in Portuguese, Ti in English',
        'Usamos Si no português e Ti no inglês para a nota B. O idioma muda o nome escrito, não a nota. No jogo, você traduz nos dois sentidos: de solfejo para letra e de letra para solfejo.',
        'We use Si in Portuguese and Ti in English for B. Changing language changes the label, not the note. The quiz asks for both directions: solfege to letters and letters to solfege.',
        <div className="reference-card"><strong>B</strong>Si (PT) · Ti (EN)</div>),
      step('As cordas da guitarra', 'Guitar string names',
        'Da corda mais grave para a mais aguda, a afinação padrão é E–A–D–G–B–E: Mi–Lá–Ré–Sol–Si–Mi. Um afinador com a letra G está mostrando Sol.',
        'From lowest to highest string, standard tuning is E–A–D–G–B–E: Mi–La–Re–Sol–Ti–Mi. A tuner displaying G is showing Sol.',
        mapping(['E', 'A', 'D', 'G', 'B'])),
      step('Como jogar', 'How to play',
        'Observe se a pergunta pede uma letra ou um nome em solfejo. Escolha o equivalente. Para treinar a tradução de verdade, as alternativas usam o formato pedido, independentemente da preferência de notação do menu.',
        'Check whether the question asks for a letter or a solfege name, then choose its equivalent. Answer labels use the requested format regardless of the menu’s note-name preference, so the translation stays a useful exercise.',
        <div className="note-sequence">{text('Sol → G', 'Sol → G')} · A → {text('Lá', 'La')}</div>),
    ],
    'nome-figuras': [
      step('O desenho indica duração', 'The shape indicates duration',
        'A altura da nota diz qual som tocar; a figura rítmica indica sua duração relativa. Vamos nomear sete figuras. Nos exemplos desta lição, a semínima vale um tempo. Esse valor depende da unidade de tempo escolhida.',
        'Pitch tells you which note to play; a rhythm symbol gives its relative duration. We will name seven symbols. In this lesson’s examples, the quarter note is one beat. Beat counts depend on the chosen beat unit.',
        rhythms(['quarter'])),
      step('Semibreve e mínima', 'Whole and half notes',
        'A semibreve tem cabeça vazada, sem haste. A mínima tem cabeça vazada e haste. Com a semínima valendo um tempo, duram quatro e dois tempos. Duas mínimas ocupam a mesma duração de uma semibreve.',
        'A whole note has an open head and no stem. A half note has an open head and a stem. With a quarter-note beat, they last four and two beats. Two half notes last as long as one whole note.',
        rhythms(['whole', 'half'])),
      step('Semínima e colcheia', 'Quarter and eighth notes',
        'A semínima tem cabeça preenchida e haste. A colcheia acrescenta um colchete. Nesses exemplos, a semínima dura um tempo e a colcheia meio tempo: cabem duas colcheias em uma semínima.',
        'A quarter note has a filled head and stem. An eighth note adds one flag. Here a quarter note lasts one beat and an eighth note half a beat: two eighth notes fit into one quarter note.',
        rhythms(['quarter', 'eighth'])),
      step('Conte os colchetes', 'Count the flags',
        'Semicolcheia: dois colchetes. Fusa: três. Semifusa: quatro. Cada colchete a mais divide a duração pela metade. Em grupos, barras podem substituir os colchetes; neste jogo as figuras aparecem isoladas.',
        'A sixteenth note has two flags, a thirty-second note three, and a sixty-fourth note four. Each extra flag halves the duration. Beams can replace flags in groups; this quiz shows individual notes.',
        rhythms(['sixteenth', 'thirty-second', 'sixty-fourth'])),
      step('Na guitarra', 'On the guitar',
        'Você pode tocar a mesma nota com durações diferentes. Conte quatro pulsos iguais: deixe a nota soar durante os quatro, depois tente um som em cada pulso. A nota pode ser igual; o ritmo muda.',
        'You can play the same pitch with different durations. Count four steady beats: let a note ring across all four, then try one note on each beat. The pitch can stay the same while the rhythm changes.',
        <div className="note-sequence">1 · 2 · 3 · 4</div>),
      step('Como jogar', 'How to play',
        'Veja a cabeça, a haste e o número de colchetes. Escolha o nome da figura, não o nome de uma nota como Dó ou Ré. O retorno mostra a duração usando a semínima como unidade de tempo.',
        'Look at the notehead, stem and number of flags. Choose the rhythm symbol’s name, not a pitch name such as C or D. Feedback gives its duration using a quarter-note beat.',
        <RhythmFigure value="eighth" label={text('Exemplo: colcheia', 'Example: eighth note')} />),
    ],
    'notas-descendentes': [
      step('Leia o ciclo ao contrário', 'Read the cycle backward',
        'Subir segue Dó–Ré–Mi–Fá–Sol–Lá–Si. Descer inverte a ordem: Si–Lá–Sol–Fá–Mi–Ré–Dó. Descer significa ir para sons mais graves, não tocar mais baixo no volume.',
        'Going up follows C–D–E–F–G–A–B. Going down reverses it: B–A–G–F–E–D–C. Descending means moving to lower pitches, not playing more quietly.',
        sequence([...LETTERS].reverse(), '↘')),
      step('Um passo é uma mudança', 'A step is one move',
        'Partindo de Sol, um passo para baixo chega a Fá. Dois passos chegam a Mi. A nota inicial não conta como passo: conte apenas as mudanças para a nota vizinha.',
        'Starting on G, one step down reaches F. Two steps reach E. The starting note is not a step: count only moves to the neighboring note.',
        sequence(['G', 'F', 'E'], '↘')),
      step('Atravesse o Dó', 'Crossing C',
        'Antes de Dó vem Si, na região mais grave. Por isso, Dó descendo dois passos chega a Lá: Dó → Si → Lá. O ciclo não para na primeira nota da lista.',
        'Below C comes B in the lower register. So C down two steps reaches A: C → B → A. The cycle does not stop at the first name in the list.',
        sequence(['C', 'B', 'A'], '↘')),
      step('Veja na pauta', 'See it on the staff',
        'Aqui, Dó no terceiro espaço desce para Si na terceira linha e Lá no segundo espaço. Cada movimento para a posição vizinha corresponde a um passo na sequência de notas naturais.',
        'Here C in space 3 moves down to B on line 3, then A in space 2. Each move to the neighboring staff position is one step through the natural-note sequence.',
        staff(['c/5', 'b/4', 'a/4'])),
      step('Desça na mesma corda', 'Go down on one string',
        'Na corda mi aguda, Si na casa 7, Lá na 5 e Sol na 3 formam uma sequência descendente. Passos entre notas naturais nem sempre ocupam o mesmo número de casas: Mi–Fá e Si–Dó ficam a uma casa de distância.',
        'On the high E string, B at fret 7, A at 5 and G at 3 form a descending sequence. Natural-note steps do not always span the same number of frets: E–F and B–C are one fret apart.',
        <Fretboard positions={[7, 5, 3].map(fret => ({ string: 0, fret }))} highlightFirst={false} />),
      step('Como jogar', 'How to play',
        'Leia a nota inicial e desça de um a quatro passos, conforme o pedido. Os pontos de interrogação mostram quantas mudanças fazer. Escolha a nota final e confira o caminho completo após responder.',
        'Read the starting note and move down one to four steps as requested. Question marks show how many moves to make. Choose the final note and check the full sequence after answering.',
        <div className="note-sequence">{name('D')} ↘ ? ↘ ?</div>),
    ],
    'propriedades-som': [
      step('Quatro formas de descrever um som', 'Four ways to describe a sound',
        'Podemos descrever um som pela altura, duração, intensidade e timbre. Elas respondem a perguntas diferentes: grave ou agudo, curto ou longo, fraco ou forte, e qual caráter sonoro. Aqui você vai classificar situações descritas em texto.',
        'We can describe a sound by its pitch, duration, loudness and timbre. They answer different questions: low or high, short or long, quiet or loud, and what tone color. Here you will classify written scenarios.',
        <>{property('pitch', 'grave ↔ agudo', 'low ↔ high')}{property('duration', 'curto ↔ longo', 'short ↔ long')}
          {property('dynamics', 'fraco ↔ forte', 'quiet ↔ loud')}{property('timbre', 'caráter do som', 'tone color')}</>),
      step('Altura: grave ou agudo', 'Pitch: low or high',
        'Uma nota grave tem altura menor; uma aguda tem altura maior. Na mesma corda da guitarra, ir para uma casa mais alta deixa a nota mais aguda. Isso não quer dizer aumentar o volume.',
        'A low note has lower pitch; a high note has higher pitch. On the same guitar string, moving to a higher fret raises the pitch. This does not mean turning up the volume.',
        property('pitch', 'Mi → Sol: mais agudo', 'E → G above it: higher pitch')),
      step('Duração: curto ou longo', 'Duration: short or long',
        'Duração é o tempo durante o qual um som permanece. Deixar a corda soar ou abafá-la cedo muda a duração. É diferente do andamento, que é a velocidade do pulso musical.',
        'Duration is how long a sound lasts. Letting a string ring or muting it early changes its duration. This differs from tempo, which is the speed of the musical beat.',
        property('duration', 'abafar cedo ↔ deixar soar', 'mute early ↔ let it ring')),
      step('Intensidade: fraco ou forte', 'Loudness: quiet or loud',
        'Intensidade está ligada ao volume percebido. Você pode tocar a mesma nota de forma suave ou forte. Na música, variações de intensidade fazem parte da dinâmica. Agudo não significa forte.',
        'Loudness concerns perceived volume. You can play the same pitch quietly or loudly. Changes in loudness are part of musical dynamics. A high pitch does not mean a loud sound.',
        property('dynamics', 'volume menor ↔ volume maior', 'lower volume ↔ higher volume')),
      step('Timbre: a identidade do som', 'Timbre: the character of a sound',
        'Timbre ajuda a distinguir instrumentos tocando a mesma nota. Na guitarra, som limpo e distorcido têm timbres diferentes. Na prática, uma ação pode mudar várias propriedades; identifique a que a descrição destaca.',
        'Timbre helps distinguish instruments playing the same pitch. Clean and distorted guitars have different tone colors. In practice, one action can change several properties; identify the one highlighted in the description.',
        property('timbre', 'piano · guitarra · flauta', 'piano · guitar · flute')),
      step('Como jogar', 'How to play',
        'Leia cada situação e escolha altura, duração, intensidade ou timbre. Não é necessário ouvir áudio. Pergunte: mudou a nota, o tempo que ela soa, o volume ou o caráter do som? O retorno explica a resposta.',
        'Read each scenario and choose pitch, duration, loudness or timbre. No audio is required. Ask: did the pitch, length, volume or tone color change? Feedback explains the answer.',
        property('duration', '“A nota termina mais cedo.”', '“The note ends sooner.”')),
    ],
    'notas-teclado': [
      step('Encontre os grupos de teclas pretas', 'Find the black-key groups',
        'O desenho do teclado se repete em grupos de duas e três teclas pretas. Esses grupos ajudam a localizar as teclas brancas sem decorar posições na tela. Nesta atividade vamos nomear apenas as teclas brancas.',
        'The keyboard repeats groups of two and three black keys. These groups help locate white keys without memorizing screen positions. In this activity we name only the white keys.',
        keyboard()),
      step('Dó fica antes de duas pretas', 'C is before two black keys',
        'Encontre um grupo de duas teclas pretas. A tecla branca imediatamente à esquerda é Dó. No espaço entre as duas pretas fica Ré; à direita do grupo fica Mi.',
        'Find a pair of black keys. The white key immediately to its left is C. The white key between the two black keys is D; the one just to the right of the pair is E.',
        keyboard('C')),
      step('Fá fica antes de três pretas', 'F is before three black keys',
        'A tecla branca imediatamente à esquerda do grupo de três pretas é Fá. Dentro desse grupo ficam Sol e Lá. À direita fica Si. Depois vem outro Dó e o desenho recomeça.',
        'The white key immediately to the left of three black keys is F. G and A sit within that group; B sits just to its right. Another C follows and the pattern repeats.',
        keyboard('F')),
      step('Nem sempre há uma tecla preta entre elas', 'Not every gap has a black key',
        'Não há tecla preta entre Mi e Fá, nem entre Si e o próximo Dó. Esses pares de notas naturais são separados por um semitom. Os outros pares vizinhos de teclas brancas têm uma tecla preta entre eles.',
        'There is no black key between E and F, or between B and the next C. These natural-note pairs are one semitone apart. The other neighboring white-key pairs have a black key between them.',
        keyboard('E')),
      step('O mesmo mapa na guitarra', 'The same notes on guitar',
        'Os nomes das notas são os mesmos em qualquer instrumento. Na guitarra, cada casa muda a altura em um semitom. Na corda mi aguda, Mi e Fá ficam nas casas 0 e 1; Fá e Sol ficam nas casas 1 e 3.',
        'Note names are the same across instruments. On guitar, each fret changes pitch by one semitone. On the high E string, E and F are at frets 0 and 1; F and G are at frets 1 and 3.',
        <Fretboard positions={[0, 1, 3].map(fret => ({ string: 0, fret }))} highlightFirst={false} />),
      step('Como jogar', 'How to play',
        'Identifique a tecla verde pelo grupo de teclas pretas mais próximo. Escolha seu nome. Depois da resposta, os nomes aparecem no teclado para você conferir e reforçar o mapa.',
        'Identify the green key using the nearest black-key group, then choose its name. After you answer, labels appear on the keyboard so you can check and reinforce the pattern.',
        <Keyboard highlighted="D" language={lang} notation={settings.notation} />),
    ],
  };

  return <LessonShell title={t(`games.${id}`)} steps={lessons[id]} onExit={onExit} onPractice={onPractice} />;
}
