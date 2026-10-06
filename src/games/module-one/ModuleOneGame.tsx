import { useState } from 'react';
import { AnswerBank } from '../../components/AnswerBank';
import { Fretboard } from '../../components/Fretboard';
import { GameShell } from '../../components/GameShell';
import { Keyboard } from '../../components/Keyboard';
import { RhythmFigure } from '../../components/RhythmFigure';
import { Staff } from '../../components/Staff';
import { useI18n } from '../../hooks/useI18n';
import { useQuizRound, type RoundReview } from '../../hooks/useQuizRound';
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
  const labelOf = (value: string) => deck[quiz.progress.round].choices.find(c => c.value === value)?.label ?? value;
  const quiz = useQuizRound<string>(id, 10, {
    itemId: (): string => deck[quiz.progress.round].id,
    review: (picked): RoundReview => {
      const q = deck[quiz.progress.round];
      return { prompt: q.prompt, correct: labelOf(q.correct), given: picked === undefined ? undefined : labelOf(picked) };
    },
    onRestart: () => setDeck(newDeck()),
  });
  const question = deck[quiz.progress.round];

  return (
    <GameShell title={t(`games.${id}`)} onExit={onExit} quiz={quiz} feedback={<>
      <p className="feedback-explanation">{question.explanation}</p>
      {question.fretKey && <div className="feedback-visual">
        <Fretboard positions={fretsForVexKey(question.fretKey).slice(0, 1)} />
      </div>}
    </>}>
      <div className="question">
        <p className="question-prompt">{question.prompt}</p>
        <div className="question-visual"><QuestionIllustration visual={question.visual} reveal={quiz.answered} /></div>
        <AnswerBank choices={question.choices} correctValue={question.correct} lastPick={quiz.picked}
          reveal={quiz.expired} disabled={quiz.answered} onPick={value => quiz.pick(value, value === question.correct)} />
      </div>
    </GameShell>
  );
}
