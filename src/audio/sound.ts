// Feedback sounds synthesized in the browser as plucked strings
// (Karplus–Strong), so the app ships no audio files. The same pluck can strum
// chords when later modules need them.

export type SoundEffect = 'correct' | 'wrong' | 'complete';

interface Pattern {
  notes: number[]; // MIDI numbers, played in order
  spacing: number; // seconds between notes
  damping: number; // lower values mute the string sooner
  gain: number;
}

const EFFECTS: Record<SoundEffect, Pattern> = {
  // A quick upward strum of E major (E4 G♯4 B4).
  correct: { notes: [64, 68, 71], spacing: 0.03, damping: 0.996, gain: 0.18 },
  // Two muted low notes stepping down (F3 to E3).
  wrong: { notes: [53, 52], spacing: 0.12, damping: 0.97, gain: 0.3 },
  // An E major arpeggio across the strings.
  complete: { notes: [52, 59, 64, 68, 71, 76], spacing: 0.08, damping: 0.997, gain: 0.16 },
};

const SECONDS = 1.2;

let context: AudioContext | null | undefined;
const buffers = new Map<string, AudioBuffer>();

function audioContext(): AudioContext | null {
  if (context === undefined) {
    const Context = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    try {
      context = Context ? new Context() : null;
    } catch {
      context = null;
    }
  }
  if (context?.state === 'suspended') void context.resume().catch(() => {});
  return context;
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

// A noise burst circulating through a short averaging delay line decays like a plucked string.
export function pluckSamples(frequency: number, sampleRate: number, seconds: number, damping: number): Float32Array {
  const out = new Float32Array(Math.round(sampleRate * seconds));
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const ring = new Float32Array(period);
  let previous = 0;
  for (let i = 0; i < period; i++) {
    const noise = Math.random() * 2 - 1;
    ring[i] = (noise + previous) / 2; // a softer attack than raw noise
    previous = noise;
  }
  for (let i = 0; i < out.length; i++) {
    const j = i % period;
    out[i] = ring[j];
    ring[j] = damping * 0.5 * (ring[j] + ring[(j + 1) % period]);
  }
  return out;
}

function pluck(ctx: AudioContext, midi: number, at: number, damping: number, gain: number) {
  const key = `${midi}:${damping}`;
  let buffer = buffers.get(key);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * SECONDS), ctx.sampleRate);
    buffer.getChannelData(0).set(pluckSamples(midiToFrequency(midi), ctx.sampleRate, SECONDS, damping));
    buffers.set(key, buffer);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, at);
  amp.gain.exponentialRampToValueAtTime(0.001, at + SECONDS);
  source.connect(amp).connect(ctx.destination);
  source.start(at);
}

// Pluck MIDI notes in order: one note, a strummed chord or an arpeggio.
export function playNotes(notes: number[], { spacing = 0, damping = 0.996, gain = 0.25 } = {}): void {
  const ctx = audioContext();
  if (!ctx) return;
  const start = ctx.currentTime + 0.01;
  notes.forEach((midi, i) => pluck(ctx, midi, start + i * spacing, damping, gain));
}

export function playEffect(effect: SoundEffect): void {
  playNotes(EFFECTS[effect].notes, EFFECTS[effect]);
}
