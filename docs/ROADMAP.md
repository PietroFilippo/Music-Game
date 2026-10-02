# Guitar curriculum roadmap

Updated 2026-10-02. Guitar and electric guitar are the primary instruments for this project.

## Original plan and present scope

The README at commit `09d4ca7` planned **four modules**: complete the remaining six topics of module 1, then build modules 2–4. It did not specify the topics of those later modules. The sequence below is a new proposal based on the guitar focus and the two teacher handouts reviewed on 2026-09-22.

| Module | Focus | Status |
| --- | --- | --- |
| 1 | Music-reading foundations: staff, clefs, note names, notation, rhythm symbols and sound properties | Ten bilingual lesson/quiz pairs available |
| 2 | Guitar fretboard, intervals and scale foundations | Proposed topics; lessons/games not implemented |
| 3 | Triads, chord shapes and triad arpeggios | Proposed topics; lessons/games not implemented |
| 4 | Tetrads/seventh chords, four-note arpeggios and harmonic application | Proposed topics; lessons/games not implemented |

All four sections can be expanded or collapsed independently. Module 1 opens by default, future modules start collapsed, and the browser remembers the selection. Future modules display topic previews and a Planned label.

## Next milestone: proposed, not started

Use feedback from testing Module 1 to refine explanations, difficulty and navigation where needed. The next proposed implementation is:

1. A reusable interactive guitar fretboard. Players select string/fret positions, reveal note names and highlight roots or intervals, with connections to tablature and staff notation. The current fretboard component is display-only; selection and exploration are not implemented.
2. Module 2's first two bilingual lesson/quiz pairs: **string numbering and standard tuning**, then **natural notes across the first 12 frets**. Reuse the existing practice settings and score tracking. Include a short exercise to play on a real guitar alongside each lesson's screen-based practice; microphone grading is outside this milestone.
3. Test this first part before implementing the remaining sequence: **sharps/flats and semitone movement → octaves and repeated notes → intervals and scale degrees → major and natural minor scales**.

This is the recommended next step from the project discussion, not completed content or a commitment to implement the entire module at once. The same fretboard interactions should support later triad and tetrad exercises.

## Module 2: fretboard and intervals

Establish the knowledge needed to understand chord shapes:

- Standard tuning, string numbering, natural notes and accidentals on all six strings; octave relationships and repeated notes across the neck.
- Semitones, whole tones, intervals and scale degrees, including the tuning difference between the G and B strings.
- Major and natural minor scale construction, connected to note locations rather than only memorized patterns.
- Short rhythm and reading exercises that connect staff notation, tablature and the fretboard.

Suggested games: locate a named note, find its octave, identify the interval between two positions, and build a scale from its interval pattern.

## Module 3: triads and arpeggios

A triad has three distinct chord tones. Introduce major and minor first, then diminished and augmented. Connect each shape to its root, third and fifth, and show how changing an interval changes the chord quality.

- Play chord tones together as a chord and successively as an arpeggio.
- Explore root-position shapes and inversions on practical string groups.
- Learn major and minor arpeggios in multiple positions, then connect and transpose them.
- Apply the same notes to rhythm-guitar accompaniment and short lead-guitar phrases over simple progressions.

The teacher's **Arpejos de Tríades.pdf** is a one-page reference containing five major and five minor arpeggio diagrams. It belongs primarily here. It provides shapes; lessons should also explain their notes and degrees, and practice should vary the root/key.

Suggested games: build a triad, identify its quality, select its chord tones on the fretboard, and complete an ascending or descending arpeggio.

## Module 4: tetrads and harmonic application

Extend triads with a fourth chord tone. Begin with major seventh, dominant seventh and minor seventh; then introduce half-diminished and diminished seventh, minor-major seventh, and augmented major seventh.

- Learn formulas and recognize how changing one degree changes the chord.
- Explore practical voicings with roots on strings 6, 5 and 4.
- Play the same four chord tones as arpeggios across positions.
- Connect chords through small movements of individual voices and target chord tones in solos.

The teacher's **Tétrades.pdf** is a two-page chord-voicing reference. It includes `7M`, `m7`, `m7(b5)`, `7`, `7M(#5)`, `m7M` and diminished symbols, with roots on strings 6, 5 and 4. Its layouts include degree orders `1–7–3–5`, `1–3–5–7` and `1–5–7–3`. These are different voicings with the root in the bass; changing the order above the bass does not by itself create an inversion. This handout belongs primarily in module 4.

Suggested games: identify a seventh-chord quality, find a missing chord tone, match a chord to its arpeggio, and choose a nearby voicing for the next chord.

## Teaching and implementation principles

- Use the guitar fretboard as the main visual in future modules, supported by tablature and staff notation. Keep the existing keyboard lesson as a short reference for understanding note layout.
- Explain notes and interval functions alongside finger positions. A fingering pattern should always have a musical meaning.
- Use both chord accompaniment and melodic applications; arpeggios recur in modules 3 and 4 as the harmony becomes richer.
- Preserve Portuguese and English support. Explain the equivalence of symbols such as `7M` and `maj7`.
- Keep written guitar pitch and sounding pitch explicit when extending notation or adding audio: standard guitar notation sounds an octave below the written pitch.
- Treat the teacher PDFs as curriculum references. Their scanned pages have not been embedded in the app or added to the repository; the proposed games above are not yet implemented.

The progression is consistent with the topics in [Berklee's Guitar Fundamentals syllabus](https://online.berklee.edu/courses/guitar-fundamentals), which connects fretboard knowledge, scales, reading, triads and seventh chords. This is supporting background, not the source of the project's original module plan.
