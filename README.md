# musicgame

Early-stage sight-reading practice app for electric guitar.

The project is a Vite + React + TypeScript web app with short music-reading quiz modules. It currently focuses on beginner staff-reading exercises and uses VexFlow for notation rendering.

## Current Features

- Four practice modules:
  - Staff I: identify staff lines and spaces
  - Staff II: count up/down staff positions to find notes
  - Clefs: identify treble, alto, and bass clef anchor notes
  - Treble Clef: identify G, A, and B on the staff
- Electric guitar feedback with fretboard and tablature helpers
- Portuguese and English UI text
- Letter, solfege, or combined note labels
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
  games/        Individual practice modules
  hooks/        Shared React hooks
  i18n/         Translation dictionaries
  music/        Guitar and music-theory helpers
  store/        Browser-local score persistence
```

## Development Status

This project is still in initial development. APIs, game flow, visual design, and module structure may change quickly as the learning experience is refined.
