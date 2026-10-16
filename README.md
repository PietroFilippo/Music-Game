# musicgame

Sight-reading practice for electric guitar, built with React, TypeScript, Vite and VexFlow. The exercise structure is inspired by [jogosdemusica.com.br](https://jogosdemusica.com.br); lessons and questions in this repository are written for this app.

The course has four module sections. Each can be expanded independently, and the menu remembers the selection. A module starts expanded while it has topics not yet played; finished modules start collapsed. The [guitar curriculum roadmap](docs/ROADMAP.md) distinguishes the original four-module plan from the topics proposed for modules 2–4.

## Interface

- **Home** opens on a Continue card. It recommends the most recent topic if its last score was under 80%, otherwise the next unplayed topic, otherwise the weakest one.
- **Module cards** show progress and can expand to list topics, each with Learn and Practice buttons.
- **Review weak spots:** once a module has answer history, its card offers Review weak spots with the number of questions due, or shows "Nothing to review today" when none are. A session takes up to ten due questions across the module's topics, missed ones first, and does not change scores.
- **Header icons** open Stats, the Tuner and Settings.
- **Settings** is a sheet, also reachable during a quiz.
- **Quizzes:**
  - The header shows a 10-segment round strip, correct and wrong counts, a countdown ring when timed, and a sound toggle.
  - Feedback arrives in a bottom sheet, so Continue stays in one place; in automatic mode the button shows the advance delay. Fretboard topics add a Listen button that plays the answer: one note, both notes of an interval, a scale, a strummed chord or an arpeggio.
  - Opening Settings mid-quiz pauses the timer and any automatic advance.
  - Results compare the score with the previous best and last play, and list each missed round with the right answer. After misses, Review these N replays the missed questions once each, without changing scores.
- **Phones:** a selectable fretboard splits into frets 0–6 and 7–12, so each fret is a large touch target.
- **Lessons** have a step strip and a sticky Previous/Next bar.

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

All seven topics of the fretboard module are available in Portuguese and English, each with a six-step lesson and a ten-round quiz. Every lesson ends with a short exercise to play on a real guitar. The Intervals, Scales and Staff, Tab and Rhythm lessons have listen buttons that play each example.

| Topic | Practice |
| --- | --- |
| Strings and Tuning | Name the highlighted string, name open-string notes, find the string tuned to a note, and tap a string on the fretboard |
| Natural Notes on the Neck | Name a marked position or a tab number, and tap a requested note on a given string, frets 0–12 |
| Sharps and Flats | Name the frets between natural notes (with both spellings); name the note one or two frets up (with sharps) or down (with flats); find a sharp or flat on a string; read sharps and flats on the staff |
| Octaves on the Neck | Tap the octave two strings over (two frets up, or three when crossing the 3rd and 2nd strings); tap the same pitch on the next string; classify two marked positions as one octave, two octaves, the same pitch or different notes |
| Intervals | Name the interval between a root and a marked note; tap a requested interval on a given string; name the interval between two spelled notes, such as C → E♭ (minor 2nd to octave) |
| Major and Minor Scales | Name a degree of a major or natural minor key, with its whole/half-step pattern as a hint; tap a degree above a marked root; identify a scale from its notes among its parallel and relative scales |
| Staff, Tab and Rhythm | Tap every position that plays a written note; match a staff note to its tab fret; read how long a note lasts in a 4/4 measure shown as staff and rhythmic tab |

The fretboard is interactive. Positions can be selected with a pointer, or with the arrow keys, Home, End and Enter. Answers that need a position are given by tapping the board. After each answer, the feedback shows the position as tablature and as written notation. The Natural Notes lesson includes an explorer: select any position to see its name, tab and written note, show every natural note, or highlight one note everywhere it appears. The board accepts labeled markers in several highlight colors, which Modules 3 and 4 use for roots, degrees, chord shapes and arpeggios.

Each quiz deck draws evenly from its question types. Answers are checked on screen; there is no microphone grading.

## Module 3

Four topics on triads are available in Portuguese and English, each with a six-step lesson and a ten-round quiz. Lessons label every shape with its degrees (R, 3, ♭3, 5, ♭5, ♯5) and can play it as a chord or an arpeggio.

| Topic | Practice |
| --- | --- |
| Building Triads | Spell the 3rd or 5th of a chord; identify major, minor, diminished or augmented from the notes; choose the chord symbol; tap a missing 3rd or 5th above a root |
| Inversions and String Sets | Tell root position from the 1st and 2nd inversions by the bass note; name the degree of a marked note; tap the root of a shape; name the chord on a string set |
| Triad Arpeggios | Complete an ascending or descending arpeggio; name a marked degree; tell major from minor with the roots marked; move a shape to a new root |
| Triads in Progressions | Name the chord on a degree of a major key; transpose I–IV–V, I–V–vi–IV and ii–V–I; choose the voicing that moves least; find the common tone; tap the root of a degree's chord |

Triad voicings and arpeggio shapes are generated and tested rather than copied: every chord tone appears once, the inversion follows the lowest note, frets stay within 0–12, and introductory arpeggios skip no strings and stretch at most three frets. Chord symbols use letter names in both languages, following Brazilian practice in Portuguese (C, Cm, Cm(♭5), C(♯5)) and American practice in English (C, Cm, C°, C+). Degrees are written I, IIm, IIIm, IV, V, VIm, VIIm(♭5) in Portuguese and I, ii, iii, IV, V, vi, vii° in English.

## Module 4

Four topics on seventh chords (tetrads) are available in Portuguese and English, each with a six-step lesson and a ten-round quiz.

| Topic | Practice |
| --- | --- |
| Building Seventh Chords | Spell any tone of maj7, 7, m7, m7♭5, °7, m(maj7) and maj7♯5 chords; identify a quality from its notes; match a symbol to its degrees; name the one degree that changes between two chords; tap the 7th above a root |
| Seventh-Chord Voicings on Strings 6, 5 and 4 | Name a voicing's degree order (1–7–3–5, 1–5–7–3 or 1–3–5–7); name a marked degree; tap the 3rd or the 7th of a shape; identify a shape's quality |
| Seventh-Chord Arpeggios | Complete an ascending or descending arpeggio; name a marked degree; identify a quality with the roots marked; move a shape to a new root |
| Seventh Chords in Progressions | Name the chord on a degree of a major key; transpose ii–V–I; resolve the 7th of one chord to the 3rd of the next; find the closest next chord tone; name the degree a phrase lands on |

The voicings follow the layouts of the teacher's handout described in the [roadmap](docs/ROADMAP.md#module-4-tetrads-and-harmonic-application): the root is always the lowest note, played on string 6 (1–7–3–5 on strings 6–4–3–2), string 5 (1–7–3–5 on 5–3–2–1, 1–5–7–3 on 5–4–3–2) or string 4 (1–5–7–3 and 1–3–5–7 on 4–3–2–1). Reordering the upper notes does not make an inversion. Shapes are generated and tested: each chord tone appears once, frets stay within 0–12 and voicings span at most five frets; skipped strings must be muted. Symbols follow Brazilian practice in Portuguese (C7M, C7, Cm7, Cm7(♭5), C°, Cm7M, C7M(♯5)) and American practice in English (Cmaj7, C7, Cm7, Cm7♭5, C°7, Cm(maj7), Cmaj7♯5).

## Tuner

The tuner (wave icon on the home screen) checks standard tuning (E A D G B E, A = 440 Hz) through the microphone:
- It names the nearest open string and whether to tighten or loosen it.
- It shows a cents meter; within ±5 cents counts as in tune.
- Each open string can be played as a plucked reference tone, synthesized within 1 cent of the target.

Pitch detection uses the YIN algorithm with the browser's voice processing turned off. Audio is analyzed on the device and never recorded or sent. The microphone needs a secure page (HTTPS or localhost) and the player's permission. An unplugged electric guitar is quiet, so an amp or audio interface works best.

## Desktop app (Windows)

A Tauri build runs the same app in its own window (`src-tauri/`).
- **Window:** frameless, with Windows 11 caption buttons drawn by the app in the top-right corner (Minimize, Maximize/Restore, Close). The top bar and the window margins drag the window, and double-clicking them maximizes. The design and its decisions are in [docs/design/DESKTOP.md](docs/design/DESKTOP.md).
- **Tray:** closing the window hides it to the tray; the first time, a short note says so. After five minutes hidden, the window and its web view are destroyed, so the idle app uses about 5 MB instead of about 180 MB. Clicking the tray icon rebuilds it in under a second.
- **Tray menu:** Open musicgame; Continue: ‹topic› or Up next: ‹topic› (the recommended topic, disabled during a quiz); Tuner; Start with Windows; Quit. It follows the app's language, and the tray icon follows the taskbar's light or dark theme.
- **Start with Windows** is off by default. When on, the app starts in the tray without a window. It can be switched in the tray menu or in Settings.
- **Other behavior:** a second launch brings the running app forward, and the window remembers its size, position and maximized state.
- **Storage:** separate from the browser version. Settings → Progress exports and imports scores and answer history to move them between the two.

Build it on Windows with Node.js 22, Rust (stable, MSVC) and the Visual Studio C++ build tools; WebView2 ships with Windows 11.

```sh
npm run desktop:dev     # the app with live reload
npm run desktop:build   # a per-user installer in src-tauri/target/release/bundle/nsis/
npm run desktop:icons   # render the app and tray icons from src-tauri/icons/source/*.svg
```

The installer is about 1.4 MB. It installs per user, without administrator rights.

## Settings and progress

All settings live in one sheet, opened from the gear icon on the home screen or during a quiz.

- Portuguese or English; letter names, solfege, or both.
- Fixed note-name mapping: C = Dó/Do and B = Si (PT) / Ti (EN). Alphabetical Notation uses the question's requested format so the answer is not revealed by the notation preference.
- Automatic advance with a configurable 0.5–2 second delay, or manual Continue.
- Untimed practice, or 15-second Easy, 8-second Medium, and 4-second Hard rounds. Difficulty changes the time limit, not the question bank. A timeout counts as incorrect and the next round receives a fresh timer. Rounds count down to a deadline, so a busy or throttled page cannot stretch them.
- Changing the language or notation mid-quiz keeps the rounds and redraws the questions in the new format.
- Sound effects for correct and wrong answers, timeouts and finished quizzes, on by default. They are plucked-string sounds synthesized in the browser, so the app ships no audio files. Browsers usually play sound only after the page has been clicked or tapped.
- Local best/last scores, completed play counts, and per-play date/difficulty history.
- Progress: Export progress… saves scores and answer history as one `.json` file (settings stay per device); Import progress… merges such a file after a confirmation. Importing never replaces anything: play histories are combined by date, best scores keep the higher value, the more recent record of each question wins, and importing the same file twice adds nothing. Use it to move progress between the browser and the desktop app.
- Stats shows total plays, the overall average and topics played. Each module lists every topic's plays, average, best and last score, with low scores highlighted, and the number of questions due for review. Per-topic and global resets ask for confirmation, clear the answer history too (also for topics never finished), and preserve settings.

Progress lives in `localStorage` under `musicgame.scores`, with settings under `musicgame.settings`. Every answer is also recorded per question under `musicgame.attempts`: times seen, times correct, current correct streak, last result, average answer time and a Leitner box (1–5). A correct answer moves a question up a box; a miss or timeout sends it back to box 1. Review weak spots uses the box to schedule questions: box 1 is due at once, then after 1, 3, 7 and 14 calendar days. Existing scores from before play-history support are preserved; averages use only plays with recorded history. Saved settings with unknown values fall back to the defaults, and malformed saved scores or answer records are skipped rather than trusted. There is no account or cloud sync. Leaving an unfinished quiz does not record a score, and any pending automatic advance is cancelled.

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

- Quiz flow: timeouts and the next round's timer, deadline-based countdowns, pausing behind Settings, automatic and manual advance, cancelling pending work on exit, completion and restart.
- Question banks: validity in both languages and all notation modes, balanced decks, independent checks of the musical answers (positions, intervals, scale and chord spellings, inversions, harmonized scales, voice leading) and plausible distractors.
- Chord theory and shapes: formulas, spelling, symbols, voicings and arpeggio shapes.
- Review: Leitner scheduling, unscored sessions, Review these N and rebuilding questions from their IDs.
- Audio: the synthesized reference tones are tuned within 1 cent; the microphone is released if audio setup fails.
- Fretboard: pointer and keyboard selection, and the written-pitch guitar mapping.
- Storage: score and history compatibility, malformed records, invalid settings and blocked storage.
- The menu's module sections, Stats resets and dialog focus handling.

Music rendering is checked in a real browser rather than simulated by jsdom. GitHub Actions runs type checking, tests and a production build on pushes and pull requests.

## Project structure

```text
src-tauri/               Desktop shell (Rust): tray, window lifecycle, autostart, icons
scripts/render-icons.mjs Renders the desktop icons from their SVG sources
src/
  audio/                 Plucked-string synth, pitch detection and tuning math
  desktop/               Desktop-only pieces: tray bridge, caption buttons, autostart setting
  curriculum.ts          Module order, game membership and upcoming topics
  components/            Shared UI, notation, keyboard, rhythm and fretboard diagrams
    Fretboard.tsx        Display and interactive fretboard with labeled markers
    FretboardExplorer.tsx  Free exploration of positions, names, tab and staff
    MeasureNotation.tsx  A 4/4 measure as written notation over rhythmic tab
  games/index.tsx        Lazy-loaded game registry
  games/DeckQuiz.tsx     Quiz runner for decks that can mix question types
  games/fretboard/       Shared fretboard quiz: question model, balanced decks, renderer
  games/module-one/      Module 1 quizzes and pure question banks
  games/module-two/      Module 2 question banks
  games/module-three/    Module 3 question banks
  games/module-four/     Module 4 question banks
  lessons/index.ts       Lazy-loaded lesson registry
  lessons/               Module 1–4 lessons
  review/                Review weak spots: topic registry, deck builder and session screen
  hooks/                 Quiz rounds, progress, timers, microphone pitch and translations
  i18n/                  Shared UI strings
  music/                 Notes, rhythm, guitar positions, intervals, scales, chords,
                         chord shapes and harmonized scales
  store/                 Browser-local scores and safe storage access
  test/                  Test environment setup
```

To add a topic, register its ID in `src/types.ts`, its title in both i18n dictionaries, its game and lesson in their registries, and its question pool in `src/review/registry.ts` (one line), so its questions can be reviewed and redrawn when the language changes. Assign it to exactly one module in `src/curriculum.ts`; the menu uses that membership, while Stats lists all registered game IDs. Fretboard topics only need a question bank: `FretboardQuiz` shows any `FretboardQuestion` deck. Quizzes run on `DeckQuiz` and `useQuizRound`, which handle answers, timeouts, pausing, advancing, score recording and Review these N. Keep question generation independent from presentation, give every question a stable, language-independent ID, and add gameplay tests for new behavior.

Games and lessons load on demand. VexFlow is imported with only its Bravura music font. It is the largest chunk, about 570 kB (160 kB gzipped), and is not part of the initial menu download. Starting any quiz loads every question bank (about 40 kB, 14 kB gzipped), because review and mid-quiz language changes rebuild questions from their IDs.

## Current status

All four modules are playable: 25 lesson/quiz pairs in Portuguese and English.
- Module 1: ten reading-foundation topics.
- Module 2: seven fretboard topics, from strings and tuning to staff, tab and rhythm.
- Module 3: four triad topics.
- Module 4: four seventh-chord topics.

Review weak spots (Leitner-scheduled, per module) and Review these N are implemented, and fretboard feedback can play its answer. Answering by playing into the microphone waits for the tuner to be tested on real guitars, and an accuracy map grouped by note is still open; see the [roadmap](docs/ROADMAP.md#practice-features-across-modules). A visible play-history view and progress export/sync are other possible extensions.

The next step is testing with learners, on real guitars and on phones. The chord shapes are generated rather than taken from the teacher's handouts, so they should also be compared with those handouts.

Rhythm examples use a quarter-note beat; the displayed beat counts are not universal across all meters. English rhythm names follow American terminology.
