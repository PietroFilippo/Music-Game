import { useEffect, useRef, useState } from 'react';
import { recordScore } from '../store/scores';
import type { GameId } from '../types';

export interface GameProgress {
  round: number;
  totalRounds: number;
  history: boolean[];
  done: boolean;
  correctCount: number;
  submit: (correct: boolean) => void;
  restart: () => void;
}

export function useGameProgress(gameId: GameId, totalRounds: number): GameProgress {
  const [history, setHistory] = useState<boolean[]>([]);
  const scoreRecorded = useRef(false);

  const done = history.length >= totalRounds;
  const correctCount = history.filter(Boolean).length;
  const round = Math.min(history.length, Math.max(totalRounds - 1, 0));

  useEffect(() => {
    if (!done || scoreRecorded.current) return;
    const pct = Math.round((correctCount / totalRounds) * 100);
    recordScore(gameId, pct);
    scoreRecorded.current = true;
  }, [correctCount, done, gameId, totalRounds]);

  const submit = (correct: boolean) => {
    setHistory(prev => {
      if (prev.length >= totalRounds) return prev;
      const next = [...prev, correct];
      return next;
    });
  };

  const restart = () => {
    scoreRecorded.current = false;
    setHistory([]);
  };

  return {
    round,
    totalRounds,
    history,
    done,
    correctCount,
    submit,
    restart,
  };
}
