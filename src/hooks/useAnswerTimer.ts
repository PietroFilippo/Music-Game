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
  const [clock, setClock] = useState({ resetKey, seconds, remainingMs: totalMs });
  const currentRound = Object.is(clock.resetKey, resetKey) && clock.seconds === seconds;
  const remainingMs = currentRound ? clock.remainingMs : totalMs;
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setClock({ resetKey, seconds, remainingMs: seconds === null ? null : seconds * 1000 });
  }, [resetKey, seconds]);

  useEffect(() => {
    if (!running || seconds === null) return;
    const id = window.setInterval(() => {
      setClock(prev => ({
        ...prev,
        remainingMs: prev.remainingMs === null ? null : Math.max(prev.remainingMs - TICK_MS, 0),
      }));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, seconds, resetKey]);

  useEffect(() => {
    // A reset effect does not update state until the next render. Never expire
    // the new round using the previous round's remaining time.
    if (currentRound && remainingMs === 0 && running && !firedRef.current) {
      firedRef.current = true;
      expireRef.current();
    }
  }, [currentRound, remainingMs, running]);

  const fraction = totalMs === null || remainingMs === null ? 1 : remainingMs / totalMs;
  return { fraction };
}
