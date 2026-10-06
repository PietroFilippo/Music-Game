import { describe, expect, it } from 'vitest';
import { midiToFrequency, playEffect, pluckSamples } from './sound';

describe('plucked-string synthesis', () => {
  it('converts MIDI notes to equal-tempered frequencies', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(40)).toBeCloseTo(82.41, 2);
  });

  it('produces a bounded tone that fades, faster when muted', () => {
    const energy = (samples: Float32Array, from: number, to: number) =>
      samples.subarray(from, to).reduce((sum, x) => sum + x * x, 0);
    const ringing = pluckSamples(329.63, 48000, 1.2, 0.996);
    const muted = pluckSamples(329.63, 48000, 1.2, 0.97);
    expect(ringing).toHaveLength(57600);
    expect(ringing.every(x => Math.abs(x) <= 1)).toBe(true);
    const tail = (s: Float32Array) => energy(s, 52800, 57600) / energy(s, 0, 4800);
    expect(tail(ringing)).toBeLessThan(0.2);
    expect(tail(muted)).toBeLessThan(tail(ringing) / 100);
  });

  it('does nothing where Web Audio is unavailable', () => {
    expect(() => playEffect('correct')).not.toThrow();
  });
});
