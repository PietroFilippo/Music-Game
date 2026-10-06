import { describe, expect, it } from 'vitest';
import { OPEN_STRING_MIDI } from '../music/guitar';
import { centsBetween, detectPitch, frequencyToNote } from './pitch';
import { midiToFrequency, pluckSamples } from './sound';

const RATE = 48000;
const SIZE = 4096;

function tone(frequency: number, harmonics: number[] = [1], offset = 0): Float32Array {
  const out = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    const t = (i + offset) / RATE;
    out[i] = harmonics.reduce((sum, amp, h) => sum + amp * Math.sin(2 * Math.PI * frequency * (h + 1) * t), 0) * 0.3;
  }
  return out;
}

describe('pitch detection', () => {
  it('finds the frequency of a pure tone', () => {
    const reading = detectPitch(tone(440), RATE)!;
    expect(Math.abs(centsBetween(reading.frequency, 69))).toBeLessThan(2);
    expect(reading.clarity).toBeGreaterThan(0.9);
  });

  it('reads low E by its fundamental even when the harmonics are louder', () => {
    const reading = detectPitch(tone(82.41, [0.4, 1, 0.8, 0.6, 0.3]), RATE)!;
    expect(Math.abs(centsBetween(reading.frequency, 40))).toBeLessThan(5);
  });

  it('reads every open string of a synthesized plucked guitar', () => {
    for (const midi of OPEN_STRING_MIDI) {
      // Skip the noisy attack, as a player's first moments of a note would be.
      const pluck = pluckSamples(midiToFrequency(midi), RATE, 0.5, 0.996).subarray(4800, 4800 + SIZE);
      const reading = detectPitch(pluck, RATE)!;
      expect(reading).not.toBeNull();
      expect(Math.abs(centsBetween(reading.frequency, midi))).toBeLessThan(15);
    }
  });

  it('ignores silence and noise', () => {
    expect(detectPitch(new Float32Array(SIZE), RATE)).toBeNull();
    const noise = new Float32Array(SIZE).map(() => Math.random() * 0.6 - 0.3);
    expect(detectPitch(noise, RATE)).toBeNull();
  });

  it('names the nearest note and how far off it is', () => {
    expect(frequencyToNote(440)).toEqual({ midi: 69, cents: 0 });
    expect(frequencyToNote(110 * 2 ** (-20 / 1200))).toEqual({ midi: 45, cents: -20 });
    expect(frequencyToNote(82.41 * 2 ** (30 / 1200))).toEqual({ midi: 40, cents: 30 });
  });
});
