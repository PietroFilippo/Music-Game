import { describe, expect, it } from 'vitest';
import { readTuning } from './tuning';

const cents = (frequency: number, offset: number) => frequency * 2 ** (offset / 1200);

describe('tuning against standard open strings', () => {
  it('finds the nearest string and how far the note is from it', () => {
    expect(readTuning(cents(110, -20))).toMatchObject({ string: 4, cents: -20, midi: 45, state: 'low' });
    expect(readTuning(cents(329.63, 12))).toMatchObject({ string: 0, cents: 12, state: 'high' });
    expect(readTuning(cents(196, 3))).toMatchObject({ string: 2, state: 'inTune' });
  });

  it('still names the intended string when it is badly out of tune', () => {
    // A low E tuned about a semitone flat is heard as D♯2 but belongs to string 6.
    expect(readTuning(cents(82.41, -90))).toMatchObject({ string: 5, cents: -90, midi: 39, state: 'low' });
  });
});
