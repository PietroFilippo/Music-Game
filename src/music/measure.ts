import type { FretPosition } from './guitar';

export type MeasureDuration = 'w' | 'h' | 'q' | '8';
export const DURATION_BEATS: Record<MeasureDuration, number> = { w: 4, h: 2, q: 1, '8': 0.5 };

/** One guitar note; the staff pitch is derived from its tab position. */
export interface MeasureNote {
  position: FretPosition;
  duration: MeasureDuration;
}
