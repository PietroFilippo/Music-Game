# musicgame

Sight-reading practice for electric guitar, built with React, TypeScript, Vite and VexFlow. The exercise structure is inspired by [jogosdemusica.com.br](https://jogosdemusica.com.br); lessons and questions in this repository are written for this app.

The course has four module sections. Each can be expanded independently, and the menu remembers the selection. Modules with playable topics start expanded; modules without them start collapsed and show a Planned label. Module 2 shows its two available topics followed by the topics still to come. The [guitar curriculum roadmap](docs/ROADMAP.md) distinguishes the original four-module plan from the newly proposed topics for modules 2–4.

## Module 1

All ten topics have a six-step lesson and a ten-round quiz, in Portuguese and English.

| Topic | Practice |
| --- | --- |
| Staff I | Identify the five lines and four spaces |
| Staff II | Count positions up or down to find a note |
| Clefs | Identify treble, alto and bass clef anchor notes |
| Treble Clef | Read G, A and B |
| Note Names | Read every line and space in treble clef, E4–F5 |
| Alphabetical Notation | Translate letters and solfege in both directions |
| Rhythm Note Names | Identify whole through sixty-fourth notes |
| Descending Notes | Count backward through natural-note names, including C → B |
| Sound Properties | Classify written scenarios as pitch, duration, loudness or timbre |
| Keyboard Notes | Identify the seven white keys using black-key groups |

Lessons end with a Practice button. Guitar fretboard illustrations connect the concepts to the instrument; Treble Clef also shows tablature feedback. The sound-properties quiz uses text scenarios, not audio or microphone input. Keyboard exercises cover natural notes only.

Staff notes follow standard guitar notation, which is written one octave above the sounding pitch. The bottom line (E) is therefore the 4th string at fret 2, the G/A/B of Treble Clef are the open 3rd string, 3rd string fret 2 and open 2nd string, and the open 1st string is the E in the top space.

## Module 2

Six topics of the fretboard module are available in Portuguese and English, each with a six-step lesson and a ten-round quiz. Every lesson ends with a short exercise to play on a real guitar. The Intervals and Scales lessons have listen buttons that play each example.

| Topic | Practice |
| --- | --- |
| Strings and Tuning | Name the highlighted string, name open-string notes, find the string tuned to a note, and tap a string on the fretboard |
| Natural Notes on the Neck | Name a marked position or a tab number, and tap a requested note on a given string, frets 0–12 |
| Sharps and Flats | Name the frets between natural notes (with both spellings); name the note one or two frets up (with sharps) or down (with flats); find a sharp or flat on a string; read sharps and flats on the staff |
| Octaves on the Neck | Tap the octave two strings over (two frets up, or three when crossing the 3rd and 2nd strings); tap the same pitch on the next string; classify two marked positions as one octave, two octaves, the same pitch or different notes |
| Intervals | Name the interval between a root and a marked note; tap a requested interval on a given string; name the interval between two spelled notes, such as C → E♭ (minor 2nd to octave) |
| Major and Minor Scales | Name a degree of a major or natural minor key, with its whole/half-step pattern as a hint; tap a degree above a marked root; identify a scale from its notes among its parallel and relative scales |

The fretboard is interactive. Positions can be selected with a pointer, or with the arrow keys, Home, End and Enter. Answers that need a position are given by tapping the board. After each answer, the feedback shows the position as tablature and as written notation. The Natural Notes lesson includes an explorer: select any position to see its name, tab and written note, show every natural note, or highlight one note everywhere it appears. The board accepts labeled markers in several highlight colors, so later root, interval, triad and arpeggio exercises can reuse it.

Each quiz deck draws evenly from its question types. Answers are checked on screen; there is no microphone grading.

## Tuner

The Tuner tab checks standard tuning (E A D G B E, A = 440 Hz) through the microphone:
- It names the nearest open string and whether to tighten or loosen it.
- It shows a cents meter; within ±5 cents counts as in tune.
- Each open string can be played as a plucked reference tone.

Pitch detection uses the YIN algorithm with the browser's voice processing turned off. Audio is analyzed on the device and never recorded or sent. The microphone needs a secure page (HTTPS or localhost) and the player's permission. An unplugged electric guitar is quiet, so an amp or audio interface works best.

## Settings and progress

- Portuguese or English; letter names, solfege, or both.
- Fixed note-name mapping: C = Dó/Do and B = Si (PT) / Ti (EN). Alphabetical Notation uses the question's requested format so the answer is not revealed by the notation preference.
- Automatic advance with a configurable 0.5–2 second delay, or manual Continue.
- Untimed practice, or 15-second Easy, 8-second Medium, and 4-second Hard rounds. Difficulty changes the time limit, not the question bank. A timeout counts as incorrect and the next round receives a fresh timer.
- Sound effects for correct and wrong answers, timeouts and finished quizzes, on by default. They are plucked-string sounds synthesized in the browser, so the app ships no audio files. Browsers usually play sound only after the page has been clicked or tapped.
- Local best/last scores, completed play counts, and per-play date/difficulty history.
- Stats summarizes plays, averages, best and last scores. Per-game and global reset controls ask for confirmation and preserve settings.

Progress lives in `localStorage` under `musicgame.scores`, with settings under `musicgame.settings`. Every answer is also recorded per question under `musicgame.attempts`: times seen, times correct, current correct streak, last result and average answer time. A future review of weak spots will use this history; Stats resets clear it too. Existing scores from before play-history support are preserved; averages use only plays with recorded history. Saved settings with unknown values fall back to the defaults. There is no account or cloud sync. Leaving an unfinished quiz does not record a score, and any pending automatic advance is cancelled.

Expanded module sections are stored separately under `musicgame.modules`. Score resets preserve this preference.

If browser storage is blocked or full, the app still works, but settings, scores and module sections are not saved between visits.

## Development

Use Node.js 22 (also used by CI) and npm.

```sh
npm install
npm run dev
```

The development server uses port 5173. To preview a production build:

```sh
npm run build
npm run preview
```

Run all checks:

```sh
npm run check
```

Individual commands:

```sh
npm run typecheck
npm test
npm run test:watch
```

Tests use Vitest and React Testing Library. They cover:

- Quiz flow: timeouts and the next round's timer, automatic and manual advance, cancelling pending work on exit, completion and restart.
- Question banks: validity in both languages and all notation modes, plus the balanced Module 2 decks.
- Fretboard: pointer and keyboard selection, and the written-pitch guitar mapping.
- Storage: score compatibility, invalid settings and blocked storage.
- The menu's module sections.

Music rendering is checked in a real browser rather than simulated by jsdom. GitHub Actions runs type checking, tests and a production build on pushes and pull requests.

## Project structure

```text
src/
  audio/                 Plucked-string synth, pitch detection and tuning math
  curriculum.ts          Module order, game membership and upcoming topics
  components/            Shared UI, notation, keyboard, rhythm and fretboard diagrams
    Fretboard.tsx        Display and interactive fretboard with labeled markers
    FretboardExplorer.tsx  Free exploration of positions, names, tab and staff
  games/index.tsx        Lazy-loaded game registry
  games/module-one/      Six Module 1 quizzes and pure question generators
  games/module-two/      Module 2 quizzes and pure question generators
  lessons/index.ts       Lazy-loaded lesson registry
  lessons/module-one.tsx Six Module 1 lessons
  lessons/module-two.tsx Module 2 lessons
  hooks/                 Quiz rounds, progress, timers, microphone pitch and translations
  i18n/                  Shared UI strings
  music/                 Notes, rhythm values and guitar positions
  store/                 Browser-local scores and safe storage access
  test/                  Test environment setup
```

To add a topic, register its ID in `src/types.ts`, its title in both i18n dictionaries, and its game and lesson in their registries. Assign it to exactly one module in `src/curriculum.ts`; the menu uses that membership, while Stats lists all registered game IDs. Build quiz screens on `useQuizRound`, which handles answers, timeouts, advancing and score recording. Keep question generation independent from presentation, and add gameplay tests for new behavior.

Games and lessons load on demand. VexFlow is imported with only its Bravura music font. It is the largest chunk, about 570 kB (160 kB gzipped), and is not part of the initial menu download.

## Current status

Module 1's ten planned lesson/quiz pairs are implemented. Module 2 has its interactive fretboard and six lesson/quiz pairs:
- strings and standard tuning;
- natural notes across the first 12 frets;
- sharps, flats and semitone movement;
- octaves and repeated notes;
- intervals and degrees;
- major and natural minor scales.

A reading topic connecting staff, tab, fretboard and rhythm remains planned for this module. Modules 3–4 have expandable topic previews: triads and arpeggios, then seventh chords and harmonic application. The roadmap also proposes two practice features: [spaced review of weak notes and answering by playing into the microphone](docs/ROADMAP.md#practice-features-across-modules-proposed). A visible play-history view and progress export/sync are other possible extensions. None of these are implemented. See the [roadmap](docs/ROADMAP.md#current-milestone-ready-for-testing) for details.

Rhythm examples use a quarter-note beat; the displayed beat counts are not universal across all meters. English rhythm names follow American terminology.
