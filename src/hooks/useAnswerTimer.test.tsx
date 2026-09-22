import { StrictMode, useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnswerTimer } from './useAnswerTimer';

function useTimedRounds() {
  const [round, setRound] = useState(0);
  const [expired, setExpired] = useState(false);
  const timer = useAnswerTimer({
    seconds: 4,
    running: !expired,
    resetKey: round,
    onExpire: () => setExpired(true),
  });
  return {
    ...timer,
    expired,
    next: () => { setRound(r => r + 1); setExpired(false); },
  };
}

describe('answer timer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('gives the next round its full time after a timeout', () => {
    const { result } = renderHook(useTimedRounds, { wrapper: StrictMode });
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.expired).toBe(true);

    act(() => result.current.next());
    expect(result.current.expired).toBe(false);
    expect(result.current.fraction).toBe(1);
    act(() => vi.advanceTimersByTime(3900));
    expect(result.current.expired).toBe(false);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.expired).toBe(true);
  });

  it('pauses after an answer and cleans up on unmount', () => {
    const onExpire = vi.fn();
    const { result, rerender, unmount } = renderHook(({ running }) => useAnswerTimer({
      seconds: 4, running, resetKey: 0, onExpire,
    }), { initialProps: { running: true } });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.fraction).toBe(0.75);
    rerender({ running: false });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.fraction).toBe(0.75);
    expect(onExpire).not.toHaveBeenCalled();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never expires in untimed mode', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useAnswerTimer({
      seconds: null, running: true, resetKey: 0, onExpire,
    }));
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.fraction).toBe(1);
    expect(onExpire).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
