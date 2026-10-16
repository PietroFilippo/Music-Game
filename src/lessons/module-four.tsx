import type { ReactNode } from 'react';
import { Fretboard } from '../components/Fretboard';
import { HearButton } from '../components/HearButton';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { createCopy } from '../games/fretboard/model';
import { ARPEGGIO_EXAMPLES } from '../games/module-four/arpeggios';
import { describeChord, example, shapeBoard, symbol, VOICING_EXAMPLES, VOICING_LAYOUTS, type SeventhExample } from '../games/module-four/common';
import type { ModuleFourId } from '../games/module-four/questions';
import { useI18n } from '../hooks/useI18n';
import { orderedVoicings } from '../music/chord-shapes';
import { SEVENTHS, type SeventhQuality } from '../music/chords';
import { soundingMidi } from '../music/guitar';
import { majorSevenths, MAJOR_SEVENTH_ROMANS } from '../music/harmony';
import type { SpelledNote } from '../music/notes';
import { useSettings } from '../SettingsContext';
import type { LessonProps } from './index';

const C: SpelledNote = { letter: 'C', accidental: '' };
const G: SpelledNote = { letter: 'G', accidental: '' };
const B: SpelledNote = { letter: 'B', accidental: '' };

export function ModuleFourLesson({ id, onExit, onPractice }: LessonProps & { id: ModuleFourId }) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const c = createCopy(lang, settings.notation);
  const { text } = c;
  const n = (letter: SpelledNote['letter'], accidental: SpelledNote['accidental'] = '') => c.spelled({ letter, accidental });
  const step = (ptTitle: string, enTitle: string, pt: string, en: string, visual: ReactNode): LessonStep => ({
    title: text(ptTitle, enTitle), body: <p className="lesson-copy">{text(pt, en)}</p>,
    visual,
  });
  const panel = (e: SeventhExample, spacing = 0.03, heading?: string) => <div className="reference-card chord-panel">
    {heading && <strong>{heading}</strong>}
    <p className="lesson-copy">{describeChord(c, e)}</p>
    <Fretboard frets={12} {...shapeBoard(e.shape)} />
    <HearButton notes={e.shape.map(t => soundingMidi(t.position))} spacing={spacing} />
  </div>;
  const chord = (quality: SeventhQuality, root = C) => example({ root, quality });
  const cm = chord('maj7');
  const arp = (quality: SeventhQuality, string = 5, root = G) => ARPEGGIO_EXAMPLES.find(e => e.root.letter === root.letter && e.root.accidental === root.accidental && e.quality === quality && e.shape[0].position.string === string)!;
  const gArp = arp('maj7');
  const progression = (key: SpelledNote, degrees = [2, 5, 1]) => {
    const chords = majorSevenths(key);
    return <div className="note-sequence">{degrees.map(i => `${MAJOR_SEVENTH_ROMANS[lang][i - 1]} = ${symbol(c, chords[i - 1])}`).join(' → ')}</div>;
  };
  const layoutPanel = (index: number) => {
    const l = VOICING_LAYOUTS[index];
    const shape = orderedVoicings(C, SEVENTHS.maj7, l.strings, l.order)[0];
    const e = shape ? { root: C, quality: 'maj7' as const, shape } : VOICING_EXAMPLES.find(e => e.quality === 'maj7' && e.shape.map(t => t.position.string).join() === l.strings.join() && e.shape.map(t => t.toneIndex).join() === l.order.join())!;
    return panel(e, 0.03, `${text('Cordas', 'Strings')} ${l.strings.map(s => s + 1).join('–')} · ${l.order.map(i => [1, 3, 5, 7][i]).join('–')}`);
  };
  const lessons: Record<ModuleFourId, LessonStep[]> = {
    tetrades: [
      step('Uma tríade mais uma sétima', 'A triad plus a seventh',
        `Uma tétrade tem quatro notas diferentes: fundamental (R), terça, quinta e sétima. Acrescente ${n('B')} (7) à tríade de ${n('C')}: C7M = R–3–5–7. A sétima maior fica 11 semitons acima de R. Toque juntas para ouvir o acorde; separadas, formam um arpejo.`,
        `A seventh chord has four different tones: root (R), third, fifth and seventh. Add ${n('B')} (7) to the ${n('C')} major triad: Cmaj7 = R–3–5–7. The major seventh is 11 semitones above R. Played together they form a chord; played separately, an arpeggio.`, panel(cm)),
      step('Maior, dominante e menor', 'Major, dominant and minor',
        `C7M → C7: ${n('B')} (7) desce para ${n('B', 'b')} (♭7). C7 é maior com sétima menor, chamado dominante. C7 → Cm7: ${n('E')} (3) desce para ${n('E', 'b')} (♭3). Compare R–3–5–7, R–3–5–♭7 e R–♭3–5–♭7.`,
        `Cmaj7 → C7: ${n('B')} (7) falls to ${n('B', 'b')} (♭7). C7 is a major triad with a minor seventh, called dominant seventh. C7 → Cm7: ${n('E')} (3) falls to ${n('E', 'b')} (♭3). Compare R–3–5–7, R–3–5–♭7 and R–♭3–5–♭7.`,
        <>{panel(chord('dom7'))}{panel(chord('m7'))}</>),
      step('Meio-diminuto e diminuto', 'Half-diminished and diminished seventh',
        `Cm7 → Cm7(♭5): ${n('G')} (5) desce para ${n('G', 'b')} (♭5). Meio-diminuto = R–♭3–♭5–♭7, também ø. Para o diminuto, abaixe ainda a sétima: R–♭3–♭5–♭♭7. Em B°, ${n('A', 'b')} é a sétima diminuta, 9 semitons acima de ${n('B')}; soa como uma sexta maior, mas sua letra é a da sétima. Usamos esta fundamental para evitar acidentes duplos nos nomes.`,
        `Cm7 → Cm7♭5: ${n('G')} (5) falls to ${n('G', 'b')} (♭5). Half-diminished = R–♭3–♭5–♭7, also ø. For diminished seventh, lower the seventh too: R–♭3–♭5–♭♭7. In B°7, ${n('A', 'b')} is the diminished seventh, 9 semitones above ${n('B')}; it sounds like a major sixth, but keeps the seventh letter. This root avoids double accidentals in note names.`,
        <>{panel(chord('m7b5'))}{panel(chord('dim7', B))}</>),
      step('Outras duas cores', 'Two more colors',
        `Cm7M combina terça menor e sétima maior: R–♭3–5–7. C7M(♯5) combina terça maior, quinta aumentada e sétima maior: R–3–♯5–7. Compare ${n('G')} (5) com ${n('G', '#')} (♯5), preservando a letra da quinta.`,
        `Cm(maj7) combines a minor third and major seventh: R–♭3–5–7. Cmaj7♯5 combines a major third, augmented fifth and major seventh: R–3–♯5–7. Compare ${n('G')} (5) with ${n('G', '#')} (♯5), preserving the fifth letter.`,
        <>{panel(chord('mMaj7'))}{panel(chord('maj7#5'))}</>),
      step('Cifras brasileiras e americanas', 'Brazilian and American symbols',
        'As cifras sempre usam letras. PT 7M = EN maj7 (também Δ); 7 = 7; m7 = m7; m7(♭5) = m7♭5 = ø; ° = °7 (dim7); m7M = m(maj7); 7M(♯5) = maj7♯5. O número 7 sozinho indica sétima menor; 7M/maj7 indica sétima maior. Os nomes das notas seguem sua configuração de notação.',
        'Chord symbols always use letters. PT 7M = EN maj7 (also Δ); 7 = 7; m7 = m7; m7(♭5) = m7♭5 = ø; ° = °7 (dim7); m7M = m(maj7); 7M(♯5) = maj7♯5. The suffix 7 alone means a minor seventh; 7M/maj7 means a major seventh. Note names follow your notation setting.', panel(cm)),
      step('No seu instrumento', 'On your guitar',
        `Toque C7M → C7 → Cm7 → Cm7(♭5), dizendo a nota e o grau que mudam. Depois compare Bm7(♭5) → B°. Abafe as cordas fora do desenho. Ouça cada nota antes de tocar o acorde. A pauta de guitarra é escrita uma oitava acima do som real; os botões tocam a altura real.`,
        `Play Cmaj7 → C7 → Cm7 → Cm7♭5, naming each changed note and degree. Then compare Bm7♭5 → B°7. Mute strings outside the shape. Hear each note before playing the chord. Guitar staff notation is an octave above the sounding pitch; the buttons play actual sounding pitches.`,
        <>{panel(chord('m7b5', B))}{panel(chord('dim7', B))}</>),
    ],
    'tetrades-formacoes': [
      step('Formação e baixo', 'Voicing and bass',
        'Voicing é a disposição das notas de um acorde, aqui chamada formação. Baixo é a nota mais grave que soa. Todas estas formações têm quatro notas, uma de cada grau, e R no baixo. Trocar a ordem das vozes superiores mantém a posição fundamental.',
        'A voicing is the arrangement of chord tones. The bass is the lowest sounding note. All these voicings contain four notes, one of each degree, with R in the bass. Changing the upper-voice order keeps the chord in root position.', panel(cm)),
      step('Ordem 1–7–3–5', 'Order 1–7–3–5',
        'Leia do grave ao agudo: R, sétima, terça, quinta. Com R na 6ª corda, use 6–4–3–2 e pule a 5ª; com R na 5ª, use 5–3–2–1 e pule a 4ª. Abafe a corda pulada e todas as cordas fora do grupo.',
        'Read from low to high: root, seventh, third, fifth. With R on string 6, use 6–4–3–2 and skip string 5; with R on string 5, use 5–3–2–1 and skip string 4. Mute the skipped string and every string outside the set.', <>{layoutPanel(0)}{layoutPanel(1)}</>),
      step('Ordem 1–5–7–3', 'Order 1–5–7–3',
        'Agora a quinta vem logo acima de R; a terça fica na voz mais aguda. Use cordas 5–4–3–2 ou 4–3–2–1. A sétima pode ser maior (7), menor (♭7) ou diminuta (♭♭7), conforme a qualidade; a ordem numérica continua 1–5–7–3.',
        'Now the fifth sits directly above R; the third is the highest voice. Use strings 5–4–3–2 or 4–3–2–1. The seventh can be major (7), minor (♭7) or diminished (♭♭7), depending on quality; the numeric order stays 1–5–7–3.', <>{layoutPanel(2)}{layoutPanel(3)}</>),
      step('Ordem 1–3–5–7', 'Order 1–3–5–7',
        'Nas cordas 4–3–2–1, procure R–3–5–7. Compare com 1–5–7–3: R continua no baixo. As cordas 3 e 2 ficam a quatro semitons. Ao mover um desenho para as cordas mais agudas, a nota que cruza da 3ª para a 2ª vai uma casa acima; no sentido inverso, da 2ª para a 3ª, uma casa abaixo. Confira as notas ao trocar de grupo.',
        'On strings 4–3–2–1, find R–3–5–7. Compare with 1–5–7–3: R stays in the bass. Strings 3 and 2 are four semitones apart. Moving a shape toward higher strings, the note crossing from string 3 to string 2 moves one fret higher; in the reverse direction, from string 2 to string 3, one fret lower. Check the notes when changing sets.', <>{layoutPanel(4)}{layoutPanel(3)}</>),
      step('Localize terça e sétima', 'Find the third and seventh',
        `Em C7M, ${n('E')} (3) e ${n('B')} (7) são notas-guia. Em Cm7, são ${n('E', 'b')} (♭3) e ${n('B', 'b')} (♭7). Encontre esses graus em cada ordem. Ao mover uma formação sem cordas soltas, desloque todas as casas igualmente; a qualidade permanece.`,
        `In Cmaj7, ${n('E')} (3) and ${n('B')} (7) are guide tones. In Cm7, they are ${n('E', 'b')} (♭3) and ${n('B', 'b')} (♭7). Find these degrees in each order. To move a voicing with no open strings, shift all frets equally; its quality stays the same.`, <>{panel(cm)}{panel(chord('m7'))}</>),
      step('No seu instrumento', 'On your guitar',
        'Escolha uma formação de cada grupo. Toque R, terça, quinta e sétima separadamente e depois juntas. As casas ficam entre 0 e 12, com diferença máxima de cinco casas; isso não garante conforto para toda mão. Toque devagar, ajuste os dedos e abafe as cordas não usadas. Transponha uma formação fechada duas casas, sem ultrapassar a casa 12.',
        'Choose a voicing from each set. Play root, third, fifth and seventh separately, then together. Frets stay within 0–12 with a maximum five-fret span; this does not guarantee comfort for every hand. Play slowly, adjust fingering and mute unused strings. Transpose a closed voicing up two frets, staying below fret 13.', panel(cm)),
    ],
    'arpejos-tetrades': [
      step('Quatro notas, uma por vez', 'Four tones, one at a time',
        'Toque as quatro notas da tétrade sucessivamente. O arpejo de sétima maior sobe R–3–5–7–R; o último R repete a fundamental uma oitava acima. Ouça cada grau e diga o nome da nota correspondente.',
        'Play the four seventh-chord tones successively. A major-seventh arpeggio ascends R–3–5–7–R; the last R repeats the root an octave higher. Hear each degree and name its note.', panel(gArp, 0.3)),
      step('Compare as sétimas e a terça', 'Compare sevenths and thirds',
        'Compare G7M (R–3–5–7), G7 (R–3–5–♭7) e Gm7 (R–♭3–5–♭7). Primeiro muda a sétima, depois a terça. O arpejo conserva exatamente as notas do acorde, mesmo que você as toque em outra posição.',
        'Compare Gmaj7 (R–3–5–7), G7 (R–3–5–♭7) and Gm7 (R–♭3–5–♭7). First the seventh changes, then the third. An arpeggio retains the exact chord tones even when played in another position.', <>{panel(arp('dom7'), 0.3)}{panel(arp('m7'), 0.3)}</>),
      step('Três pontos de partida', 'Three starting strings',
        'Localize R nas cordas 6, 5 e 4 antes de começar. Os desenhos usam no máximo duas notas por corda, sem pular cordas, e uma região com diferença de quatro casas. Ao mover um desenho para cordas mais agudas, a nota que passa da 3ª para a 2ª vai uma casa acima; na volta, da 2ª para a 3ª, uma casa abaixo.',
        'Find R on strings 6, 5 and 4 before starting. Shapes use at most two notes per string, no skipped strings and a four-fret span. When moving a shape toward higher strings, the note crossing from string 3 to string 2 goes one fret higher; in reverse, from string 2 to string 3, one fret lower.', <>{panel(gArp, 0.3)}{panel(arp('maj7', 4, C), 0.3)}{panel(arp('maj7', 3), 0.3)}</>),
      step('Subida e descida com altura exata', 'Ascend and descend at the exact pitch',
        'Suba R–3–5–7–R. Desça R–7–5–3–R, começando na oitava aguda. Para completar uma sequência, encontre a próxima altura, não apenas o mesmo nome em outra oitava. O quiz aceita essa altura em qualquer corda disponível.',
        'Ascend R–3–5–7–R. Descend R–7–5–3–R, starting at the higher octave. To complete a sequence, find the next pitch rather than the same name in another octave. The quiz accepts that pitch on any available string.',
        <>{panel(gArp, 0.3)}<HearButton notes={[...gArp.shape].reverse().map(t => soundingMidi(t.position))} spacing={0.3} label={text('Ouvir descendo', 'Hear descending')} /></>),
      step('Outras qualidades e transposição', 'Other qualities and transposition',
        'O meio-diminuto usa R–♭3–♭5–♭7; o diminuto, R–♭3–♭5–♭♭7. Preserve a função da sétima mesmo quando ela soa como sexta. Sem cordas soltas, mover todas as notas duas casas acima transpõe um tom. A terça e a sétima conservam seus graus.',
        'Half-diminished uses R–♭3–♭5–♭7; diminished seventh uses R–♭3–♭5–♭♭7. Keep the seventh function even when it sounds like a sixth. With no open strings, shifting all notes up two frets transposes a whole step. Thirds and sevenths retain their degrees.',
        <>{panel(arp('m7b5', 4, B), 0.3)}{panel(arp('dim7', 4, B), 0.3)}</>),
      step('No seu instrumento', 'On your guitar',
        'Toque G7M, G7 e Gm7 subindo e descendo em pulsos iguais. Abafe a nota anterior. Diga nomes e graus e depois mova um desenho fechado para outra fundamental. Crie uma frase de quatro notas que termine na terça ou na sétima do acorde.',
        'Play Gmaj7, G7 and Gm7 up and down with even pulses. Mute the previous note. Say names and degrees, then move a closed shape to another root. Create a four-note phrase landing on the third or seventh of the chord.', panel(arp('m7'), 0.3)),
    ],
    'tetrades-aplicacao': [
      step('Campo harmônico em tétrades', 'Harmonized major scale in sevenths',
        'Empilhe quatro notas alternadas da escala maior, separadas por terças. O campo harmônico resulta em 7M, m7, m7, 7M, 7, m7, m7(♭5). Todos os acordes usam apenas notas da tonalidade. O sétimo grau é meio-diminuto, com ♭7, e não diminuto com ♭♭7.',
        'Stack four alternate major-scale notes in thirds. The harmonized scale gives maj7, m7, m7, maj7, 7, m7, m7♭5. Every chord uses only notes of the key. Degree seven is half-diminished with ♭7, rather than diminished seventh with ♭♭7.', <>{progression(C, [1, 2, 3, 4, 5, 6, 7])}{panel(cm)}</>),
      step('Graus nas duas convenções', 'Degrees in both conventions',
        'PT: I7M, IIm7, IIIm7, IV7M, V7, VIm7, VIIm7(♭5). EN: Imaj7, iim7, iiim7, IVmaj7, V7, vim7, viim7♭5. As minúsculas indicam acordes menores na convenção americana. As notas e as funções não mudam.',
        'PT: I7M, IIm7, IIIm7, IV7M, V7, VIm7, VIIm7(♭5). EN: Imaj7, iim7, iiim7, IVmaj7, V7, vim7, viim7♭5. Lowercase denotes minor chords in the American convention. Notes and functions stay the same.', <>{progression(G, [1, 2, 3, 4, 5, 6, 7])}{panel(chord('m7b5', B))}</>),
      step('A progressão ii–V–I', 'The ii–V–I progression',
        `Em ${n('C')} maior: Dm7–G7–C7M. Transponha pelos graus: em ${n('G')} maior, Am7–D7–G7M; em ${n('F')} maior, Gm7–C7–F7M. Preserve as qualidades m7–7–7M. Toque um acorde por compasso.`,
        `In ${n('C')} major: Dm7–G7–Cmaj7. Transpose by degree: in ${n('G')} major, Am7–D7–Gmaj7; in ${n('F')} major, Gm7–C7–Fmaj7. Keep the qualities m7–7–maj7. Play one chord per measure.`, <>{progression(C)}{progression(G)}{progression({ letter: 'F', accidental: '' })}</>),
      step('Notas-guia e resolução', 'Guide tones and resolution',
        `Terças e sétimas são notas-guia. Em Dm7 → G7, a sétima ${n('C')} (♭7) desce um semitom para ${n('B')} (3). Em G7 → C7M, ${n('F')} (♭7) desce para ${n('E')} (3). Esses pequenos movimentos fazem a condução de vozes; siga uma voz, mesmo que os outros dedos mudem mais.`,
        `Thirds and sevenths are guide tones. In Dm7 → G7, the seventh ${n('C')} (♭7) falls one semitone to ${n('B')} (3). In G7 → Cmaj7, ${n('F')} (♭7) falls to ${n('E')} (3). These small movements create voice leading; follow one voice even if other fingers move further.`, <>{panel(chord('m7', { letter: 'D', accidental: '' }))}{panel(chord('dom7', G))}{panel(cm)}</>),
      step('Notas-alvo no solo', 'Target tones in a solo',
        `Sobre Dm7, use ${n('D')} (R), ${n('F')} (♭3), ${n('A')} (5), ${n('C')} (♭7). Ao chegar a G7, mire ${n('B')} (3); na chegada a C7M, mire ${n('E')} (3). Resolva no registro mais próximo. Uma nota-alvo pode ser qualquer nota do acorde seguinte; terça e sétima deixam sua cor clara.`,
        `Over Dm7, use ${n('D')} (R), ${n('F')} (♭3), ${n('A')} (5), ${n('C')} (♭7). As G7 arrives, target ${n('B')} (3); as Cmaj7 arrives, target ${n('E')} (3). Resolve in the nearest register. Any tone of the next chord can be a target; thirds and sevenths make its color clear.`, panel(cm)),
      step('No seu instrumento', 'On your guitar',
        'Toque ii–V–I em três tonalidades. Alterne um compasso de formação e um de arpejo, terminando uma frase na terça do próximo acorde. Cante a resolução da sétima e confira no braço. Os desenhos mostram acordes completos; a voz-guia pode precisar de outra posição para permanecer próxima.',
        'Play ii–V–I in three keys. Alternate a measure of voicings and a measure of arpeggios, landing a phrase on the next chord’s third. Sing the seventh resolution and find it on the neck. Diagrams show complete chords; the guide voice may need another position to stay nearby.', <>{progression(C)}{progression(G)}{panel(cm)}</>),
    ],
  };
  return <LessonShell title={t(`games.${id}`)} steps={lessons[id]} onExit={onExit} onPractice={onPractice} />;
}
