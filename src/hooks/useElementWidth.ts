import { useEffect, useState, type RefObject } from 'react';

// The content width of an element, updated as it resizes; `fallback` where
// ResizeObserver is unavailable (tests) or before the first measurement.
export function useElementWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      // Coalesce a drag-resize into one update per frame.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref]);
  return width;
}
