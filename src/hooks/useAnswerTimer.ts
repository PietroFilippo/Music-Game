import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../types';

export const DIFFICULTY_SECONDS: Record<Difficulty, number | null> = {
  none: null,
  easy: 15,
  medium: 8,
  hard: 4,
};

const TICK_MS = 100;

interface Options {
  seconds: number | null;
  running: boolean;
  resetKey: unknown;
  onExpire: () => void;
}

export function useAnswerTimer({ seconds, running, resetKey, onExpire }: Options) {
  const totalMs = seconds === null ? null : seconds * 1000;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setRemainingMs(seconds === null ? null : seconds * 1000);
  }, [resetKey, seconds]);

  useEffect(() => {
    if (!running || seconds === null) return;
    const id = window.setInterval(() => {
      setRemainingMs(prev => (prev === null ? prev : Math.max(prev - TICK_MS, 0)));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, seconds, resetKey]);

  useEffect(() => {
    if (remainingMs === 0 && running && !firedRef.current) {
      firedRef.current = true;
      expireRef.current();
    }
  }, [remainingMs, running]);

  const fraction = totalMs === null || remainingMs === null ? 1 : remainingMs / totalMs;
  return { fraction };
}
