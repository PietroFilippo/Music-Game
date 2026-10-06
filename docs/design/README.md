# Design brief: three UI directions for musicgame

Mocks: `mocks/index.html` links to the three boards. Static HTML with inline CSS and SVG (works offline): the seven screens in 390 px phone frames plus desktop frames, with captions and a tokens panel.

## UX problems in the current app

Confirmed:

1. **Settings bar first.** Six rarely changed controls open the menu and fill a phone's first screen.
2. **Flat menu.** Twelve equal cards, a `—` placeholder, no module progress, no continue or next topic; Learn weighs the same as Practice.
3. **Quiz header.** Round and score are 13 px muted text in a corner; the timer floats between question and answers.
4. **Feedback pushes Continue down**; the PT mobile feedback runs past 900 px. No sound or settings access in-game.
5. **Fretboard cells** are about 26 × 19 px on phones.
6. **Bare results**: a percentage, Play again, Exit.
7. **Stats**: a six-column table, not grouped, overflowing phones; 13 px Reset buttons.

Added:

8. Answer buttons signal correct/wrong by colour only.
9. Lesson step dots are 10 px and far from the content; no overview of the six steps; "On your guitar" looks like any other step.
10. Back is a 14 px ghost button with 4 px padding.
11. Nothing marks the target string of a fretboard question; hover cues do not exist on touch.

## Directions

**A — Session.** Home opens on a Continue card over a compact module list. The quiz header holds a 10-segment round strip, ✓/✗ pills and a countdown ring. Feedback is a bottom sheet over the question; settings are a sheet usable mid-quiz. The neck splits into frets 0–6 and 7–12 (43 × 40 px cells, no scrolling). Results list misses, compare with best and offer a next step. *Trade-offs:* sheets need dialog focus management; the split neck changes `Fretboard.tsx` geometry.

**B — Map.** A progress dashboard: sidebar with module rings on desktop, module cards unfolding into a path of topic nodes on mobile; round dots and a card-attached timer; feedback in place with an auto-advance fill on Continue; a stats dashboard with tables. The neck scrolls at 44 px cells with zone chips. *Trade-offs:* densest and most code; a scrolling neck is weakest in timed rounds.

**C — Plain.** One column, 18 px text, 56–64 px controls, section headers instead of cards, a bottom tab bar, a grid of 13 fret buttons under a context neck, inverted notation. *Trade-offs:* the fret grid cannot answer free-position questions (octaves, intervals across strings); inverted notation looks less like printed music.

## Recommendation

Build **A**, borrowing C's type scale and targets for quiz screens and B's round grid and module-grouped stats. It fixes every problem with the fewest new concepts, keeps the real fretboard that later Module 2 topics need, and reuses the existing settings logic.

Components: `Menu.tsx` (ContinueCard, module progress), `SettingsBar.tsx` → `SettingsSheet`, `GameShell.tsx` (header strip, icon buttons, results with misses; `useQuizRound` records per-round answers), `ScoreBadge.tsx` and `TimerBar.tsx` → strip and ring, `AnswerBank.tsx` (two-column grid, icons), `Fretboard.tsx` (`split` mode under 480 px), `LessonShell.tsx` (step strip, sticky footer), `Stats.tsx` (grouped by `COURSE_MODULES`), `NavTabs.tsx` (removed).

CSS: keep all variables; add `--bg-elevated`, `--accent-soft`, `--danger-soft`, `--radius`, `--tap: 52px`, `--tap-sm: 44px`, `--paper`, `--ink`; raise `.btn` to `min-height: var(--tap)`; give `.btn-ghost` a 44 px target; add a 1 px edge to `.vex-stave`.
