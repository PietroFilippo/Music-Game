import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { Keyboard } from '../../components/Keyboard';
import { PositionNotation } from '../../components/PositionNotation';
import { RhythmFigure } from '../../components/RhythmFigure';
import { Staff } from '../../components/Staff';
import { useI18n } from '../../hooks/useI18n';
import type { QuizRound } from '../../hooks/useQuizRound';
import { fretsForVexKey } from '../../music/guitar';
import type { QuizItem } from '../../review/registry';
import { useSettings } from '../../SettingsContext';
import { DeckQuiz, type DeckRound } from '../DeckQuiz';
import { createQuestionDeck, type ModuleOneId, type ModuleQuestion, type QuestionVisual } from './questions';
import { createStaffDeck, isStaffGame, type StaffGameId } from './staff';

function QuestionIllustration({ visual, reveal }: { visual: QuestionVisual; reveal: boolean }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  switch (visual.kind) {
    case 'staff': return <Staff noteVexKey={visual.vexKey} />;
    case 'clef': return <Staff clef={visual.clef} />;
    case 'text': return <div className="question-note">{visual.text}</div>;
    case 'rhythm': return <RhythmFigure value={visual.value} label={t('module.rhythmSymbol')} />;
    case 'keyboard': return <Keyboard highlighted={visual.note} showLabels={reveal} language={settings.language} notation={settings.notation} />;
    case 'sound': return <blockquote className="sound-scenario">{visual.text}</blockquote>;
    case 'descending': return <div className="note-sequence" aria-label={t('module.descendingSequence')}>
      {visual.notes.map((note, i) => <span key={i}>{i > 0 && <span aria-hidden="true">↘ </span>}{note}</span>)}
    </div>;
  }
}

function ReadingPrompt({ question, quiz }: { question: ModuleQuestion; quiz: QuizRound<string> }) {
  return (
    <div className="question">
      <p className="question-prompt">{question.prompt}</p>
      <div className="question-visual"><QuestionIllustration visual={question.visual} reveal={quiz.answered} /></div>
      {question.hint && <p className="question-hint">{question.hint.label}: <b>{question.hint.value}</b></p>}
      <AnswerBank choices={question.choices} correctValue={question.correct} lastPick={quiz.picked}
        reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === question.correct)} />
    </div>
  );
}

function ReadingFeedback({ question }: { question: ModuleQuestion }) {
  const position = question.fretKey ? fretsForVexKey(question.fretKey)[0] : undefined;
  return (
    <>
      <p className="feedback-explanation">{question.explanation}</p>
      {position && <div className="feedback-visual">
        <Fretboard positions={[position]} />
        {question.notation && <PositionNotation position={position} />}
      </div>}
    </>
  );
}

/** Shows a Module 1 multiple-choice question; staff notes also appear on the fretboard after answering. */
export function readingRound({ question }: { question: ModuleQuestion }): DeckRound {
  const label = (value: string) => question.choices.find(c => c.value === value)?.label ?? value;
  return {
    question: quiz => <ReadingPrompt question={question} quiz={quiz} />,
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
