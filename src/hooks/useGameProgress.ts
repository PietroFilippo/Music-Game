import { useState } from 'react';
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
  const [round, setRound] = useState(0);
  const [history, setHistory] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const submit = (correct: boolean) => {
    setHistory(prev => {
      const next = [...prev, correct];
      if (next.length >= totalRounds) {
        const pct = Math.round((next.filter(Boolean).length / totalRounds) * 100);
        recordScore(gameId, pct);
        setDone(true);
      } else {
        setRound(r => r + 1);
      }
      return next;
    });
  };

  const restart = () => {
    setRound(0);
    setHistory([]);
    setDone(false);
  };

  return {
    round,
    totalRounds,
    history,
    done,
    correctCount: history.filter(Boolean).length,
    submit,
    restart,
  };
}
