import { OPEN_STRING_MIDI } from '../music/guitar';
import { centsBetween, frequencyToNote } from './pitch';

/** Within this many cents of the target, a string counts as in tune. */
export const IN_TUNE_CENTS = 5;

export interface TuningReading {
  frequency: number;
  /** Nearest open string in standard tuning, 0 = 1st (high E). */
  string: number;
  /** Distance from that open string's note; negative means too low. */
  cents: number;
  /** Nearest note actually heard. */
  midi: number;
  state: 'inTune' | 'low' | 'high';
}

export function readTuning(frequency: number): TuningReading {
  const distance = (s: number) => Math.abs(centsBetween(frequency, OPEN_STRING_MIDI[s]));
  const string = OPEN_STRING_MIDI.reduce((best, _, s) => (distance(s) < distance(best) ? s : best), 0);
  const cents = Math.round(centsBetween(frequency, OPEN_STRING_MIDI[string]));
  return {
    frequency,
    string,
    cents,
    midi: frequencyToNote(frequency).midi,
    state: Math.abs(cents) <= IN_TUNE_CENTS ? 'inTune' : cents < 0 ? 'low' : 'high',
  };
}
