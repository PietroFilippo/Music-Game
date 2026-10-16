import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { Keyboard } from '../../components/Keyboard';
import { PositionNotation } from '../../components/PositionNotation';
import { RhythmFigure } from '../../components/RhythmFigure';
import { BoardSlot, StageNotation, useStage } from '../../components/Stage';
import { Staff } from '../../components/Staff';
import { useI18n } from '../../hooks/useI18n';
import type { QuizRound } from '../../hooks/useQuizRound';
import { fretsForVexKey } from '../../music/guitar';
import type { QuizItem } from '../../review/registry';
import { useSettings } from '../../SettingsContext';
import { DeckQuiz, type DeckRound } from '../DeckQuiz';
import { createQuestionDeck, type ModuleOneId, type ModuleQuestion, type QuestionVisual } from './questions';
import { createStaffDeck, isStaffGame, type StaffGameId } from './staff';

// In the two-pane stage staves are drawn larger (keeping room for the neck a
// staff note appears on after answering), and figures and keys are zoomed.
function QuestionIllustration({ visual, reveal, board }: { visual: QuestionVisual; reveal: boolean; board: boolean }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  switch (visual.kind) {
    case 'staff': return (
      <StageNotation width={280} height={140} max={720} board={board ? 'plain' : undefined}>
        <Staff noteVexKey={visual.vexKey} />
      </StageNotation>
    );
    case 'clef': return <StageNotation width={280} height={140} max={720}><Staff clef={visual.clef} /></StageNotation>;
    case 'text': return <div className="question-note">{visual.text}</div>;
    case 'rhythm': return <div className="question-figure"><RhythmFigure value={visual.value} label={t('module.rhythmSymbol')} /></div>;
    case 'keyboard': return (
      <div className="question-keys">
        <Keyboard highlighted={visual.note} showLabels={reveal} language={settings.language} notation={settings.notation} />
      </div>
    );
    case 'sound': return <blockquote className="sound-scenario">{visual.text}</blockquote>;
    case 'descending': return <div className="note-sequence" aria-label={t('module.descendingSequence')}>
      {visual.notes.map((note, i) => <span key={i}>{i > 0 && <span aria-hidden="true">↘ </span>}{note}</span>)}
    </div>;
  }
}

const fretPosition = (question: ModuleQuestion) => (question.fretKey ? fretsForVexKey(question.fretKey)[0] : undefined);

// In the two-pane stage an answered staff note also appears on the neck under the staff.
function ReadingVisual({ question, quiz }: { question: ModuleQuestion; quiz: QuizRound<string> }) {
  const { wide } = useStage();
  const position = fretPosition(question);
  return (
    <>
      <QuestionIllustration visual={question.visual} reveal={quiz.answered} board={!!position} />
      {wide && position && (quiz.answered ? <Fretboard positions={[position]} /> : <BoardSlot />)}
    </>
  );
}

function ReadingFeedback({ question }: { question: ModuleQuestion }) {
  const { wide } = useStage();
  const position = fretPosition(question);
  return (
    <>
      <p className="feedback-explanation">{question.explanation}</p>
      {position && (!wide || question.notation) && <div className="feedback-visual">
        {!wide && <Fretboard positions={[position]} />}
        {question.notation && <PositionNotation position={position} />}
      </div>}
    </>
  );
}

/** Shows a Module 1 multiple-choice question; staff notes also appear on the fretboard after answering. */
export function readingRound({ question }: { question: ModuleQuestion }): DeckRound {
  const label = (value: string) => question.choices.find(c => c.value === value)?.label ?? value;
  return {
    question: quiz => ({
      prompt: question.prompt,
      visual: <ReadingVisual question={question} quiz={quiz} />,
      note: question.hint && <>{question.hint.label}: <b>{question.hint.value}</b></>,
      answers: <AnswerBank choices={question.choices} correctValue={question.correct} lastPick={quiz.picked}
        reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === question.correct)} />,
      choices: question.choices.length,
    }),
    feedback: () => <ReadingFeedback question={question} />,
    describe: picked => ({
      prompt: question.summary ?? question.prompt,
      correct: label(question.correct),
      given: picked === undefined ? undefined : label(picked),
    }),
  };
}

// A ten-round quiz of any Module 1 topic, including the four original staff games.
export function ModuleOneGame({ id, onExit }: { id: ModuleOneId | StaffGameId; onExit: () => void }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  const newDeck = () => (isStaffGame(id)
    ? createStaffDeck(id, settings.language, settings.notation)
    : createQuestionDeck(id, settings.language, settings.notation));
  return (
    <DeckQuiz title={t(`games.${id}`)} scoreAs={id} onExit={onExit} renderers={{ reading: readingRound }}
      createDeck={() => newDeck().map((question): QuizItem => ({ family: 'reading', gameId: id, question }))} />
  );
}
