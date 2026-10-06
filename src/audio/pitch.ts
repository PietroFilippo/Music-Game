// Monophonic pitch detection with the YIN algorithm (de Cheveigné and
// Kawahara, 2002). Pure functions, so they can be tested with generated audio.

export interface PitchReading {
  frequency: number;
  /** 0–1; how periodic the signal is. Low values mean noise or silence. */
  clarity: number;
}

interface Options {
  /** Dips in the normalized difference below this value count as a period. */
  threshold?: number;
  minFrequency?: number;
  maxFrequency?: number;
  /** Signals quieter than this root-mean-square level are treated as silence. */
  minRms?: number;
}

export function detectPitch(samples: Float32Array, sampleRate: number, options: Options = {}): PitchReading | null {
  const { threshold = 0.15, minFrequency = 60, maxFrequency = 1400, minRms = 0.01 } = options;
  const window = Math.floor(samples.length / 2);
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(window - 1, Math.ceil(sampleRate / minFrequency));
  if (tauMax <= tauMin) return null;

  let energy = 0;
  for (let i = 0; i < samples.length; i++) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / samples.length) < minRms) return null;

  // Difference function, then its cumulative mean normalization.
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let j = 0; j < window; j++) {
      const delta = samples[j] - samples[j + tau];
      sum += delta * delta;
    }
    d[tau] = sum;
  }
  d[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += d[tau];
    d[tau] = running === 0 ? 1 : (d[tau] * tau) / running;
  }

  // The first dip under the threshold is the period; follow it to its bottom.
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (d[t] < threshold) {
      while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;

  // Parabolic interpolation between neighboring lags for sub-sample precision.
  let refined = tau;
  if (tau > 1 && tau < tauMax) {
    const [a, b, c] = [d[tau - 1], d[tau], d[tau + 1]];
    const denominator = a + c - 2 * b;
    if (denominator !== 0) refined = tau + (a - c) / (2 * denominator);
  }
  return { frequency: sampleRate / refined, clarity: Math.max(0, Math.min(1, 1 - d[tau])) };
}

export interface NoteReading {
  midi: number;
  /** Distance from the equal-tempered note (A4 = 440 Hz), −50 to +50. */
  cents: number;
}

export function frequencyToNote(frequency: number): NoteReading {
  const exact = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(exact);
  return { midi, cents: Math.round((exact - midi) * 100) };
}

export function centsBetween(frequency: number, midi: number): number {
  return 1200 * Math.log2(frequency / (440 * 2 ** ((midi - 69) / 12)));
}
