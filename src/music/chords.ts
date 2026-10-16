import type { Language } from '../types';
import { LETTERS, PITCH_CLASS, type Accidental, type SpelledNote } from './notes';

/** A chord tone: its letter distance from the root (3 = a 3rd), size in semitones and degree label. */
export interface ChordTone {
  number: number;
  semitones: number;
  degree: string;
}

export interface ChordQuality {
  tones: ChordTone[];
  /** Suffix written after the root letter, e.g. "m" or "7M". Brazilian and American usage differ. */
  symbol: Record<Language, string>;
  /** Other suffixes the player will meet in songbooks and chord charts. */
  alternatives: Record<Language, string[]>;
  name: Record<Language, string>;
}

const ROOT: ChordTone = { number: 1, semitones: 0, degree: '1' };
const MAJOR_3RD: ChordTone = { number: 3, semitones: 4, degree: '3' };
const MINOR_3RD: ChordTone = { number: 3, semitones: 3, degree: '♭3' };
const PERFECT_5TH: ChordTone = { number: 5, semitones: 7, degree: '5' };
const DIMINISHED_5TH: ChordTone = { number: 5, semitones: 6, degree: '♭5' };
const AUGMENTED_5TH: ChordTone = { number: 5, semitones: 8, degree: '♯5' };
const MAJOR_7TH: ChordTone = { number: 7, semitones: 11, degree: '7' };
const MINOR_7TH: ChordTone = { number: 7, semitones: 10, degree: '♭7' };
// Written ♭♭7 rather than 𝄫7, which many phone fonts cannot draw.
const DIMINISHED_7TH: ChordTone = { number: 7, semitones: 9, degree: '♭♭7' };

export const TRIAD_QUALITIES = ['major', 'minor', 'diminished', 'augmented'] as const;
export type TriadQuality = typeof TRIAD_QUALITIES[number];

export const TRIADS: Record<TriadQuality, ChordQuality> = {
  major: {
    tones: [ROOT, MAJOR_3RD, PERFECT_5TH],
    symbol: { pt: '', en: '' },
    alternatives: { pt: [], en: ['maj'] },
    name: { pt: 'maior', en: 'major' },
  },
  minor: {
    tones: [ROOT, MINOR_3RD, PERFECT_5TH],
    symbol: { pt: 'm', en: 'm' },
    alternatives: { pt: [], en: ['min', '-'] },
    name: { pt: 'menor', en: 'minor' },
  },
  diminished: {
    tones: [ROOT, MINOR_3RD, DIMINISHED_5TH],
    // In Brazilian chord charts ° usually means the four-note diminished chord.
    symbol: { pt: 'm(♭5)', en: '°' },
    alternatives: { pt: ['dim'], en: ['dim'] },
    name: { pt: 'diminuta', en: 'diminished' },
  },
  augmented: {
    tones: [ROOT, MAJOR_3RD, AUGMENTED_5TH],
    symbol: { pt: '(♯5)', en: '+' },
    alternatives: { pt: ['+', 'aum'], en: ['aug', '(♯5)'] },
    name: { pt: 'aumentada', en: 'augmented' },
  },
};

export const SEVENTH_QUALITIES = ['maj7', 'dom7', 'm7', 'm7b5', 'dim7', 'mMaj7', 'maj7#5'] as const;
export type SeventhQuality = typeof SEVENTH_QUALITIES[number];

export const SEVENTHS: Record<SeventhQuality, ChordQuality> = {
  maj7: {
    tones: [ROOT, MAJOR_3RD, PERFECT_5TH, MAJOR_7TH],
    symbol: { pt: '7M', en: 'maj7' },
    alternatives: { pt: ['7+', 'maj7'], en: ['Δ', 'M7'] },
    name: { pt: 'maior com sétima maior', en: 'major seventh' },
  },
  dom7: {
    tones: [ROOT, MAJOR_3RD, PERFECT_5TH, MINOR_7TH],
    symbol: { pt: '7', en: '7' },
    alternatives: { pt: [], en: [] },
    name: { pt: 'dominante (maior com sétima menor)', en: 'dominant seventh' },
  },
  m7: {
    tones: [ROOT, MINOR_3RD, PERFECT_5TH, MINOR_7TH],
    symbol: { pt: 'm7', en: 'm7' },
    alternatives: { pt: [], en: ['min7', '-7'] },
    name: { pt: 'menor com sétima', en: 'minor seventh' },
  },
  m7b5: {
    tones: [ROOT, MINOR_3RD, DIMINISHED_5TH, MINOR_7TH],
    symbol: { pt: 'm7(♭5)', en: 'm7♭5' },
    alternatives: { pt: ['ø'], en: ['ø'] },
    name: { pt: 'meio-diminuto', en: 'half-diminished' },
  },
  dim7: {
    tones: [ROOT, MINOR_3RD, DIMINISHED_5TH, DIMINISHED_7TH],
    symbol: { pt: '°', en: '°7' },
    alternatives: { pt: ['dim', '°7'], en: ['dim7'] },
    name: { pt: 'diminuto', en: 'diminished seventh' },
  },
  mMaj7: {
    tones: [ROOT, MINOR_3RD, PERFECT_5TH, MAJOR_7TH],
    symbol: { pt: 'm7M', en: 'm(maj7)' },
    alternatives: { pt: ['m(7M)'], en: ['mM7', 'm(Δ)'] },
    name: { pt: 'menor com sétima maior', en: 'minor-major seventh' },
  },
  'maj7#5': {
    tones: [ROOT, MAJOR_3RD, AUGMENTED_5TH, MAJOR_7TH],
    symbol: { pt: '7M(♯5)', en: 'maj7♯5' },
    alternatives: { pt: ['7M(+5)'], en: ['+maj7', 'Δ♯5'] },
    name: { pt: 'aumentado com sétima maior', en: 'augmented major seventh' },
  },
};

const SHIFT: Record<Accidental, number> = { '': 0, '#': 1, b: -1 };
const ACCIDENTAL_FOR: Record<number, Accidental> = { [-1]: 'b', 0: '', 1: '#' };
const SIGN: Record<Accidental, string> = { '': '', '#': '♯', b: '♭' };

/**
 * The note a chord tone above a root, spelled by letter distance: the ♭5 of B
 * is F, the ♯5 of C is G♯. Returns null when it would need a double sharp or flat.
 */
export function spellChordTone(root: SpelledNote, tone: ChordTone): SpelledNote | null {
  const letter = LETTERS[(LETTERS.indexOf(root.letter) + tone.number - 1) % 7];
  const rootPitch = PITCH_CLASS[root.letter] + SHIFT[root.accidental];
  const natural = (PITCH_CLASS[letter] - rootPitch + 24) % 12;
  let diff = tone.semitones - natural;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  const accidental = ACCIDENTAL_FOR[diff];
  return accidental === undefined ? null : { letter, accidental };
}

/** The chord's notes from the root up, or null if any tone needs a double accidental. */
export function chordNotes(root: SpelledNote, quality: ChordQuality): SpelledNote[] | null {
  const notes = quality.tones.map(tone => spellChordTone(root, tone));
  return notes.every((n): n is SpelledNote => n !== null) ? notes : null;
}

// E♯, B♯, F♭ and C♭ are correct spellings in some keys, but the course does not use them yet.
const RARE = new Set(['E#', 'B#', 'Fb', 'Cb']);

/** True if the chord spells with single accidentals and without E♯, B♯, F♭ or C♭. */
export function spellsCleanly(root: SpelledNote, quality: ChordQuality): boolean {
  const notes = chordNotes(root, quality);
  return notes !== null && notes.every(n => !RARE.has(`${n.letter}${n.accidental}`));
}

/**
 * A chord symbol such as "Am", "B°" or "C7M". Chord symbols use letter names
 * in both languages, whatever the solfege setting.
 */
export function chordSymbol(root: SpelledNote, quality: ChordQuality, language: Language): string {
  return `${root.letter}${SIGN[root.accidental]}${quality.symbol[language]}`;
}

/** Sounding MIDI notes of a close-position chord built up from a root. */
export function chordMidi(rootMidi: number, quality: ChordQuality): number[] {
  return quality.tones.map(tone => rootMidi + tone.semitones);
}
