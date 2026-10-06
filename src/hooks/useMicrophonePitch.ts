import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from '../audio/pitch';

export type MicStatus = 'idle' | 'starting' | 'listening' | 'error';
export type MicError = 'unsupported' | 'denied' | 'unavailable';

const FFT_SIZE = 4096;
const INTERVAL_MS = 60;
const MIN_CLARITY = 0.85;
const HOLD_MS = 1500;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Listens to the microphone and reports the played pitch, smoothed over the
// last few readings. Audio stays on the device; nothing is recorded.
export function useMicrophonePitch() {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [error, setError] = useState<MicError | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const session = useRef<(() => void) | null>(null);
  // Bumped on stop and unmount so a permission prompt answered later is ignored.
  const generation = useRef(0);

  const stop = useCallback(() => {
    generation.current++;
    session.current?.();
    session.current = null;
    setStatus('idle');
    setFrequency(null);
  }, []);

  useEffect(() => () => {
    generation.current++;
    session.current?.();
  }, []);

  const start = useCallback(async () => {
    if (session.current) return;
    const media = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
    if (!media?.getUserMedia || typeof AudioContext === 'undefined') {
      setStatus('error');
      setError('unsupported');
      return;
    }
    const current = ++generation.current;
    setStatus('starting');
    setError(null);
    let stream: MediaStream;
    try {
      // Browser voice processing distorts musical notes, so turn it off.
      stream = await media.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      if (current !== generation.current) return;
      const name = e instanceof DOMException ? e.name : '';
      setStatus('error');
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
      return;
    }
    if (current !== generation.current) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Float32Array(FFT_SIZE);
    const recent: number[] = [];
    let lastHeard = 0;
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buffer);
      const pitch = detectPitch(buffer, ctx.sampleRate);
      const now = performance.now();
      if (pitch && pitch.clarity >= MIN_CLARITY) {
        // A jump of more than a semitone is a new note: drop the old readings.
        const last = recent[recent.length - 1];
        if (last && Math.abs(1200 * Math.log2(pitch.frequency / last)) > 100) recent.length = 0;
        recent.push(pitch.frequency);
        if (recent.length > 5) recent.shift();
        lastHeard = now;
        setFrequency(median(recent));
      } else if (now - lastHeard > HOLD_MS) {
        recent.length = 0;
        setFrequency(null);
      }
    }, INTERVAL_MS);
    session.current = () => {
      window.clearInterval(timer);
      stream.getTracks().forEach(track => track.stop());
      void ctx.close();
    };
    setStatus('listening');
  }, []);

  return { status, error, frequency, start, stop };
}
