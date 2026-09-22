import type { Language } from '../types';

export const RHYTHM_VALUES = [
  { id: 'whole', beats: 4, flags: 0, hollow: true, stem: false, pt: 'Semibreve', en: 'Whole note' },
  { id: 'half', beats: 2, flags: 0, hollow: true, stem: true, pt: 'Mínima', en: 'Half note' },
  { id: 'quarter', beats: 1, flags: 0, hollow: false, stem: true, pt: 'Semínima', en: 'Quarter note' },
  { id: 'eighth', beats: 0.5, flags: 1, hollow: false, stem: true, pt: 'Colcheia', en: 'Eighth note' },
  { id: 'sixteenth', beats: 0.25, flags: 2, hollow: false, stem: true, pt: 'Semicolcheia', en: 'Sixteenth note' },
  { id: 'thirty-second', beats: 0.125, flags: 3, hollow: false, stem: true, pt: 'Fusa', en: 'Thirty-second note' },
  { id: 'sixty-fourth', beats: 0.0625, flags: 4, hollow: false, stem: true, pt: 'Semifusa', en: 'Sixty-fourth note' },
] as const;

export type RhythmId = typeof RHYTHM_VALUES[number]['id'];

export function beatLabel(beats: number, language: Language): string {
  const amount = beats < 1 ? `1/${1 / beats}` : String(beats);
  if (language === 'pt') return beats < 1 ? `${amount} de tempo` : `${amount} ${beats === 1 ? 'tempo' : 'tempos'}`;
  return `${amount} ${beats > 1 ? 'beats' : 'beat'}`;
}
