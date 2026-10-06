import { useState } from 'react';
import { AnswerBank } from '../../components/AnswerBank';
import { ContinueButton } from '../../components/ContinueButton';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { GameShell } from '../../components/GameShell';
import { GuitarTab } from '../../components/GuitarTab';
import { PositionNotation } from '../../components/PositionNotation';
import { TimerBar } from '../../components/TimerBar';
import { useI18n } from '../../hooks/useI18n';
import { useQuizRound } from '../../hooks/useQuizRound';
import { parsePositionKey, positionKey, samePosition } from '../../music/guitar';
import { useSettings } from '../../SettingsContext';
import { createQuestionDeck, NECK_FRETS, type ModuleTwoId, type QuestionVisual } from './questions';

function QuestionIllustration({ visual }: { visual: QuestionVisual }) {
  return visual.kind === 'tab'
    ? <GuitarTab positions={[visual.position]} width={220} />
    : <Fretboard frets={NECK_FRETS} {...visual.board} />;
}

export function ModuleTwoGame({ id, onExit }: { id: ModuleTwoId; onExit: () => void }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  const newDeck = () => createQuestionDeck(id, settings.language, settings.notation);
  const [deck, setDeck] = useState(newDeck);
  const quiz = useQuizRound<string>(id, 10, {
    itemId: (): string => deck[quiz.progress.round].id,
    onRestart: () => setDeck(newDeck()),
  });
  const question = deck[quiz.progress.round];
  const { answer } = question;

  // After a fretboard answer, mark the selected position on top of the solution.
  const pickedMarkers: FretMarker[] = answer.kind === 'board' && quiz.picked !== undefined
    ? [{ ...parsePositionKey(quiz.picked), label: quiz.correct ? '✓' : '✗', tone: quiz.correct ? 'accent' : 'wrong' }]
    : [];

  return (
    <GameShell title={t(`games.${id}`)} onExit={onExit} progress={quiz.progress}>
      <div className="module-question">
        <p className="question-prompt">{question.prompt}</p>
        <div className="question-illustration">
          {answer.kind === 'board' ? (
            <Fretboard
              frets={NECK_FRETS}
              {...(quiz.answered ? question.reveal : answer.board)}
              markers={quiz.answered ? [...(question.reveal.markers ?? []), ...pickedMarkers] : answer.board.markers}
              onSelect={p => quiz.pick(positionKey(p), answer.accepts.some(a => samePosition(a, p)))}
              disabled={quiz.answered}
              label={t('fretboard.answerLabel')}
            />
          ) : <QuestionIllustration visual={answer.visual} />}
        </div>
        {quiz.timed && <TimerBar fraction={quiz.timerFraction} />}
        {answer.kind === 'choice' && (
          <AnswerBank choices={answer.choices} correctValue={answer.correct} lastPick={quiz.picked}
            reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === answer.correct)} />
        )}
        {quiz.answered && <div className="answer-feedback" role="status">
          <strong style={{ color: quiz.correct ? 'var(--accent)' : 'var(--warn)' }}>
            {t(quiz.expired ? 'module.timeUp' : quiz.correct ? 'module.correct' : 'module.review')}
          </strong>
          <p>{question.explanation}</p>
          {answer.kind === 'choice' && <Fretboard frets={NECK_FRETS} {...question.reveal} />}
          {question.notation && <PositionNotation position={question.notation} />}
        </div>}
        {quiz.needsContinue && <ContinueButton onClick={quiz.next} />}
      </div>
    </GameShell>
  );
}
