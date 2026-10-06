import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../SettingsContext';
import type { GameId } from '../types';
import { DIFFICULTY_SECONDS, useAnswerTimer } from './useAnswerTimer';
import { useGameProgress, type GameProgress } from './useGameProgress';

interface Answer<V> {
  value: V;
  correct: boolean;
}

export interface QuizRound<V> {
  progress: GameProgress;
  picked: V | undefined;
  expired: boolean;
  answered: boolean;
  correct: boolean;
  timed: boolean;
  timerFraction: number;
  /** Manual advance mode: show a Continue button that calls `next`. */
  needsContinue: boolean;
  pick: (value: V, correct: boolean) => void;
  next: () => void;
}

// One answer or timeout per round, then the round is submitted once: after the
// configured delay in automatic mode, or by `next` in manual mode. Pending
// timers are cleared when the round changes or the game unmounts.
export function useQuizRound<V>(gameId: GameId, rounds: number, onRestart?: () => void): QuizRound<V> {
  const { settings } = useSettings();
  const progress = useGameProgress(gameId, rounds);
  const [answer, setAnswer] = useState<Answer<V> | null>(null);
  const [expired, setExpired] = useState(false);
  const locked = useRef(false);
  const submittedRound = useRef<number | null>(null);
  const answered = answer !== null || expired;
  const seconds = DIFFICULTY_SECONDS[settings.difficulty];

  const next = () => {
    if (!answered || submittedRound.current === progress.round) return;
    submittedRound.current = progress.round;
    progress.submit(answer?.correct ?? false);
    setAnswer(null);
    setExpired(false);
    locked.current = false;
  };
  const nextRef = useRef(next);
  nextRef.current = next;

  useEffect(() => {
    if (!answered || settings.advanceMode !== 'auto') return;
    const timeout = window.setTimeout(() => nextRef.current(), settings.autoAdvanceDelayMs);
    return () => window.clearTimeout(timeout);
  }, [answered, settings.advanceMode, settings.autoAdvanceDelayMs, progress.round]);

  const timer = useAnswerTimer({
    seconds,
    running: !answered && !progress.done,
    resetKey: progress.round,
    onExpire: () => {
      if (locked.current) return;
      locked.current = true;
      setExpired(true);
    },
  });

  const pick = (value: V, correct: boolean) => {
    if (locked.current) return;
    locked.current = true;
    setAnswer({ value, correct });
  };

  const restart = () => {
    setAnswer(null);
    setExpired(false);
    locked.current = false;
    submittedRound.current = null;
    onRestart?.();
    progress.restart();
  };

  return {
    progress: { ...progress, restart },
    picked: answer?.value,
    expired,
    answered,
    correct: answer?.correct ?? false,
    timed: seconds !== null,
    timerFraction: timer.fraction,
    needsContinue: answered && settings.advanceMode === 'manual',
    pick,
    next,
  };
}
