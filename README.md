# musicgame

Sight-reading practice app for electric guitar.

The project is a Vite + React + TypeScript web app with short music-reading lessons and quiz games. It focuses on beginner staff-reading exercises, uses VexFlow for notation rendering, and ties every concept back to the guitar fretboard. Exercise structure is inspired by [jogosdemusica.com.br](https://jogosdemusica.com.br).

## Current Features

- Four learn/practice pairs — each game has a stepped theory lesson (Aprender) and a 10-round quiz (Praticar):
  - Staff I: identify staff lines and spaces
  - Staff II: count up/down staff positions to find notes
  - Clefs: identify treble, alto, and bass clef anchor notes
  - Treble Clef: identify G, A, and B on the staff
- Lessons end with a Practice button that jumps straight into the matching game
- Electric guitar feedback with fretboard and tablature helpers
- Portuguese and English UI and lesson content
- Letter, solfege, or combined note labels
- Auto or manual advance after each answer, with configurable delay
- Local best/last score tracking through `localStorage`

## Tech Stack

- React 18
- TypeScript
- Vite
- VexFlow

## Getting Started

Install dependencies:

```sh
npm install
```

Run the development server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

Run TypeScript checks:

```sh
npm run typecheck
```

## Project Structure

```text
src/
  components/   Reusable UI and music display components
  games/        Quiz games (Praticar)
  lessons/      Stepped theory lessons (Aprender), one file per game
  hooks/        Shared React hooks
  i18n/         Translation dictionaries for UI chrome
  music/        Guitar and music-theory helpers
  store/        Browser-local score persistence
```

Lesson copy lives inside each lesson file (`Record<Language, StepCopy[]>`); the i18n dictionaries hold only shared UI strings. To add a lesson, create `src/lessons/<game-id>.tsx` and register it in `src/lessons/index.ts` — the menu's Learn button enables itself.

## Development Status

In active development. Next up: the remaining six games of module 1 (note names, alphabetical notation, figure names, descending notes, sound properties, keyboard notes), then modules 2–4.
