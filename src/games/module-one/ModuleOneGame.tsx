import { useEffect, useRef, useState } from 'react';
import { AnswerBank } from '../../components/AnswerBank';
import { ContinueButton } from '../../components/ContinueButton';
import { Fretboard } from '../../components/Fretboard';
import { GameShell } from '../../components/GameShell';
import { Keyboard } from '../../components/Keyboard';
import { RhythmFigure } from '../../components/RhythmFigure';
import { Staff } from '../../components/Staff';
import { TimerBar } from '../../components/TimerBar';
import { DIFFICULTY_SECONDS, useAnswerTimer } from '../../hooks/useAnswerTimer';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useI18n } from '../../hooks/useI18n';
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
  const progress = useGameProgress(id, 10);
  const [deck, setDeck] = useState(() => createQuestionDeck(id, settings.language, settings.notation));
  const [picked, setPicked] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const answerLocked = useRef(false);
  const submittedRound = useRef<number | null>(null);
  const question = deck[progress.round];
  const answered = picked !== null || expired;
  const seconds = DIFFICULTY_SECONDS[settings.difficulty];

  const finishRound = () => {
    if (!answered || submittedRound.current === progress.round) return;
    submittedRound.current = progress.round;
    progress.submit(picked === question.correct);
    setPicked(null);
    setExpired(false);
    answerLocked.current = false;
  };
  const finishRef = useRef(finishRound);
  finishRef.current = finishRound;

  useEffect(() => {
    if (!answered || settings.advanceMode !== 'auto') return;
    const timeout = window.setTimeout(() => finishRef.current(), settings.autoAdvanceDelayMs);
    return () => window.clearTimeout(timeout);
  }, [answered, settings.advanceMode, settings.autoAdvanceDelayMs, progress.round]);

  const timer = useAnswerTimer({
    seconds, running: !answered && !progress.done, resetKey: progress.round,
    onExpire: () => {
      if (answerLocked.current) return;
      answerLocked.current = true;
      setExpired(true);
    },
  });

  const restart = () => {
    setDeck(createQuestionDeck(id, settings.language, settings.notation));
    setPicked(null);
    setExpired(false);
    answerLocked.current = false;
    submittedRound.current = null;
    progress.restart();
  };

  return (
    <GameShell title={t(`games.${id}`)} onExit={onExit} progress={{ ...progress, restart }}>
      <div className="module-question">
        <p className="question-prompt">{question.prompt}</p>
        <div className="question-illustration"><QuestionIllustration visual={question.visual} reveal={answered} /></div>
        {seconds !== null && <TimerBar fraction={timer.fraction} />}
        <AnswerBank choices={question.choices} correctValue={question.correct} lastPick={picked ?? undefined}
          reveal={expired} disabled={answered} onPick={value => {
            if (answerLocked.current) return;
            answerLocked.current = true;
            setPicked(value);
          }} />
        {answered && <div className="answer-feedback" role="status">
          <strong style={{ color: picked === question.correct ? 'var(--accent)' : 'var(--warn)' }}>
            {t(expired ? 'module.timeUp' : picked === question.correct ? 'module.correct' : 'module.review')}
          </strong>
          <p>{question.explanation}</p>
          {question.fretKey && <Fretboard positions={fretsForVexKey(question.fretKey).slice(0, 1)} />}
        </div>}
        {answered && settings.advanceMode === 'manual' && <ContinueButton onClick={finishRound} />}
      </div>
    </GameShell>
  );
}
