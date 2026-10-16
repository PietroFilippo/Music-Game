# Guitar curriculum roadmap

Updated 2026-10-15. Guitar and electric guitar are the primary instruments for this project.

## Original plan and present scope

The README at commit `09d4ca7` planned **four modules**: complete the remaining six topics of module 1, then build modules 2–4. It did not specify the topics of those later modules. The sequence below is a new proposal based on the guitar focus and the two teacher handouts reviewed on 2026-09-22.

| Module | Focus | Status |
| --- | --- | --- |
| 1 | Music-reading foundations: staff, clefs, note names, notation, rhythm symbols and sound properties | Ten bilingual lesson/quiz pairs available |
| 2 | Guitar fretboard, intervals and scale foundations | Interactive fretboard and seven bilingual lesson/quiz pairs available |
| 3 | Triads, chord shapes and triad arpeggios | Four bilingual lesson/quiz pairs available |
| 4 | Tetrads/seventh chords, four-note arpeggios and harmonic application | Four bilingual lesson/quiz pairs available |

All four sections can be expanded or collapsed independently, and the browser remembers the selection. A module opens by default while it has topics not yet played. Learner and real-instrument testing is pending for every module.

## Milestones

### 2026-10-06: Module 2 foundations

1. **Interactive guitar fretboard.** Positions can be selected with a pointer or keyboard. Labeled markers can show note names, roots or interval degrees, and strings can be highlighted. The Natural Notes lesson includes an explorer that shows any position's name, tablature and written note, every natural note, or one note repeated across the neck.
2. **Six of Module 2's bilingual lesson/quiz pairs**, using the existing practice settings and score tracking:
   - **Strings and Tuning**: string numbering, tab orientation, standard tuning, checking the tuning at the 5th fret (4th fret on string 3), and open strings on the staff.
   - **Natural Notes on the Neck**: semitones per fret, counting up from the open string, the octave at fret 12, and landmarks on the E strings.
   - **Sharps and Flats**: the frets between natural notes, a sharp as one fret up and a flat as one fret down, two names for one sound, accidentals on the staff, and a chromatic exercise on the 6th string.
   - **Octaves on the Neck**: the octave at fret 12, octave shapes two strings over, the extra fret when crossing the 3rd and 2nd strings, the same pitch on two strings, and an explorer with every octave highlighted.
   - **Intervals**: semitone distances, interval number and quality, interval shapes across strings, major against minor 3rds, and degrees leading to triads. Listen buttons play every example with the plucked-string synth.
   - **Major and Minor Scales**: the whole/half-step patterns, scale degrees, a three-notes-per-string shape that moves to other roots, the natural minor, and relative scales.

   Each lesson ends with a short exercise to play on a real guitar.
3. **Guitar notation correction.** Fretboard and tab feedback treat the treble staff as written guitar pitch, one octave above the sound. Module 1 lessons that named guitar positions were corrected to match. For example, the E on the bottom line is the 4th string at fret 2, and the open 1st string is the E in the top space.

### 2026-10-15: the remaining modules and spaced review

1. **Staff, Tab and Rhythm** completes Module 2. It covers written notes that can be played in several places, tab with rhythm stems, and counting 4/4 measures with whole, half, quarter and eighth notes.
2. **Module 3**, with four topics on triads; see [Module 3](#module-3-triads-and-arpeggios).
3. **Module 4**, with four topics on seventh chords; see [Module 4](#module-4-tetrads-and-harmonic-application).
4. **Review weak spots** and **Review these N**, scheduled with Leitner boxes; see [spaced review](#spaced-review-of-weak-notes).
5. **Listen in feedback.** Every fretboard question can play its answer: one note, an interval, a scale, a strummed chord or an arpeggio.
6. **Shared quiz engine.** Modules 2–4 share one fretboard quiz (`src/games/fretboard/`) and one chord-theory module (`src/music/chords.ts`). Every question has a stable ID, so a running quiz is redrawn when the language or notation changes.
7. **An audit of all existing content and code.** It enumerated every generated question in both languages and all notation modes and checked each answer independently; no wrong answers were found. It led to fixes in these areas:
   - the tuner's reference tones, which were up to 8 cents sharp;
   - timers that a stalled page could stretch, or that ran behind the Settings sheet;
   - microphone release after a failed audio setup;
   - accessibility of the reset dialog;
   - handling of malformed saved data;
   - several Portuguese and English wording errors;
   - distractors that gave answers away in Modules 3 and 4.

**Next step:** test all four modules with learners, on real guitars and on phones, where the fretboard's touch targets are small. Compare the generated triad and seventh-chord shapes with the teacher's handouts. Test the tuner with real guitars and setups before starting play-to-answer. Use the feedback to refine explanations, difficulty and navigation.

## Module 2: fretboard and intervals

Establish the knowledge needed to understand chord shapes:

- Standard tuning, string numbering, natural notes and accidentals on all six strings; octave relationships and repeated notes across the neck.
- Semitones, whole tones, intervals and scale degrees, including the tuning difference between the G and B strings.
- Major and natural minor scale construction, connected to note locations rather than only memorized patterns.
- Short rhythm and reading exercises that connect staff notation, tablature and the fretboard.

Suggested games: locate a named note, find its octave, identify the interval between two positions, and build a scale from its interval pattern.

**Status (2026-10-15):** all seven topics are implemented, including the reading topic, Staff, Tab and Rhythm.

## Module 3: triads and arpeggios

A triad has three distinct chord tones. Introduce major and minor first, then diminished and augmented. Connect each shape to its root, third and fifth, and show how changing an interval changes the chord quality.

- Play chord tones together as a chord and successively as an arpeggio.
- Explore root-position shapes and inversions on practical string groups.
- Learn major and minor arpeggios in multiple positions, then connect and transpose them.
- Apply the same notes to rhythm-guitar accompaniment and short lead-guitar phrases over simple progressions.

The teacher's **Arpejos de Tríades.pdf** is a one-page reference containing five major and five minor arpeggio diagrams. It belongs primarily here. It provides shapes; lessons should also explain their notes and degrees, and practice should vary the root/key.

Suggested games: build a triad, identify its quality, select its chord tones on the fretboard, and complete an ascending or descending arpeggio.

**Status (2026-10-15):** four topics are implemented: Building Triads, Inversions and String Sets, Triad Arpeggios, and Triads in Progressions. Shapes are generated and tested rather than copied from the handout:
- close voicings on the string sets 1–2–3 to 4–5–6, with the inversion set by the lowest note;
- introductory arpeggios with roots on strings 6, 5 and 4, skipping no strings and stretching at most three frets.

The progressions topic covers the harmonized major scale (I, IIm, IIIm, IV, V, VIm, VIIm(♭5) / I, ii, iii, IV, V, vi, vii°), I–IV–V, I–V–vi–IV and ii–V–I, transposition and common tones. The shapes still need comparing with **Arpejos de Tríades.pdf**.

## Module 4: tetrads and harmonic application

Extend triads with a fourth chord tone. Begin with major seventh, dominant seventh and minor seventh; then introduce half-diminished and diminished seventh, minor-major seventh, and augmented major seventh.

- Learn formulas and recognize how changing one degree changes the chord.
- Explore practical voicings with roots on strings 6, 5 and 4.
- Play the same four chord tones as arpeggios across positions.
- Connect chords through small movements of individual voices and target chord tones in solos.

The teacher's **Tétrades.pdf** is a two-page chord-voicing reference. It includes `7M`, `m7`, `m7(b5)`, `7`, `7M(#5)`, `m7M` and diminished symbols, with roots on strings 6, 5 and 4. Its layouts include degree orders `1–7–3–5`, `1–3–5–7` and `1–5–7–3`. These are different voicings with the root in the bass; changing the order above the bass does not by itself create an inversion. This handout belongs primarily in module 4.

Suggested games: identify a seventh-chord quality, find a missing chord tone, match a chord to its arpeggio, and choose a nearby voicing for the next chord.

**Status (2026-10-15):** four topics are implemented: Building Seventh Chords, Seventh-Chord Voicings on Strings 6, 5 and 4, Seventh-Chord Arpeggios, and Seventh Chords in Progressions.
- **Qualities and symbols.** The formulas cover `7M`/maj7, `7`, `m7`, `m7(♭5)`/m7♭5, `°`/°7, `m7M`/m(maj7) and `7M(♯5)`/maj7♯5, with Brazilian and American symbols side by side.
- **Voicings.** They are generated in the handout's layouts, as described above: 1–7–3–5 on strings 6–4–3–2 and 5–3–2–1, 1–5–7–3 on 5–4–3–2 and 4–3–2–1, and 1–3–5–7 on 4–3–2–1. Each has the root in the bass, every chord tone once, frets 0–12 and a span of at most five frets.
- **Progressions.** They cover the harmonized major scale in tetrads, ii–V–I in eight keys, guide tones (the 7th falling by step to the next 3rd) and chord-tone targets in solos.

The handout itself was not available when this was built, so these voicings follow its layouts as described in this roadmap. They should be compared with the handout and tried on real guitars, especially for the five-fret stretches and the muting of skipped strings.

## Practice features across modules

These features change how every module is practiced rather than adding curriculum. Spaced review is implemented; play-to-answer is not.

### Spaced review of weak notes

Track which notes and positions a player misses, and bring those back more often until they stick. Normal quiz decks stay random and evenly balanced; review is a separate mode.

- **Record results per question** (implemented 2026-10-06). Every quiz stores each answer or timeout under its question's stable ID: times seen, times correct, correct streak, last result and average answer time. The four original games derive IDs from the note, clef or counting step asked. They now have question banks that keep those IDs.
- **Schedule with Leitner boxes** (implemented 2026-10-15). A correct answer moves an item up a box and shows it less often; a miss or timeout sends it back to the first box. Boxes 1–5 are due after 0, 1, 3, 7 and 14 calendar days. Full algorithms such as SM-2 or FSRS are more than ten-round quizzes need.
- **A separate "Review weak spots" mode** (implemented 2026-10-15) rather than changes to the normal quizzes, so their scores stay comparable over time. Each module card opens an unscored session of up to ten due questions across the module's topics; with fewer due, the session is shorter. Results also offer Review these N, which replays a quiz's misses once each.
- **Group weakness by note as well as by question** (open). Missing B on the 2nd string in several games should count together. That also enables a fretboard accuracy map in Stats.
- Reset controls clear the per-question history too, including topics with history but no finished play.

### Play the note: microphone pitch detection

Let players answer by playing on the guitar instead of clicking. The browser detects the played pitch with the Web Audio API and a pitch algorithm: YIN, or the McLeod method used by the small `pitchy` library. Audio is processed on the device and never uploaded.

- **Start with a tuner screen** (implemented 2026-10-06). Grading assumes standard tuning (E A D G B E, A4 = 440 Hz), and a tuner is useful on its own. It also tests detection with each player's real microphone, amplifier or audio interface. The Tuner tab uses YIN detection (`src/audio/pitch.ts`) and a reusable microphone hook (`useMicrophonePitch`). It passed tests with generated waveforms and a Chrome fake-microphone check; it still needs testing on real guitars.
- **Compare sounding pitch.** The guitar sounds an octave below its notation, so a written E4 is graded against a sounding E3. Accept a cents tolerance (about ±40) instead of perfect intonation.
- **Know the limits:**
  - Microphone access needs HTTPS (or localhost) and the player's permission.
  - Disable the browser's echo cancellation, noise suppression and automatic gain, since they distort musical signals.
  - An unplugged electric guitar is quiet, so detection needs an amplifier or an audio interface.
  - Detectors sometimes report a note an octave too high, especially on the low strings.
- **Grade pitch, not position.** The same pitch can come from several strings, so the microphone cannot confirm which string or fret was used. It fits exercises like "play this written note" or "play the open strings from 6 to 1". "Find G on string 5" stays an on-screen answer.
- **Offer it as an optional answer mode** on existing quizzes; clicking still works. Timed rounds may need longer limits when playing.
- Test the pitch algorithm with generated waveforms (a fundamental plus harmonics, including low E at 82 Hz) in Vitest. Check microphone handling by hand on real instruments.

### Hear notes and chords

The quizzes already play short plucked-string sound effects for right and wrong answers. The same synthesized pluck plays the music itself, with no audio files:

- **Listen in feedback** (implemented 2026-10-15). Every fretboard question's feedback has a Listen button that plays the answer's sounding pitch, an octave below the written note: one note, both notes of an interval, a scale, a strummed chord or an arpeggio. It plays on request rather than automatically, so it does not overlap the right/wrong sound effect. The tuner plays each open string as a reference.
- In modules 3 and 4, lessons and feedback strum chords and play arpeggios, so players hear major against minor, or 7 against maj7. Ear-training questions such as "which chord did you hear?" are not built yet.

### Recommended order

1. ~~Start recording per-question results~~ (done).
2. ~~Build the tuner as a contained prototype of pitch detection~~ (done; test it on real guitars and setups).
3. ~~Add the "Review weak spots" mode~~ (done).
4. Add the play-to-answer mode to reading quizzes if the tuner works reliably on real setups. This waits for that testing.
5. Group weakness by note and add a fretboard accuracy map to Stats.

## Interface refresh (implemented 2026-10-06)

Design mockups are in [`docs/design/`](design/README.md). They show three directions: A (Session), B (Map) and C (Plain). Direction A is built:
- A Continue-first home with module progress cards.
- Header icons for Stats, Tuner and Settings.
- A settings sheet that is also usable mid-quiz.
- A quiz header with a round strip, counts and a countdown ring.
- A feedback bottom sheet.
- A results screen with missed rounds.
- A split fretboard on phones.
- A lesson step strip and Stats grouped by module.

The mockups' "Review weak spots" entry and the results screen's "Review these N" are built.

## Teaching and implementation principles

- Use the guitar fretboard as the main visual in future modules, supported by tablature and staff notation. Keep the existing keyboard lesson as a short reference for understanding note layout.
- Explain notes and interval functions alongside finger positions. A fingering pattern should always have a musical meaning.
- Use both chord accompaniment and melodic applications; arpeggios recur in modules 3 and 4 as the harmony becomes richer.
- Preserve Portuguese and English support. Explain the equivalence of symbols such as `7M` and `maj7`.
- Keep written guitar pitch and sounding pitch explicit when extending notation or adding audio: standard guitar notation sounds an octave below the written pitch. `src/music/guitar.ts` maps fretboard positions to written notes on this basis; audio would need the sounding pitch.
- Treat the teacher PDFs as curriculum references. Their scanned pages have not been embedded in the app or added to the repository. The Module 3 and 4 games follow the layouts described above, but their shapes are generated and still need comparing with the handouts.

The progression is consistent with the topics in [Berklee's Guitar Fundamentals syllabus](https://online.berklee.edu/courses/guitar-fundamentals), which connects fretboard knowledge, scales, reading, triads and seventh chords. This is supporting background, not the source of the project's original module plan.
