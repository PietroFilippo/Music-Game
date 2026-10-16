import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { GuitarTab } from '../../components/GuitarTab';
import { HearButton } from '../../components/HearButton';
import { MeasureNotation } from '../../components/MeasureNotation';
import { PositionNotation } from '../../components/PositionNotation';
import { Staff } from '../../components/Staff';
import { useI18n } from '../../hooks/useI18n';
import type { QuizRound } from '../../hooks/useQuizRound';
import { parsePositionKey, positionKey, samePosition, soundingMidi, type FretPosition } from '../../music/guitar';
import type { QuizItem } from '../../review/registry';
import type { GameId } from '../../types';
import { DeckQuiz, type DeckRound } from '../DeckQuiz';
import { NECK_FRETS, type FretboardQuestion, type QuestionSound, type QuestionVisual } from './model';

function QuestionIllustration({ visual }: { visual: QuestionVisual }) {
  switch (visual.kind) {
    case 'tab': return <GuitarTab positions={[visual.position]} width={220} />;
    case 'staff': return <Staff noteVexKey={visual.vexKey} height={180} />;
    case 'measure': return <MeasureNotation notes={visual.notes} label={visual.label} />;
    case 'text': return <div className="note-sequence question-text">{visual.text}</div>;
    case 'board': return <Fretboard frets={NECK_FRETS} {...visual.board} />;
  }
}

/** What the feedback's Listen button plays: the question's sound, or its notated position. */
export function questionSound(q: FretboardQuestion): QuestionSound | undefined {
  return q.sound ?? (q.notation ? { notes: [soundingMidi(q.notation)] } : undefined);
}

interface RoundProps {
  question: FretboardQuestion;
  quiz: QuizRound<string>;
}

// After a fretboard answer, mark the selected position: on the question board and on the solution.
function pickedMarkers({ question, quiz }: RoundProps): FretMarker[] {
  return question.answer.kind === 'board' && quiz.picked !== undefined
    ? [{ ...parsePositionKey(quiz.picked), label: quiz.correct ? '✓' : '✗', tone: quiz.correct ? 'accent' : 'wrong' }]
    : [];
}

function FretboardPrompt({ question, quiz }: RoundProps) {
  const { t } = useI18n();
  const { answer } = question;
  const picked = pickedMarkers({ question, quiz });
  return (
    <div className="question">
      <p className="question-prompt">{question.prompt}</p>
      {answer.kind === 'board' && answer.visual && <div className="question-visual">
        <QuestionIllustration visual={answer.visual} />
      </div>}
      <div className="question-visual">
        {answer.kind === 'board' ? (
          <Fretboard
            frets={NECK_FRETS}
            {...answer.board}
            markers={[...(answer.board.markers ?? []), ...picked]}
            onSelect={p => quiz.pick(positionKey(p), answer.accepts.some(a => samePosition(a, p)))}
            disabled={quiz.answered}
            label={t('fretboard.answerLabel')}
          />
        ) : <QuestionIllustration visual={answer.visual} />}
      </div>
      {answer.kind === 'choice' && (
        <AnswerBank choices={answer.choices} correctValue={answer.correct} lastPick={quiz.picked}
          reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === answer.correct)} />
      )}
    </div>
  );
}

function FretboardFeedback({ question, quiz }: RoundProps) {
  const sound = questionSound(question);
  return (
    <>
      <p className="feedback-explanation">{question.explanation}</p>
      {sound && <div className="feedback-listen"><HearButton notes={sound.notes} spacing={sound.spacing} /></div>}
      <div className="feedback-visual">
        <Fretboard frets={NECK_FRETS} {...question.reveal} markers={[...(question.reveal.markers ?? []), ...pickedMarkers({ question, quiz })]} />
        {question.notation && <PositionNotation position={question.notation} flat={question.notation.flat} />}
      </div>
    </>
  );
}

/**
 * Shows a fretboard question, answered with choices or by tapping the neck.
 * Feedback shows the solution on the neck, as tab and staff, and can play it.
 */
export function fretboardRound({ question }: { question: FretboardQuestion }): DeckRound {
  return {
    question: quiz => <FretboardPrompt question={question} quiz={quiz} />,
    feedback: quiz => <FretboardFeedback question={question} quiz={quiz} />,
    describe: (picked, t) => {
      const where = (p: FretPosition) => (p.fret === 0
        ? t('fretboard.openCell', { string: p.string + 1 })
        : t('fretboard.cell', { string: p.string + 1, fret: p.fret }));
      const { answer } = question;
      const label = (value: string) => (answer.kind === 'choice'
        ? answer.choices.find(c => c.value === value)?.label ?? value
        : where(parsePositionKey(value)));
      const correct = answer.kind === 'choice' ? label(answer.correct) : answer.accepts.map(where).join(' / ');
      return { prompt: question.prompt, correct, given: picked === undefined ? undefined : label(picked) };
    },
  };
}

interface Props {
  gameId: GameId;
  /** A fresh ten-question deck; called at the start and on every restart. */
  createDeck: () => FretboardQuestion[];
  onExit: () => void;
}

// A ten-round quiz of one fretboard topic.
export function FretboardQuiz({ gameId, createDeck, onExit }: Props) {
  const { t } = useI18n();
  return (
    <DeckQuiz title={t(`games.${gameId}`)} scoreAs={gameId} onExit={onExit} renderers={{ fretboard: fretboardRound }}
      createDeck={() => createDeck().map((question): QuizItem => ({ family: 'fretboard', gameId, question }))} />
  );
}
