import { useEffect, useRef, useState } from 'react';
import { getScore, recordScore } from '../store/scores';
import { useSettings } from '../SettingsContext';
import type { GameId } from '../types';

/** The saved scores from before the play that just finished, for comparison. */
export interface PlaySummary {
  previousBest?: number;
  previousLast?: number;
}

export interface GameProgress {
  round: number;
  totalRounds: number;
  history: boolean[];
  done: boolean;
  correctCount: number;
  summary: PlaySummary | null;
  submit: (correct: boolean) => void;
  restart: () => void;
}

export function useGameProgress(gameId: GameId, totalRounds: number): GameProgress {
  const { settings } = useSettings();
  const [history, setHistory] = useState<boolean[]>([]);
  const [summary, setSummary] = useState<PlaySummary | null>(null);
  const scoreRecorded = useRef(false);

  const done = history.length >= totalRounds;
  const correctCount = history.filter(Boolean).length;
  const round = Math.min(history.length, Math.max(totalRounds - 1, 0));

  useEffect(() => {
    if (!done || scoreRecorded.current) return;
    const before = getScore(gameId);
    const pct = Math.round((correctCount / totalRounds) * 100);
    recordScore(gameId, pct, settings.difficulty);
    scoreRecorded.current = true;
    setSummary({ previousBest: before?.best, previousLast: before?.last });
  }, [correctCount, done, gameId, totalRounds, settings.difficulty]);

  const submit = (correct: boolean) => {
    setHistory(prev => (prev.length >= totalRounds ? prev : [...prev, correct]));
  };

  const restart = () => {
    scoreRecorded.current = false;
    setSummary(null);
    setHistory([]);
  };

  return {
    round,
    totalRounds,
    history,
    done,
    correctCount,
    summary,
    submit,
    restart,
  };
}
