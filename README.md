# musicgame

Sight-reading practice for electric guitar, built with React, TypeScript, Vite and VexFlow. The exercise structure is inspired by [jogosdemusica.com.br](https://jogosdemusica.com.br); lessons and questions in this repository are written for this app.

The course has four module sections. Each can be expanded independently, and the menu remembers the selection. Module 1 starts expanded; future modules start collapsed and show a Planned label. The [guitar curriculum roadmap](docs/ROADMAP.md) distinguishes the original four-module plan from the newly proposed topics for modules 2–4.

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

## Settings and progress

- Portuguese or English; letter names, solfege, or both.
- Fixed note-name mapping: C = Dó/Do and B = Si (PT) / Ti (EN). Alphabetical Notation uses the question's requested format so the answer is not revealed by the notation preference.
- Automatic advance with a configurable 0.5–2 second delay, or manual Continue.
- Untimed practice, or 15-second Easy, 8-second Medium, and 4-second Hard rounds. Difficulty changes the time limit, not the question bank. A timeout counts as incorrect and the next round receives a fresh timer.
- Local best/last scores, completed play counts, and per-play date/difficulty history.
- Stats summarizes plays, averages, best and last scores. Per-game and global reset controls ask for confirmation and preserve settings.

Progress lives in `localStorage` under `musicgame.scores`, with settings under `musicgame.settings`. Existing scores from before play-history support are preserved; averages use only plays with recorded history. There is no account or cloud sync. Leaving an unfinished quiz does not record a score.

Expanded module sections are stored separately under `musicgame.modules`. Score resets preserve this preference, and sections remain usable when browser storage is unavailable.

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

Tests use Vitest and React Testing Library. They cover timeout-to-next-round behavior, automatic/manual advancement in the original games, new quiz completion/restart, question-bank validity across languages/notation modes, and score compatibility. Music rendering is checked in a real browser rather than simulated by jsdom. GitHub Actions runs type checking, tests and a production build on pushes and pull requests.

## Project structure

```text
src/
  curriculum.ts        Module order, game membership and planned topics
  components/          Shared UI, notation, keyboard, rhythm and fretboard diagrams
  games/index.tsx      Lazy-loaded game registry
  games/module-one/    Six additional quizzes and pure question generators
  lessons/index.ts    Lazy-loaded lesson registry
  lessons/module-one.tsx  Six additional bilingual lessons
  hooks/              Progress, timers and translations
  i18n/               Shared UI strings
  music/              Notes, rhythm values and guitar helpers
  store/              Browser-local scores
  test/               Test environment setup
```

To add a topic, register its ID in `src/types.ts`, its title in both i18n dictionaries, and its game and lesson in their registries. Assign it to exactly one module in `src/curriculum.ts`; the menu uses that membership, while Stats lists all registered game IDs. Keep question generation independent from presentation, and add gameplay tests for new behavior.

Games and lessons load on demand. VexFlow remains a relatively large shared chunk, but it is not part of the initial menu download.

## Current status

Module 1's ten planned lesson/quiz pairs are implemented. Modules 2–4 have expandable topic previews; their lessons and games remain future work. Their proposed progression is guitar fretboard/intervals, triads/arpeggios, then seventh chords and harmonic application. Other possible extensions are a visible play-history view, audio-based exercises, and progress export/sync; these are not implemented.

Rhythm examples use a quarter-note beat; the displayed beat counts are not universal across all meters. English rhythm names follow American terminology.
