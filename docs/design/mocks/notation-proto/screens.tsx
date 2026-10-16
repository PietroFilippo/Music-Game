// The Direction A screens that contain notation, rebuilt with the real
// Fretboard and the prototype notation components. Query parameters select
// the screen, the notation theme and the language.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Fretboard, type FretMarker } from '/src/components/Fretboard';
import { useI18n } from '/src/hooks/useI18n';
import { useSettings } from '/src/SettingsContext';
import { READING_MEASURES } from '/src/games/module-two/reading';
import { noteLabel, shortNoteLabel, type LetterNote } from '/src/music/notes';
import { beatLabel } from '/src/music/rhythm';
import { OPEN_STRING_LETTERS } from '/src/music/guitar';
import {
  GuitarTab, Keyboard, MeasureNotation, PositionNotation, RestDemo, Staff, StaffDiagram, type DiagramNote, type Theme,
} from './notation';

export interface ScreenOpts {
  theme: Theme;
  answered: boolean;
  step: string;
  desktop: boolean;
}

const ICONS: Record<string, string> = {
  back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  sound: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5.5a9 9 0 0 1 0 13"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  cross: '<path d="M18 6L6 18M6 6l12 12"/>',
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
};
const Icon = ({ name, size = 20 }: { name: string; size?: number }) => (
  <svg className="ic" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
);

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const Top = ({ title, right }: { title: string; right?: ReactNode }) => (
  <header className="top">
    <span className="ibtn"><Icon name="back" /></span>
    <h1>{title}</h1>
    {right ?? <><span className="ibtn"><Icon name="sound" /></span><span className="ibtn"><Icon name="settings" /></span></>}
  </header>
);

const Progress = ({ round, history, timed = false }: { round: number; history: boolean[]; timed?: boolean }) => (
  <div className="progress">
    <div className="segs" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => <span key={i} className={i < history.length ? (history[i] ? 'ok' : 'bad') : i === round - 1 ? 'cur' : ''} />)}
    </div>
    <span className="round">Round {round} of 10</span>
    <span className="pill pill-ok"><Icon name="check" size={16} />{history.filter(Boolean).length}</span>
    <span className="pill pill-bad"><Icon name="cross" size={16} />{history.filter(h => !h).length}</span>
    {timed && <span className="readout" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', position: 'relative' }}>
      <svg viewBox="0 0 40 40" width="40" height="40" style={{ position: 'absolute', inset: 0 }}><circle cx="20" cy="20" r="16" fill="none" stroke="var(--line-strong)" strokeWidth="3" /><circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * 0.38} transform="rotate(-90 20 20)" /></svg>5
    </span>}
  </div>
);

const Listen = ({ label }: { label: string }) => <span className="hear"><Icon name="play" size={16} />{label}</span>;

/** The notation pair width: the A spec's 220 / 180 / 156 for the paper card; without card
 *  chrome the ink drawing can take 260 / 200 / 156 in the same column. */
const pairWidth = (vw: number, theme: Theme) => (theme === 'paper' || theme === 'quiet'
  ? (vw >= 1600 ? 220 : vw >= 1200 ? 180 : 156)
  : (vw >= 1600 ? 260 : vw >= 1200 ? 200 : 156));

/* ----------------------------------------------------- quiz: fretboard tap */
export function FeedbackScreen({ theme, desktop }: ScreenOpts) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const vw = window.innerWidth;
  const pt = lang === 'pt';
  const route: [LetterNote, number][] = [['E', 0], ['F', 1], ['G', 3], ['A', 5], ['B', 7], ['C', 8], ['D', 10]];
  const markers: FretMarker[] = [
    ...route.map(([l, f]): FretMarker => ({ string: 5, fret: f, label: shortNoteLabel(l, settings.notation, lang), tone: f === 10 ? 'accent' : 'plain' })),
    { string: 5, fret: 9, label: '✗', tone: 'wrong' },
  ];
  const board = <Fretboard markers={markers} highlightStrings={[5]} showFretNumbers stringLabels="name" onSelect={() => {}} disabled />;
  const captions: [string, string] = [t('common.tab'), t('notation.written')];
  const prompt = pt ? 'Encontre Ré na 6ª corda (casas 0 a 12).' : 'Find D on string 6 (frets 0–12).';
  const explanation = pt
    ? 'Ré na 6ª corda: casa 10. Conte a partir da corda solta: Mi (0) → Fá (1) → Sol (3) → Lá (5) → Si (7) → Dó (8) → Ré (10). Mi–Fá e Si–Dó ficam a uma casa; as outras notas naturais vizinhas ficam a duas casas.'
    : 'D on string 6: fret 10. Count up from the open string: E (0) → F (1) → G (3) → A (5) → B (7) → C (8) → D (10). E–F and B–C are one fret apart; other neighboring natural notes are two frets apart.';
  const names = OPEN_STRING_LETTERS.map(l => shortNoteLabel(l, settings.notation, lang));
  const feedback = (
    <>
      <div className="verdict verdict-bad"><Icon name="cross" size={22} />{pt ? 'Vamos revisar' : 'Let’s review'}</div>
      <p style={{ fontWeight: 600 }}>{t('quiz.answerWas', { answer: pt ? 'Corda 6, casa 10' : 'String 6, fret 10' })}</p>
      <p className="explain">{explanation}</p>
      <div><Listen label={pt ? 'Ouvir' : 'Listen'} /></div>
      <PositionNotation theme={theme} position={{ string: 5, fret: 10 }} width={pairWidth(vw, theme)} captions={captions} stringNames={names} />
    </>
  );
  const cont = <span className="btn btn-primary btn-block">{t('common.continue')}{desktop && <span style={{ marginLeft: 'auto', opacity: .7, fontSize: 13, fontWeight: 500 }}>Enter ↵</span>}</span>;
  if (desktop) {
    return (
      <div className="page">
        <Top title={t('games.notas-braco')} />
        <Progress round={1} history={[]} />
        <div className="stage">
          <div className="vis" style={{ maxWidth: 1160, margin: '0 auto', width: '100%' }}>{board}</div>
          <div className="col">
            <div className="prompt">{prompt}</div>
            {feedback}
            <div className="grow" />
            {cont}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <Top title={t('games.notas-braco')} />
      <Progress round={2} history={[true]} />
      <main className="main" style={{ gap: 12 }}>
        <div className="prompt" style={{ textAlign: 'center', fontSize: 'var(--t1)' }}>{prompt}</div>
        {board}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{feedback}</div>
      </main>
      {/* sticky at the viewport bottom in the app; static here so the full-page capture shows the flow */}
      <div className="stickybar" style={{ position: 'static' }}>{cont}</div>
    </div>
  );
}

/* ------------------------------------------- quiz: multiple choice, staff */
export function McScreen({ theme, answered, desktop }: ScreenOpts) {
  const { t } = useI18n();
  const [vis, visW] = useWidth<HTMLDivElement>();
  const choices = ['B', 'D', 'G', 'F'];
  const scale = visW ? Math.min(720, visW * 0.7) / 280 : 1;
  const answers = (
    <div className={`answers ${desktop ? 'col' : ''}`}>
      {choices.map((c, i) => (
        <span key={c} className={`answer ${answered ? (c === 'B' ? 'ok' : 'dim') : i === 1 ? 'hover' : ''}`}>
          <span className="lbl">{c}</span>{desktop && <span className="kbd">{i + 1}</span>}
        </span>
      ))}
    </div>
  );
  const staff = <Staff theme={theme} noteVexKey="b/4" width={280} height={140} scale={desktop ? scale : 1.2} />;
  if (desktop) {
    return (
      <div className="page">
        <Top title={t('games.nome-notas')} />
        <Progress round={5} history={[true, true, false, true]} timed />
        <div className="stage">
          <div className="vis" ref={vis}>{staff}</div>
          <div className="col">
            <div className="prompt">Name this note in treble clef.</div>
            {answers}
            {answered ? (
              <>
                <div className="verdict verdict-ok"><Icon name="check" size={22} />Correct!</div>
                <p className="explain">B is on line 3, counting from the bottom.</p>
                <div className="grow" />
                <span className="btn btn-primary btn-block">Continue<span style={{ marginLeft: 'auto', opacity: .7, fontSize: 13, fontWeight: 500 }}>auto · 0.9 s</span></span>
              </>
            ) : (
              <>
                <div className="grow" />
                <p className="small muted">Press 1–4 to answer.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <Top title={t('games.nome-notas')} />
      <Progress round={5} history={[true, true, false, true]} timed />
      <main className="main" style={{ gap: 14, alignItems: 'center', textAlign: 'center' }}>
        <div className="prompt" style={{ fontSize: 'var(--t1)' }}>Name this note in treble clef.</div>
        {staff}
        <div style={{ width: '100%' }}>{answers}</div>
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------- lessons */
function Lesson({ title, steps, current, heading, copy, visual, desktop }: {
  title: string; steps: string[]; current: number; heading: string; copy: string; visual: ReactNode; desktop: boolean;
}) {
  const { t } = useI18n();
  const nav = (
    <div className="actions" style={{ marginTop: 'auto', paddingTop: 'var(--s4)' }}>
      <span className="btn btn-secondary" style={{ flex: '0 0 auto' }}><Icon name="chevronLeft" />{t('lesson.prev')}</span>
      <span className="btn btn-primary">{t('lesson.next')}<Icon name="chevronRight" /></span>
    </div>
  );
  if (desktop) {
    return (
      <div className="page">
        <Top title={title} right={<span className="chip">{current} / {steps.length}</span>} />
        <div className="lesson">
          <div className="text">
            <ol className="steps">
              {steps.map((s, i) => <li key={s} className={i + 1 < current ? 'done' : i + 1 === current ? 'cur' : ''}><i>{i + 1 < current ? '✓' : i + 1}</i>{s}</li>)}
            </ol>
            <h2 style={{ fontSize: 'var(--t3)', marginBottom: 12 }}>{heading}</h2>
            <p className="copy">{copy}</p>
            {nav}
          </div>
          <div className="vispanel">{visual}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <Top title={title} right={<span className="chip">{current} / {steps.length}</span>} />
      <main className="main" style={{ textAlign: 'center', gap: 12, alignItems: 'center' }}>
        <div className="label">Step {current} of {steps.length}</div>
        <h2 style={{ fontSize: 'var(--t3)' }}>{heading}</h2>
        <p className="copy" style={{ margin: '0 auto' }}>{copy}</p>
        {visual}
      </main>
    </div>
  );
}

/** Scale a diagram drawn at `base` px to the panel, capped. */
function usePanelScale(base: number, cap: number) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const scale = w ? Math.min(cap, Math.max(1, (w - 48) / base)) : 1;
  return [ref, scale] as const;
}

export function LessonTrebleScreen({ theme, step, desktop }: ScreenOpts) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const labelFor = (l: LetterNote) => noteLabel(l, settings.notation, lang);
  const steps = ['The treble clef anchors G', 'A: the neighbor above', 'B: one more step', 'The three together', 'On the guitar', 'How to play'];
  const gab = (hl: LetterNote[]): DiagramNote[] => [
    { vexKey: 'g/4', label: labelFor('G'), highlight: hl.includes('G') },
    { vexKey: 'a/4', label: labelFor('A'), highlight: hl.includes('A') },
    { vexKey: 'b/4', label: labelFor('B'), highlight: hl.includes('B') },
  ];
  const [ref, scale] = usePanelScale(340, 2.2);
  const four = step === 'four';
  const visual = (
    <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <StaffDiagram theme={theme} clef="treble" width={340} height={175} scale={desktop ? scale : 1}
        notes={four ? gab(['G', 'A', 'B']) : gab(['B'])} numberLines numberSpaces={four} />
    </div>
  );
  return <Lesson desktop={desktop} title={t('games.clave-sol')} steps={steps} current={four ? 4 : 3}
    heading={four ? 'The three together' : 'B: one more step'}
    copy={four
      ? 'G (sol) on line 2 — the line the clef curls around. A (la) in the 2nd space. B (ti) on line 3, right in the middle of the staff. When in doubt, count from G.'
      : 'One more position up, on line 3, sits B (ti). G on a line, A in a space, B on the next line: line, space, line.'}
    visual={visual} />;
}

export function LessonClefsScreen({ theme, step, desktop }: ScreenOpts) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const steps = ['Why clefs exist', 'The treble clef (G clef)', 'The bass clef (F clef)', 'The alto clef (C clef)', 'What about the guitar?', 'How to play'];
  const [ref, scale] = usePanelScale(560, 1.9);
  if (step === 'bass') {
    const visual = (
      <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <StaffDiagram theme={theme} clef="bass" width={320} height={175} scale={desktop ? Math.min(scale, 2.2) : 1}
          notes={[{ vexKey: 'f/3', label: noteLabel('F', settings.notation, lang), highlight: true }]} numberLines />
      </div>
    );
    return <Lesson desktop={desktop} title={t('games.claves')} steps={steps} current={3} heading="The bass clef (F clef)"
      copy="The bass clef is used for low instruments. Its two dots sit around line 4 and name it F (fa). Bass guitar and the left hand of the piano read this clef."
      visual={visual} />;
  }
  const visual = (
    <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14 * scale }}>
      {(['treble', 'bass', 'alto'] as const).map(c => <StaffDiagram key={c} theme={theme} clef={c} width={170} scale={desktop ? scale : 1} />)}
    </div>
  );
  return <Lesson desktop={desktop} title={t('games.claves')} steps={steps} current={6} heading="How to play"
    copy="In the Clefs game, a clef appears on the staff and you name it. Remember the anchors: the treble clef curls around G on line 2, the bass clef's dots surround F on line 4, and the alto clef points at C on line 3."
    visual={visual} />;
}

export function LessonMeasureScreen({ theme, desktop }: ScreenOpts) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const steps = ['Two ways to read', 'One note, several places', 'Rhythm in tab', 'Count four beats', 'Read a short phrase', 'On your guitar'];
  const [ref, scale] = usePanelScale(500, 1.7);
  const names = OPEN_STRING_LETTERS.map(l => shortNoteLabel(l, settings.notation, 'en'));
  const visual = (
    <div ref={ref} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <MeasureNotation theme={theme} notes={READING_MEASURES[4].notes} label="4/4 measure: staff and rhythmic tab" width={500} scale={desktop ? scale : 0.64} stringNames={names} />
      <Listen label="Listen" />
    </div>
  );
  return <Lesson desktop={desktop} title={t('games.leitura-braco')} steps={steps} current={4} heading="Count four beats"
    copy="Recall the rhythm figures from Module 1. In 4/4, a quarter note gets 1 beat; a half note, 2; a whole note, 4; and an eighth note, half a beat. Here: a half note on beats 1–2, a quarter on 3, and two eighths on 4 (count “4 and”). If a tab number’s duration is unclear, check the staff symbol. Audio plays the pitches evenly, without reproducing this mixed rhythm."
    visual={visual} />;
}

export function QuizMeasureScreen({ theme, answered, desktop }: ScreenOpts) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [vis, visW] = useWidth<HTMLDivElement>();
  const scale = visW ? Math.min(900, visW * 0.9) / 500 : 1;
  const names = OPEN_STRING_LETTERS.map(l => shortNoteLabel(l, settings.notation, 'en'));
  const choices = [4, 2, 1, 0.5];
  const answers = (
    <div className={`answers ${desktop ? 'col' : ''}`}>
      {choices.map((n, i) => (
        <span key={n} className={`answer ${answered ? (n === 0.5 ? 'ok' : 'dim') : ''}`}>
          <span className="lbl">{beatLabel(n, 'en')}</span>{desktop && <span className="kbd">{i + 1}</span>}
        </span>
      ))}
    </div>
  );
  const measure = <MeasureNotation theme={theme} notes={READING_MEASURES[4].notes} label="4/4 measure: staff and rhythmic tab" width={500}
    scale={desktop ? scale : 0.7} highlightIndex={2} stringNames={names} />;
  if (desktop) {
    return (
      <div className="page">
        <Top title={t('games.leitura-braco')} />
        <Progress round={7} history={[true, true, true, false, true, true]} />
        <div className="stage">
          <div className="vis" ref={vis}>{measure}</div>
          <div className="col">
            <div className="prompt">How long does tab note 3 last? In 4/4, the quarter note gets one beat.</div>
            {answers}
            {answered ? (
              <>
                <div className="verdict verdict-ok"><Icon name="check" size={22} />Correct!</div>
                <p className="explain">Note 3 (string 1, fret 7) is an eighth note: 1/2 beat. The symbols above and below show the same rhythm; the measure totals 4 beats. Audio plays only the pitches, evenly spaced.</p>
                <div><Listen label="Listen" /></div>
                <div className="grow" />
                <span className="btn btn-primary btn-block">Continue<span style={{ marginLeft: 'auto', opacity: .7, fontSize: 13, fontWeight: 500 }}>Enter ↵</span></span>
              </>
            ) : <><div className="grow" /><p className="small muted">Press 1–4 to answer.</p></>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page">
      <Top title={t('games.leitura-braco')} />
      <Progress round={7} history={[true, true, true, false, true, true]} />
      <main className="main" style={{ gap: 14, alignItems: 'center', textAlign: 'center' }}>
        <div className="prompt" style={{ fontSize: 'var(--t1)' }}>How long does tab note 3 last? In 4/4, the quarter note gets one beat.</div>
        {measure}
        <div style={{ width: '100%' }}>{answers}</div>
      </main>
    </div>
  );
}

/* -------------------------------------------------- Natural Notes explorer */
export function ExplorerScreen({ theme, desktop }: ScreenOpts) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const pt = lang === 'pt';
  const steps = ['One fret, one semitone', 'Count up from the open string', 'Fret 12: the octave', 'Landmarks on the E strings', 'Explore the fretboard', 'On your guitar'];
  const selected = { string: 3, fret: 2 };
  const name = shortNoteLabel('E', settings.notation, lang);
  const markers: FretMarker[] = [{ ...selected, label: name, tone: 'accent' }];
  const names = OPEN_STRING_LETTERS.map(l => shortNoteLabel(l, settings.notation, lang));
  const visual = (
    <div className="explorer">
      <div className="explorer-toggles">
        <span className="toggle-chip" aria-pressed="false">{t('explorer.naturals')}</span>
        <span className="toggle-chip" aria-pressed="false">{t('explorer.same')}</span>
      </div>
      <Fretboard frets={12} markers={markers} stringLabels="both" showFretNumbers onSelect={() => {}} />
      <div className="explorer-readout" aria-live="polite">
        <strong>{noteLabel('E', settings.notation, lang)}</strong>
        {t('explorer.position', { string: 4, fret: 2 })}
      </div>
      <PositionNotation theme={theme} position={selected} width={desktop ? (theme === 'paper' || theme === 'quiet' ? 220 : 260) : 156} captions={[t('common.tab'), t('notation.written')]} stringNames={names} />
    </div>
  );
  return <Lesson desktop={desktop} title={t('games.notas-braco')} steps={steps} current={5} heading={pt ? 'Explore o braço' : 'Explore the fretboard'}
    copy={pt
      ? 'Toque em qualquer posição para ver o nome da nota, a tablatura e a nota escrita. Ative “Notas naturais” para ver todas de uma vez, ou “Mesma nota em todas as oitavas” para ver onde a nota escolhida se repete.'
      : 'Tap any position to see its name, its tab and its written note. Turn on “Natural notes” to see them all at once, or “Same note in every octave” to see where the chosen note repeats across the neck.'}
    visual={visual} />;
}

/* ------------------------------------------------- the directions strip */
export function StripScreen({ theme }: ScreenOpts) {
  const { settings } = useSettings();
  const themes: Theme[] = ['paper', 'quiet', 'ink', 'linked'];
  const titles: Record<Theme, string> = { paper: 'Today: paper card', quiet: 'N3 · Quiet paper', ink: 'N1 · Ink on slate', linked: 'N2 · Ink + linked tab' };
  const cap: [string, string] = ['Tab', 'Staff (written)'];
  const gab: DiagramNote[] = [
    { vexKey: 'g/4', label: 'G' }, { vexKey: 'a/4', label: 'A' }, { vexKey: 'b/4', label: 'B', highlight: true },
  ];
  const names = OPEN_STRING_LETTERS.map(l => shortNoteLabel(l, settings.notation, 'en'));
  const row = (title: string, render: (t: Theme) => ReactNode, surface = false) => (
    <section>
      <h3>{title}</h3>
      <div className="grid">{themes.map(t => <div key={t} className={`cell ${surface ? 'on-surface' : ''}`}>{render(t)}</div>)}</div>
    </section>
  );
  void theme;
  return (
    <div className="strip">
      <div className="grid">{themes.map(t => <h2 key={t}>{titles[t]}</h2>)}</div>
      {row('Quiz feedback pair, on the page background: string 6 fret 10 (sounds D3, written D4)', t => <PositionNotation theme={t} position={{ string: 5, fret: 10 }} width={200} captions={cap} stringNames={names} />)}
      {row('Open string 6 (written E3, three ledger lines) and the open 1st string (E5), in a lesson panel', t => (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <PositionNotation theme={t} position={{ string: 5, fret: 0 }} width={170} captions={cap} stringNames={names} />
          <Staff theme={t} noteVexKey="e/5" width={170} height={170} />
        </div>), true)}
      {row('Treble Clef lesson: G A B, B highlighted, numbered lines and spaces', t => <StaffDiagram theme={t} clef="treble" width={340} height={175} notes={gab} numberLines numberSpaces />, true)}
      {row('Clefs lesson: bass F3 and alto C4, plus the three clefs', t => (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <StaffDiagram theme={t} clef="bass" width={200} height={150} notes={[{ vexKey: 'f/3', label: 'F', highlight: true }]} numberLines />
          <StaffDiagram theme={t} clef="alto" width={200} height={150} notes={[{ vexKey: 'c/4', label: 'C', highlight: true }]} numberLines />
        </div>), true)}
      {row('Staff, Tab and Rhythm: half, quarter, two beamed eighths on string 1 (frets 3 5 7 5), tab note 3 highlighted', t => <MeasureNotation theme={t} notes={READING_MEASURES[4].notes} label="measure" width={400} highlightIndex={2} stringNames={names} scale={1} />, true)}
      {row('Rests and beams take the ink too (not in the app data yet)', t => <RestDemo theme={t} width={320} />, true)}
      {row('A tab alone (Strings and Tuning lesson): the open 6th string', t => <GuitarTab theme={t} position={{ string: 5, fret: 0 }} width={200} stringNames={names} />, true)}
      {row('Keyboard (secondary): white keys stay light but lose the glare; black keys take the page colour', t => <Keyboard theme={t} highlighted={1} labels={['C', 'D', 'E', 'F', 'G', 'A', 'B']} />, true)}
    </div>
  );
}
