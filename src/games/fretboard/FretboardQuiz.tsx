import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { GuitarTab } from '../../components/GuitarTab';
import { HearButton } from '../../components/HearButton';
import { MeasureNotation } from '../../components/MeasureNotation';
import { PositionNotation } from '../../components/PositionNotation';
import { BoardSlot, StageNotation, useStage } from '../../components/Stage';
import { Staff } from '../../components/Staff';
import { useI18n } from '../../hooks/useI18n';
import type { QuizRound } from '../../hooks/useQuizRound';
import { parsePositionKey, positionKey, samePosition, soundingMidi, type FretPosition } from '../../music/guitar';
import type { QuizItem } from '../../review/registry';
import type { GameId } from '../../types';
import { DeckQuiz, type DeckRound } from '../DeckQuiz';
import { NECK_FRETS, type BoardView, type FretboardQuestion, type QuestionSound, type QuestionVisual } from './model';

type BoardRoom = 'interactive' | 'plain';

// In the two-pane stage notation is drawn larger, keeping room for the neck
// that is or will be shown under it.
function QuestionIllustration({ visual, board }: { visual: QuestionVisual; board?: BoardRoom }) {
  switch (visual.kind) {
    case 'tab': return (
      <StageNotation width={220} height={140} max={520} board={board} share={board === 'interactive' ? 0.4 : 0.6}>
        <GuitarTab positions={[visual.position]} width={220} />
      </StageNotation>
    );
    case 'staff': return (
      <StageNotation width={280} height={180} max={720} board={board} share={board === 'interactive' ? 0.45 : 0.7}>
        <Staff noteVexKey={visual.vexKey} height={180} />
      </StageNotation>
    );
    case 'measure': return (
      <StageNotation width={500} height={310} max={900} board={board} share={0.8}>
        <MeasureNotation notes={visual.notes} label={visual.label} />
      </StageNotation>
    );
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

// The solution board: the reveal with the picked position marked.
function solutionBoard(props: RoundProps): BoardView {
  const { reveal } = props.question;
  return { ...reveal, markers: [...(reveal.markers ?? []), ...pickedMarkers(props)] };
}

// The question's visual. In the two-pane stage an answered round draws its
// solution on the question's own neck (disabled), so the learner compares their
// tap with the answer in place; stacked, the feedback shows it on a second neck.
function FretboardVisual({ question, quiz }: RoundProps) {
  const { t } = useI18n();
  const { wide } = useStage();
  const { answer } = question;
  const solved = wide && quiz.answered;
  if (answer.kind === 'board') {
    const board = solved
      ? { ...answer.board, ...solutionBoard({ question, quiz }) }
      : { ...answer.board, markers: [...(answer.board.markers ?? []), ...pickedMarkers({ question, quiz })] };
    return (
      <>
        {answer.visual && <QuestionIllustration visual={answer.visual} board="interactive" />}
        <Fretboard
          frets={NECK_FRETS}
          {...board}
          onSelect={p => quiz.pick(positionKey(p), answer.accepts.some(a => samePosition(a, p)))}
          disabled={quiz.answered}
          label={t('fretboard.answerLabel')}
        />
      </>
    );
  }
  if (answer.visual.kind === 'board') {
    return solved ? <Fretboard frets={NECK_FRETS} {...solutionBoard({ question, quiz })} /> : <QuestionIllustration visual={answer.visual} />;
  }
  return (
    <>
      <QuestionIllustration visual={answer.visual} board="plain" />
      {solved ? <Fretboard frets={NECK_FRETS} {...solutionBoard({ question, quiz })} /> : wide && <BoardSlot />}
    </>
  );
}

function FretboardFeedback({ question, quiz }: RoundProps) {
  const { wide } = useStage();
  const sound = questionSound(question);
  return (
    <>
      <p className="feedback-explanation">{question.explanation}</p>
      {sound && <div className="feedback-listen"><HearButton notes={sound.notes} spacing={sound.spacing} /></div>}
      {(!wide || question.notation) && (
        <div className="feedback-visual">
          {!wide && <Fretboard frets={NECK_FRETS} {...solutionBoard({ question, quiz })} />}
          {question.notation && <PositionNotation position={question.notation} flat={question.notation.flat} />}
        </div>
      )}
    </>
  );
}

/**
 * Shows a fretboard question, answered with choices or by tapping the neck.
 * Feedback shows the solution on the neck, as tab and staff, and can play it.
 * In the two-pane stage the solution is drawn on the question's neck instead.
 */
export function fretboardRound({ question }: { question: FretboardQuestion }): DeckRound {
  return {
    question: quiz => {
      const { answer } = question;
      return {
        prompt: question.prompt,
        visual: <FretboardVisual question={question} quiz={quiz} />,
        answers: answer.kind === 'choice' ? (
          <AnswerBank choices={answer.choices} correctValue={answer.correct} lastPick={quiz.picked}
            reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === answer.correct)} />
        ) : undefined,
        choices: answer.kind === 'choice' ? answer.choices.length : 0,
      };
    },
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
