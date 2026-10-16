import { useMemo, useState, type ReactNode } from 'react';
import { GameShell, type QuestionView } from '../components/GameShell';
import { Icon } from '../components/Icon';
import { useI18n, type Translate } from '../hooks/useI18n';
import { useQuizRound, type QuizRound, type RoundReview } from '../hooks/useQuizRound';
import { relocalize, type QuizItem } from '../review/registry';
import { useSettings } from '../SettingsContext';
import type { GameId, Language, Notation } from '../types';

/** How one round looks: the question, the feedback after answering and its line in the results. */
export interface DeckRound {
  question: (quiz: QuizRound<string>) => QuestionView;
  feedback: (quiz: QuizRound<string>) => ReactNode;
  describe: (picked: string | undefined, t: Translate) => RoundReview;
}

/** A renderer per question family. Each round uses its own, so one deck can mix families. */
export type RoundRenderers = {
  [F in QuizItem['family']]?: (item: Extract<QuizItem, { family: F }>) => DeckRound;
};

function roundView(item: QuizItem, renderers: RoundRenderers): DeckRound {
  const view = item.family === 'reading' ? renderers.reading?.(item) : renderers.fretboard?.(item);
  if (!view) throw new Error(`No renderer for ${item.family} questions`);
  return view;
}

interface Props {
  title: string;
  /** Game a finished deck is scored under; null makes every deck an unscored review. */
  scoreAs: GameId | null;
  /** A fresh deck in the current language and notation, for the start and Play again. Reviews may find none. */
  createDeck: () => QuizItem[];
  renderers: RoundRenderers;
  onExit: () => void;
  /** Name each round's topic, for decks that mix topics. */
  showTopic?: boolean;
}

interface Session {
  key: number;
  items: QuizItem[];
  review: boolean;
  language: Language;
  notation: Notation;
}

// Runs a deck of questions as a quiz. After misses, "Review these" replays just
// the missed questions, each once, as an unscored review; their answers still
// update the history. Every new deck remounts the session, so no round state or timer
// carries over. Changing the language or notation mid-quiz keeps the rounds and
// their order and rebuilds each question from its ID through the registry.
export function DeckQuiz({ title, scoreAs, createDeck, renderers, onExit, showTopic = false }: Props) {
  const { settings } = useSettings();
  const begin = (key: number, items: QuizItem[], review: boolean): Session =>
    ({ key, items, review, language: settings.language, notation: settings.notation });
  const [session, setSession] = useState(() => begin(0, createDeck(), scoreAs === null));
  const items = useMemo(() => (session.language === settings.language && session.notation === settings.notation
    ? session.items : relocalize(session.items, settings.language, settings.notation)),
  [session, settings.language, settings.notation]);

  if (items.length === 0) return <NothingToReview title={title} onExit={onExit} />;
  return (
    <DeckSession key={session.key} title={title} items={items} scoreAs={session.review ? null : scoreAs}
      renderers={renderers} showTopic={showTopic} onExit={onExit}
      onPlayAgain={() => setSession(begin(session.key + 1, createDeck(), scoreAs === null))}
      onReviewMisses={missed => setSession(begin(session.key + 1, missed, true))} />
  );
}

interface SessionProps extends Pick<Props, 'title' | 'renderers' | 'showTopic' | 'onExit'> {
  items: QuizItem[];
  scoreAs: GameId | null;
  onPlayAgain: () => void;
  onReviewMisses: (missed: QuizItem[]) => void;
}

function DeckSession({ title, items, scoreAs, renderers, showTopic, onExit, onPlayAgain, onReviewMisses }: SessionProps) {
  const { t } = useI18n();
  // An answered round keeps the question it was answered on until Continue,
  // even if the language changes meanwhile and rebuilds it with new choices.
  const [answeredOn, setAnsweredOn] = useState<QuizItem | null>(null);
  const quiz = useQuizRound<string>(scoreAs, items.length, {
    itemGameId: (): GameId => items[quiz.progress.round].gameId,
    itemId: (): string => items[quiz.progress.round].question.id,
    review: (picked): RoundReview => {
      const answering = items[quiz.progress.round];
      setAnsweredOn(answering);
      return roundView(answering, renderers).describe(picked, t);
    },
  });
  const item = quiz.answered && answeredOn ? answeredOn : items[quiz.progress.round];
  const round = roundView(item, renderers);
  // Small pools repeat within a deck; a question missed twice is replayed once.
  const missed = [...new Map(quiz.reviews.filter(r => r.result !== 'correct')
    .map(r => items[r.round - 1]).map(i => [`${i.gameId} ${i.question.id}`, i])).values()];

  return (
    <GameShell title={title} onExit={onExit} quiz={quiz} review={scoreAs === null}
      question={round.question(quiz)} feedback={round.feedback(quiz)} topic={showTopic ? t(`games.${item.gameId}`) : undefined}
      onPlayAgain={onPlayAgain} reviewMisses={{ count: missed.length, start: () => onReviewMisses(missed) }} />
  );
}

function NothingToReview({ title, onExit }: { title: string; onExit: () => void }) {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="topbar" data-tauri-drag-region="deep">
        <button type="button" className="ibtn" aria-label={t('common.back')} onClick={onExit}><Icon name="back" /></button>
        <h1 className="topbar-title">{title}</h1>
      </header>
      <main className="page-main">
        <section className="card">
          <h2>{t('review.nothingDue')}</h2>
          <p className="muted">{t('review.nothingDueHint')}</p>
        </section>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onExit}>{t('results.backToCourse')}</button>
        </div>
      </main>
    </div>
  );
}
