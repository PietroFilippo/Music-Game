import type { ReactNode } from 'react';
import { Fretboard } from '../components/Fretboard';
import { HearButton } from '../components/HearButton';
import { LessonShell, type LessonStep } from '../components/LessonShell';
import { StaffDiagram } from '../components/StaffDiagram';
import { createCopy } from '../games/fretboard/model';
import { beginnerArpeggios } from '../games/module-three/arpeggios';
import { describeChord, positionsOf, shapeBoard, STRING_SETS, type TriadExample } from '../games/module-three/common';
import type { ModuleThreeId } from '../games/module-three/questions';
import { useI18n } from '../hooks/useI18n';
import { closeVoicings, voiceLeadingDistance } from '../music/chord-shapes';
import { chordNotes, chordSymbol, TRIAD_QUALITIES, TRIADS, type TriadQuality } from '../music/chords';
import { soundingMidi, writtenVexKey, type FretPosition } from '../music/guitar';
import { majorTriads, MAJOR_ROMANS } from '../music/harmony';
import type { SpelledNote } from '../music/notes';
import { useSettings } from '../SettingsContext';
import type { LessonProps } from './index';

const C: SpelledNote = { letter: 'C', accidental: '' };
const G: SpelledNote = { letter: 'G', accidental: '' };
const F: SpelledNote = { letter: 'F', accidental: '' };

export function ModuleThreeLesson({ id, onExit, onPractice }: LessonProps & { id: ModuleThreeId }) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const c = createCopy(lang, settings.notation);
  const { text } = c;
  const step = (ptTitle: string, enTitle: string, pt: string, en: string, visual: ReactNode): LessonStep => ({
    title: text(ptTitle, enTitle),
    body: <><p className="lesson-copy">{text(pt, en)}</p><div className="lesson-visual">{visual}</div></>,
  });
  const voicing = (root: SpelledNote, quality: TriadQuality, inversion = 0, strings: readonly number[] = STRING_SETS[0]): TriadExample => ({
    root, quality, shape: closeVoicings(root, TRIADS[quality], strings).find(s => s[0].toneIndex === inversion)!,
  });
  const arpeggio = (root: SpelledNote, position: FretPosition, quality: 'major' | 'minor'): TriadExample => ({
    root, quality, shape: beginnerArpeggios(position, quality)[0],
  });
  const panel = (e: TriadExample, spacing = 0.03, heading?: string) => <div className="reference-card">
    {heading && <strong>{heading}</strong>}
    <p className="lesson-copy">{describeChord(c, e)}</p>
    <Fretboard frets={12} {...shapeBoard(e.shape)} />
    <HearButton notes={e.shape.map(s => soundingMidi(s.position))} spacing={spacing} />
  </div>;
  const cm = voicing(C, 'major');
  const gArp = arpeggio(G, { string: 5, fret: 3 }, 'major');
  const gMinor = arpeggio(G, { string: 5, fret: 3 }, 'minor');
  const moved = arpeggio({ letter: 'A', accidental: '' }, { string: 5, fret: 5 }, 'major');
  const cf = closeVoicings(F, TRIADS.major, STRING_SETS[0]).sort((a, b) =>
    voiceLeadingDistance(positionsOf(cm.shape), positionsOf(a)) - voiceLeadingDistance(positionsOf(cm.shape), positionsOf(b)))[0];
  const nearF: TriadExample = { root: F, quality: 'major', shape: cf };
  const progression = (key: SpelledNote, degrees: number[]) => {
    const chords = majorTriads(key);
    return <div className="note-sequence">{degrees.map(n => `${MAJOR_ROMANS[lang][n - 1]} = ${chordSymbol(chords[n - 1].root, TRIADS[chords[n - 1].quality], lang)}`).join(' → ')}</div>;
  };
  const lessons: Record<ModuleThreeId, LessonStep[]> = {
    triades: [
      step('Fundamental, terça e quinta', 'Root, third and fifth',
        `Uma tríade reúne três notas diferentes: fundamental (R), terça e quinta. Na tríade maior de ${c.spelled(C)}, são ${chordNotes(C, TRIADS.major)!.map(c.spelled).join(', ')}. R–3–5 ficam a 0, 4 e 7 semitons da fundamental. Toque juntas para ouvir um acorde.`,
        `A triad contains three different notes: root (R), third and fifth. In the ${c.spelled(C)} major triad they are ${chordNotes(C, TRIADS.major)!.map(c.spelled).join(', ')}. R–3–5 are 0, 4 and 7 semitones above the root. Play them together to hear a chord.`, panel(cm)),
      step('Maior e menor: mude a terça', 'Major and minor: change the third',
        `Abaixe a terça maior um semitom: ${c.spelled({ letter: 'E', accidental: '' })} vira ${c.spelled({ letter: 'E', accidental: 'b' })}. R e 5 continuam iguais. A tríade menor é R–♭3–5: 0, 3 e 7 semitons. A cifra Cm usa letras, mesmo quando os nomes das notas aparecem em solfejo.`,
        `Lower the major third one semitone: ${c.spelled({ letter: 'E', accidental: '' })} becomes ${c.spelled({ letter: 'E', accidental: 'b' })}. R and 5 stay the same. The minor triad is R–♭3–5: 0, 3 and 7 semitones. The symbol Cm uses letters even when note names are shown in solfege.`,
        <>{panel(cm)}{panel(voicing(C, 'minor'))}</>),
      step('Diminuta: abaixe a quinta', 'Diminished: lower the fifth',
        'A partir da tríade menor, abaixe a quinta um semitom. A diminuta é R–♭3–♭5: 0, 3 e 6 semitons. Cm(♭5) e Cdim indicam esta tríade; em inglês, C° também. Em cifras brasileiras, ° costuma indicar um acorde diminuto de quatro notas: confira o contexto.',
        'Starting with the minor triad, lower the fifth one semitone. Diminished is R–♭3–♭5: 0, 3 and 6 semitones. Cm(♭5), Cdim and the English C° denote this triad. In Brazilian charts, ° usually means a four-note diminished chord: check the context.', panel(voicing(C, 'diminished'))),
      step('Aumentada: suba a quinta', 'Augmented: raise the fifth',
        `A partir da tríade maior, suba a quinta um semitom: ${c.spelled({ letter: 'G', accidental: '' })} vira ${c.spelled({ letter: 'G', accidental: '#' })}. Aumentada é R–3–♯5: 0, 4 e 8 semitons. C(♯5), C+, Caum e Caug representam a mesma tríade. Preserve as letras da terça e da quinta ao escrever as notas.`,
        `Starting with the major triad, raise the fifth one semitone: ${c.spelled({ letter: 'G', accidental: '' })} becomes ${c.spelled({ letter: 'G', accidental: '#' })}. Augmented is R–3–♯5: 0, 4 and 8 semitones. C(♯5), C+, Caum and Caug represent the same triad. Preserve the third and fifth letter names when spelling the notes.`, panel(voicing(C, 'augmented'))),
      step('Ouça, leia e compare', 'Listen, read and compare',
        'Compare as quatro qualidades. A fundamental fica igual; observe qual terça e qual quinta mudam. Na pauta da guitarra, as notas são escritas uma oitava acima do som real. Os botões tocam a altura real.',
        'Compare all four qualities. The root stays the same; notice which third and fifth change. Guitar staff notes are written one octave above their sounding pitch. The buttons play the actual sounding pitches.',
        <>{TRIAD_QUALITIES.map(q => <div key={q}>{panel(voicing(C, q), 0.03, TRIADS[q].name[lang])}</div>)}
          <StaffDiagram clef="treble" width={320} height={170} notes={cm.shape.map(s => ({ vexKey: writtenVexKey(s.position), label: s.degree }))} /></>),
      step('No seu instrumento', 'On your guitar',
        'Toque C e Cm lentamente, dizendo os nomes e os graus. Depois compare Cm com Cm(♭5), e C com C(♯5). Abafe as cordas fora do grupo marcado. Toque cada nota separadamente para conferir a terça e a quinta antes de tocar o acorde inteiro.',
        'Play C and Cm slowly, saying the notes and degrees. Then compare Cm with C°, and C with C+. Mute strings outside the marked set. Play each note separately to check the third and fifth before playing the whole chord.', panel(cm)),
    ],
    'inversoes-triades': [
      step('O baixo determina a inversão', 'The bass determines the inversion',
        'Baixo é a nota mais grave que soa. Se a fundamental está no baixo, temos posição fundamental. A ordem das notas mais agudas pode mudar sem mudar a inversão. Neste desenho, o baixo está marcado com R.',
        'The bass is the lowest sounding note. With the root in the bass, the chord is in root position. Rearranging higher notes can leave the inversion unchanged. In this shape, the bass is marked R.', panel(cm)),
      step('Terça e quinta no baixo', 'Third and fifth in the bass',
        'Terça no baixo: 1ª inversão. Quinta no baixo: 2ª inversão. As três notas continuam pertencendo ao mesmo acorde. Estes desenhos são fechados: cada nota aparece uma vez e todas cabem em menos de uma oitava.',
        'Third in the bass: 1st inversion. Fifth in the bass: 2nd inversion. All three notes still belong to the same chord. These voicings are close position: each tone occurs once and all voices fit within an octave.',
        <>{panel(voicing(C, 'major', 1), 0.03, text('1ª inversão', '1st inversion'))}{panel(voicing(C, 'major', 2), 0.03, text('2ª inversão', '2nd inversion'))}</>),
      step('Quatro grupos de cordas', 'Four string sets',
        'Use os grupos 1–2–3, 2–3–4, 3–4–5 e 4–5–6. Toque apenas as três cordas marcadas. Aqui, cada grupo mostra C em posição fundamental; compare as casas, sem perder R–3–5.',
        'Use sets 1–2–3, 2–3–4, 3–4–5 and 4–5–6. Play only the three marked strings. Here each set shows C in root position; compare the frets while keeping track of R–3–5.',
        <>{STRING_SETS.map(strings => <div key={strings[0]}>{panel(voicing(C, 'major', 0, strings), 0.03, text(`Cordas ${strings.map(s => s + 1).join('–')}`, `Strings ${strings.map(s => s + 1).join('–')}`))}</div>)}</>),
      step('A diferença entre a 3ª e a 2ª corda', 'The offset between strings 3 and 2',
        'As cordas vizinhas ficam a 5 semitons, exceto da 3ª para a 2ª: são 4. Ao mover um desenho em direção às cordas agudas, a nota que passa da 3ª para a 2ª corda avança uma casa; no sentido inverso, recua uma casa. Não copie as casas sem conferir as notas.',
        'Adjacent strings are 5 semitones apart, except strings 3 and 2: they are 4 apart. When moving a shape toward the higher strings, the note that crosses from string 3 to string 2 moves one fret higher; in the other direction, it moves one fret lower. Check the notes instead of copying frets blindly.',
        <>{panel(voicing(C, 'major', 0, STRING_SETS[2]))}{panel(voicing(C, 'major', 0, STRING_SETS[1]))}</>),
      step('Menor também tem três posições', 'Minor has three positions too',
        'Na tríade menor, os graus são R–♭3–5. A regra do baixo continua: R = posição fundamental, ♭3 = 1ª inversão, 5 = 2ª inversão. Identifique a fundamental mesmo quando ela não é a nota mais grave.',
        'In a minor triad the degrees are R–♭3–5. The bass rule stays the same: R = root position, ♭3 = 1st inversion, 5 = 2nd inversion. Find the root even when it is not the lowest note.',
        <>{[0, 1, 2].map(i => <div key={i}>{panel(voicing(G, 'minor', i))}</div>)}</>),
      step('No seu instrumento', 'On your guitar',
        'No grupo 1–2–3, toque as três posições de G e depois de Gm. Diga o grau do baixo e encontre R em cada uma. Repita no grupo 2–3–4. Abafe as outras cordas e deixe cada nota soar limpa antes de acelerar.',
        'On strings 1–2–3, play the three positions of G, then Gm. Say the bass degree and find R in each shape. Repeat on strings 2–3–4. Mute other strings and let each note sound cleanly before speeding up.', panel(voicing(G, 'major'))),
    ],
    'arpejos-triades': [
      step('O acorde, uma nota por vez', 'The chord, one note at a time',
        'Arpejo é tocar as notas do acorde sucessivamente. O arpejo maior sobe R–3–5–R; o último R é a oitava da fundamental. Ouça o acorde e depois as mesmas notas separadas.',
        'An arpeggio plays chord tones successively. A major arpeggio ascends R–3–5–R; the last R is the root an octave higher. Hear the chord, then the same notes separately.',
        <>{panel(gArp, 0.3)}<HearButton notes={gArp.shape.slice(0, 3).map(s => soundingMidi(s.position))} spacing={0.03} label={text('Ouvir como acorde', 'Hear as a chord')} /></>),
      step('Maior e menor', 'Major and minor',
        'Para o arpejo menor, abaixe apenas a terça: R–♭3–5–R. Diga os nomes das notas e compare o som. Os desenhos usam no máximo duas notas por corda, dentro de uma região de quatro casas de diferença.',
        'For a minor arpeggio, lower only the third: R–♭3–5–R. Say the note names and compare the sound. The shapes use at most two notes per string, within a region spanning four frets.',
        <>{panel(gArp, 0.3)}{panel(gMinor, 0.3)}</>),
      step('Fundamentais nas cordas 6, 5 e 4', 'Roots on strings 6, 5 and 4',
        'Localize primeiro R na corda grave do desenho. Aqui há exemplos com fundamental nas cordas 6, 5 e 4. O mapa muda ao cruzar da 3ª para a 2ª corda. Em cada exemplo, confira a terça, a quinta e a oitava.',
        'First locate R on the lowest string of the shape. These examples have roots on strings 6, 5 and 4. The map changes when crossing strings 3 and 2. Check the third, fifth and octave in each example.',
        <>{panel(gArp, 0.3)}{panel(arpeggio(C, { string: 4, fret: 3 }, 'major'), 0.3)}{panel(arpeggio(G, { string: 3, fret: 5 }, 'major'), 0.3)}</>),
      step('Suba e desça', 'Ascend and descend',
        'Subindo: R–3–5–R. Descendo: R–5–3–R. Na descida, comece no R mais agudo. A próxima nota é o próximo som do arpejo naquela direção, não qualquer nota do acorde em qualquer oitava.',
        'Ascending: R–3–5–R. Descending: R–5–3–R. On the way down, start at the higher R. The next note is the next arpeggio pitch in that direction, rather than a chord tone in any octave.',
        <>{panel(gArp, 0.3)}<HearButton notes={[...gArp.shape].reverse().map(s => soundingMidi(s.position))} spacing={0.3} label={text('Ouvir descendo', 'Hear descending')} /></>),
      step('Mova para outra fundamental', 'Move to another root',
        `Se não há cordas soltas, mova todas as notas o mesmo número de casas. Duas casas acima de ${c.spelled(G)} temos ${c.spelled({ letter: 'A', accidental: '' })}: os graus e a qualidade permanecem. Ao trocar o grupo de cordas, confira novamente a afinação.`,
        `With no open strings, move every note by the same number of frets. Two frets above ${c.spelled(G)} is ${c.spelled({ letter: 'A', accidental: '' })}: the degrees and quality stay the same. When changing string sets, check the tuning again.`,
        <>{panel(gArp, 0.3)}{panel(moved, 0.3)}</>),
      step('No seu instrumento', 'On your guitar',
        'Toque cada exemplo maior subindo e descendo, em pulsos lentos e iguais. Abafe a nota anterior para ouvir uma nota por vez. Repita com a terça menor e mova um desenho fechado duas casas. Termine uma frase curta em R, terça ou quinta.',
        'Play each major example up and down with slow, even pulses. Mute the previous note to hear one note at a time. Repeat with the minor third and move a closed shape up two frets. End a short phrase on R, the third or the fifth.', panel(gMinor, 0.3)),
    ],
    'triades-progressoes': [
      step('Campo harmônico maior', 'Harmonized major scale',
        'Empilhe uma terça e outra terça usando apenas notas da escala maior. Os sete acordes resultam em maior, menor, menor, maior, maior, menor e diminuto. Cada cifra corresponde a um grau da tonalidade.',
        'Stack a third and another third using only notes of the major scale. The seven chords are major, minor, minor, major, major, minor and diminished. Each symbol corresponds to a degree of the key.',
        <>{progression(C, [1, 2, 3, 4, 5, 6, 7])}{panel(cm)}</>),
      step('Graus nas duas convenções', 'Degrees in both conventions',
        'Na prática brasileira: I, IIm, IIIm, IV, V, VIm, VIIm(♭5). Em inglês: I, ii, iii, IV, V, vi, vii°. As minúsculas indicam menor; ° indica a tríade diminuta neste campo harmônico. As notas são as mesmas nas duas convenções.',
        'Brazilian practice writes I, IIm, IIIm, IV, V, VIm, VIIm(♭5). English writes I, ii, iii, IV, V, vi, vii°. Lowercase means minor; ° means the diminished triad in this harmonized scale. Both conventions use the same notes.',
        <>{progression(C, [1, 2, 3, 4, 5, 6, 7])}{panel(voicing({ letter: 'B', accidental: '' }, 'diminished'))}</>),
      step('Três progressões comuns', 'Three common progressions',
        `Experimente I–IV–V, I–V–VIm–IV e IIm–V–I. Em ${c.spelled(C)} maior, são C–F–G, C–G–Am–F e Dm–G–C. Toque um acorde por compasso; para uma frase solo, use as notas da tríade que está soando.`,
        `Try I–IV–V, I–V–vi–IV and ii–V–I. In ${c.spelled(C)} major these are C–F–G, C–G–Am–F and Dm–G–C. Play one chord per measure; for a lead phrase, use tones of the triad currently sounding.`,
        <>{progression(C, [1, 4, 5])}{progression(C, [1, 5, 6, 4])}{progression(C, [2, 5, 1])}</>),
      step('Transponha pelos graus', 'Transpose by degree',
        `Guarde os graus, não apenas as cifras. I–IV–V em ${c.spelled(C)} maior é C–F–G; em ${c.spelled(G)} maior passa a G–C–D. I–V–VIm–IV vira G–D–Em–C. A nova tonalidade muda as fundamentais, mas conserva a qualidade de cada grau.`,
        `Remember the degrees as well as the symbols. I–IV–V in ${c.spelled(C)} major is C–F–G; in ${c.spelled(G)} major it becomes G–C–D. I–V–vi–IV becomes G–D–Em–C. The new key changes the roots while preserving each degree’s quality.`,
        <>{progression(G, [1, 4, 5])}{progression(G, [1, 5, 6, 4])}{progression(G, [2, 5, 1])}</>),
      step('Ligue vozes próximas', 'Connect nearby voices',
        `De C para F, mantenha ${c.spelled(C)} na mesma altura; as outras vozes sobem um e dois semitons. Escolher uma inversão próxima evita saltos grandes. Compare cada voz do grave ao agudo; uma nota em comum pode ficar parada, e as outras podem andar por grau conjunto.`,
        `From C to F, keep ${c.spelled(C)} at the same pitch; the other voices rise one and two semitones. A nearby inversion avoids large leaps. Compare each voice from low to high; a common tone can stay still while the others move stepwise.`,
        <>{panel(cm)}{panel(nearF)}</>),
      step('No seu instrumento', 'On your guitar',
        `Toque C–F–G e Dm–G–C num único grupo de cordas. Procure inversões próximas, diga os graus e preserve notas em comum quando possível. Depois transponha para ${c.spelled(G)} maior. Alterne um compasso de acorde com um de arpejo, terminando em uma nota da próxima tríade.`,
        `Play C–F–G and Dm–G–C on one string set. Find nearby inversions, name the degrees and preserve common tones where possible. Then transpose to ${c.spelled(G)} major. Alternate a measure of chords with a measure of arpeggios, landing on a tone of the next triad.`,
        <>{progression(C, [2, 5, 1])}{progression(G, [2, 5, 1])}</>),
    ],
  };
  return <LessonShell title={t(`games.${id}`)} steps={lessons[id]} onExit={onExit} onPractice={onPractice} />;
}
