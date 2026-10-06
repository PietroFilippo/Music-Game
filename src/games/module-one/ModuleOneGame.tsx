import { useState } from 'react';
import { AnswerBank } from '../../components/AnswerBank';
import { ContinueButton } from '../../components/ContinueButton';
import { Fretboard } from '../../components/Fretboard';
import { GameShell } from '../../components/GameShell';
import { Keyboard } from '../../components/Keyboard';
import { RhythmFigure } from '../../components/RhythmFigure';
import { Staff } from '../../components/Staff';
import { TimerBar } from '../../components/TimerBar';
import { useI18n } from '../../hooks/useI18n';
import { useQuizRound } from '../../hooks/useQuizRound';
import { fretsForVexKey } from '../../music/guitar';
import { useSettings } from '../../SettingsContext';
import { createQuestionDeck, type ModuleOneId, type QuestionVisual } from './questions';

function QuestionIllustration({ visual, reveal }: { visual: QuestionVisual; reveal: boolean }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  switch (visual.kind) {
    case 'staff': return <Staff noteVexKey={visual.vexKey} />;
    case 'text': return <div className="question-note">{visual.text}</div>;
    case 'rhythm': return <RhythmFigure value={visual.value} label={t('module.rhythmSymbol')} />;
    case 'keyboard': return <Keyboard highlighted={visual.note} showLabels={reveal} language={settings.language} notation={settings.notation} />;
    case 'sound': return <blockquote className="sound-scenario">{visual.text}</blockquote>;
    case 'descending': return <div className="note-sequence" aria-label={t('module.descendingSequence')}>
      {visual.notes.map((note, i) => <span key={i}>{i > 0 && <span aria-hidden="true">↘ </span>}{note}</span>)}
    </div>;
  }
}

export function ModuleOneGame({ id, onExit }: { id: ModuleOneId; onExit: () => void }) {
  const { settings } = useSettings();
  const { t } = useI18n();
  const newDeck = () => createQuestionDeck(id, settings.language, settings.notation);
  const [deck, setDeck] = useState(newDeck);
  const quiz = useQuizRound<string>(id, 10, {
    itemId: (): string => deck[quiz.progress.round].id,
    onRestart: () => setDeck(newDeck()),
  });
  const question = deck[quiz.progress.round];

  return (
    <GameShell title={t(`games.${id}`)} onExit={onExit} progress={quiz.progress}>
      <div className="module-question">
        <p className="question-prompt">{question.prompt}</p>
        <div className="question-illustration"><QuestionIllustration visual={question.visual} reveal={quiz.answered} /></div>
        {quiz.timed && <TimerBar fraction={quiz.timerFraction} />}
        <AnswerBank choices={question.choices} correctValue={question.correct} lastPick={quiz.picked}
          reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === question.correct)} />
        {quiz.answered && <div className="answer-feedback" role="status">
          <strong style={{ color: quiz.correct ? 'var(--accent)' : 'var(--warn)' }}>
            {t(quiz.expired ? 'module.timeUp' : quiz.correct ? 'module.correct' : 'module.review')}
          </strong>
          <p>{question.explanation}</p>
          {question.fretKey && <Fretboard positions={fretsForVexKey(question.fretKey).slice(0, 1)} />}
        </div>}
        {quiz.needsContinue && <ContinueButton onClick={quiz.next} />}
      </div>
    </GameShell>
  );
}
