import { useEffect, useRef, useState } from 'react';
import { playEffect, type SoundEffect } from '../audio/sound';
import { useSettings } from '../SettingsContext';
import { recordAttempt, type AttemptResult } from '../store/attempts';
import type { GameId } from '../types';
import { DIFFICULTY_SECONDS, useAnswerTimer } from './useAnswerTimer';
import { useGameProgress, type GameProgress } from './useGameProgress';

interface Answer<V> {
  value: V;
  correct: boolean;
}

/** What a round asked and how it was answered, for the results screen. */
export interface RoundReview {
  prompt: string;
  correct: string;
  /** The player's answer; absent when time ran out. */
  given?: string;
}

export interface ReviewedRound extends RoundReview {
  round: number;
  result: AttemptResult;
}

export interface QuizRound<V> {
  progress: GameProgress;
  picked: V | undefined;
  expired: boolean;
  answered: boolean;
  correct: boolean;
  /** Seconds per round, or null when untimed. */
  seconds: number | null;
  timerFraction: number;
  /** Manual advance mode: show a Continue button that calls `next`. */
  needsContinue: boolean;
  /** Every answered round of the current play, in order. */
  reviews: ReviewedRound[];
  pick: (value: V, correct: boolean) => void;
  next: () => void;
}

interface Options<V> {
  /** Stable ID of the question shown in the current round, for answer history. */
  itemId?: () => string;
  /** Describes the current round for the results screen. */
  review?: (picked: V | undefined) => RoundReview;
  onRestart?: () => void;
}

// One answer or timeout per round, then the round is submitted once: after the
// configured delay in automatic mode, or by `next` in manual mode. Pending
// timers are cleared when the round changes or the game unmounts. Answers,
// timeouts and the finished quiz play feedback sounds unless sound is off.
// Each answer or timeout is recorded against the question's stable ID.
export function useQuizRound<V>(gameId: GameId, rounds: number, options: Options<V> = {}): QuizRound<V> {
  const { settings } = useSettings();
  const progress = useGameProgress(gameId, rounds);
  const [answer, setAnswer] = useState<Answer<V> | null>(null);
  const [expired, setExpired] = useState(false);
  const [reviews, setReviews] = useState<ReviewedRound[]>([]);
  const locked = useRef(false);
  const submittedRound = useRef<number | null>(null);
  const answered = answer !== null || expired;
  const seconds = DIFFICULTY_SECONDS[settings.difficulty];
  const sound = (effect: SoundEffect) => {
    if (settings.sound) playEffect(effect);
  };
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const roundStartedAt = useRef(Date.now());

  useEffect(() => {
    roundStartedAt.current = Date.now();
  }, [progress.round]);

  const record = (result: AttemptResult, picked?: V) => {
    const itemId = optionsRef.current.itemId?.();
    if (itemId) recordAttempt(gameId, itemId, result, Date.now() - roundStartedAt.current);
    const review = optionsRef.current.review?.(picked);
    if (review) {
      const round = progress.round + 1;
      setReviews(previous => [...previous.filter(r => r.round !== round), { ...review, round, result }]);
    }
  };

  useEffect(() => {
    if (progress.done) soundRef.current('complete');
  }, [progress.done]);

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
      sound('wrong');
      record('timeout');
    },
  });

  const pick = (value: V, correct: boolean) => {
    if (locked.current) return;
    locked.current = true;
    setAnswer({ value, correct });
    sound(correct ? 'correct' : 'wrong');
    record(correct ? 'correct' : 'wrong', value);
  };

  const restart = () => {
    setAnswer(null);
    setExpired(false);
    setReviews([]);
    locked.current = false;
    submittedRound.current = null;
    roundStartedAt.current = Date.now();
    optionsRef.current.onRestart?.();
    progress.restart();
  };

  return {
    progress: { ...progress, restart },
    picked: answer?.value,
    expired,
    answered,
    correct: answer?.correct ?? false,
    seconds,
    timerFraction: timer.fraction,
    needsContinue: answered && settings.advanceMode === 'manual',
    reviews,
    pick,
    next,
  };
}
