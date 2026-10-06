import { useState } from 'react';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { GameShell } from '../../components/GameShell';
import { GuitarTab } from '../../components/GuitarTab';
import { PositionNotation } from '../../components/PositionNotation';
import { Staff } from '../../components/Staff';
import { useI18n } from '../../hooks/useI18n';
import { useQuizRound, type RoundReview } from '../../hooks/useQuizRound';
import { parsePositionKey, positionKey, samePosition, type FretPosition } from '../../music/guitar';
import { useSettings } from '../../SettingsContext';
import { createQuestionDeck, NECK_FRETS, type ModuleTwoQuestion, type QuestionVisual } from './questions';
import type { ModuleTwoId } from './questions';

function QuestionIllustration({ visual }: { visual: QuestionVisual }) {
  switch (visual.kind) {
    case 'tab': return <GuitarTab positions={[visual.position]} width={220} />;
    case 'staff': return <Staff noteVexKey={visual.vexKey} />;
    case 'text': return <div className="note-sequence question-text">{visual.text}</div>;
    case 'board': return <Fretboard frets={NECK_FRETS} {...visual.board} />;
  }
}

export function ModuleTwoGame({ id, onExit }: { id: ModuleTwoId; onExit: () => void }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  const newDeck = () => createQuestionDeck(id, settings.language, settings.notation);
  const [deck, setDeck] = useState(newDeck);
  const where = (p: FretPosition) => (p.fret === 0
    ? t('fretboard.openCell', { string: p.string + 1 })
    : t('fretboard.cell', { string: p.string + 1, fret: p.fret }));
  const describe = (q: ModuleTwoQuestion, value: string) => (q.answer.kind === 'choice'
    ? q.answer.choices.find(c => c.value === value)?.label ?? value
    : where(parsePositionKey(value)));
  const quiz = useQuizRound<string>(id, 10, {
    itemId: (): string => deck[quiz.progress.round].id,
    review: (picked): RoundReview => {
      const q = deck[quiz.progress.round];
      const correct = q.answer.kind === 'choice' ? describe(q, q.answer.correct) : q.answer.accepts.map(where).join(' / ');
      return { prompt: q.prompt, correct, given: picked === undefined ? undefined : describe(q, picked) };
    },
    onRestart: () => setDeck(newDeck()),
  });
  const question = deck[quiz.progress.round];
  const { answer } = question;

  // After a fretboard answer, mark the selected position: on the question board and on the solution.
  const pickedMarkers: FretMarker[] = answer.kind === 'board' && quiz.picked !== undefined
    ? [{ ...parsePositionKey(quiz.picked), label: quiz.correct ? '✓' : '✗', tone: quiz.correct ? 'accent' : 'wrong' }]
    : [];

  return (
    <GameShell title={t(`games.${id}`)} onExit={onExit} quiz={quiz} feedback={<>
      <p className="feedback-explanation">{question.explanation}</p>
      <div className="feedback-visual">
        <Fretboard frets={NECK_FRETS} {...question.reveal} markers={[...(question.reveal.markers ?? []), ...pickedMarkers]} />
        {question.notation && <PositionNotation position={question.notation} flat={question.notation.flat} />}
      </div>
    </>}>
      <div className="question">
        <p className="question-prompt">{question.prompt}</p>
        <div className="question-visual">
          {answer.kind === 'board' ? (
            <Fretboard
              frets={NECK_FRETS}
              {...answer.board}
              markers={[...(answer.board.markers ?? []), ...pickedMarkers]}
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
    </GameShell>
  );
}
