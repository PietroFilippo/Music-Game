import { describe, expect, it } from 'vitest';
import {
  chordMidi, chordNotes, chordSymbol, SEVENTH_QUALITIES, SEVENTHS, spellChordTone, spellsCleanly, TRIAD_QUALITIES, TRIADS,
} from './chords';
import { spelledPitchClass, type SpelledNote } from './notes';

const n = (name: string): SpelledNote => ({ letter: name[0] as SpelledNote['letter'], accidental: (name[1] ?? '') as SpelledNote['accidental'] });
const names = (notes: SpelledNote[] | null) => notes?.map(x => `${x.letter}${x.accidental}`).join(' ');

describe('chords', () => {
  it('spells triads by letter distance', () => {
    expect(names(chordNotes(n('C'), TRIADS.major))).toBe('C E G');
    expect(names(chordNotes(n('A'), TRIADS.minor))).toBe('A C E');
    expect(names(chordNotes(n('B'), TRIADS.diminished))).toBe('B D F');
    expect(names(chordNotes(n('C'), TRIADS.augmented))).toBe('C E G#');
    expect(names(chordNotes(n('Eb'), TRIADS.major))).toBe('Eb G Bb');
    expect(names(chordNotes(n('F#'), TRIADS.minor))).toBe('F# A C#');
  });

  it('spells seventh chords, including the diminished 7th', () => {
    expect(names(chordNotes(n('C'), SEVENTHS.maj7))).toBe('C E G B');
    expect(names(chordNotes(n('G'), SEVENTHS.dom7))).toBe('G B D F');
    expect(names(chordNotes(n('D'), SEVENTHS.m7))).toBe('D F A C');
    expect(names(chordNotes(n('B'), SEVENTHS.m7b5))).toBe('B D F A');
    expect(names(chordNotes(n('B'), SEVENTHS.dim7))).toBe('B D F Ab');
    expect(names(chordNotes(n('A'), SEVENTHS.mMaj7))).toBe('A C E G#');
    expect(names(chordNotes(n('C'), SEVENTHS['maj7#5']))).toBe('C E G# B');
  });

  it('refuses spellings that need a double accidental', () => {
    // C°7 is C E♭ G♭ B𝄫.
    expect(chordNotes(n('C'), SEVENTHS.dim7)).toBeNull();
    expect(spellChordTone(n('G#'), TRIADS.augmented.tones[2])).toBeNull();
  });

  it('keeps every quality consistent with its semitones', () => {
    for (const quality of [...TRIAD_QUALITIES.map(q => TRIADS[q]), ...SEVENTH_QUALITIES.map(q => SEVENTHS[q])]) {
      for (const root of ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#'].map(n)) {
        const notes = chordNotes(root, quality);
        if (!notes) continue;
        notes.forEach((note, i) => {
          expect((spelledPitchClass(note) - spelledPitchClass(root) + 12) % 12).toBe(quality.tones[i].semitones % 12);
        });
      }
    }
  });

  it('flags rare spellings', () => {
    expect(spellsCleanly(n('C'), TRIADS.major)).toBe(true);
    expect(spellsCleanly(n('C#'), TRIADS.major)).toBe(false); // E♯
    expect(spellsCleanly(n('D'), SEVENTHS.dim7)).toBe(false); // C♭
    expect(spellsCleanly(n('E'), SEVENTHS.dim7)).toBe(true);
  });

  it('writes Brazilian and American chord symbols with letter names', () => {
    expect(chordSymbol(n('C'), SEVENTHS.maj7, 'pt')).toBe('C7M');
    expect(chordSymbol(n('C'), SEVENTHS.maj7, 'en')).toBe('Cmaj7');
    expect(chordSymbol(n('Bb'), TRIADS.minor, 'pt')).toBe('B♭m');
    expect(chordSymbol(n('B'), SEVENTHS.m7b5, 'pt')).toBe('Bm7(♭5)');
    expect(chordSymbol(n('B'), TRIADS.diminished, 'en')).toBe('B°');
  });

  it('stacks sounding pitches from the root', () => {
    expect(chordMidi(48, TRIADS.major)).toEqual([48, 52, 55]);
    expect(chordMidi(45, SEVENTHS.m7)).toEqual([45, 48, 52, 55]);
  });
});
