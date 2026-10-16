# Desktop chrome: window controls, icons, tray and desktop settings

Mocks: `mocks/desktop-index.html` links to one board per direction (`desktop-a.html`, `desktop-b.html`, `desktop-c.html`), the icon board (`desktop-icons.html`) and the tray-menu and settings board (`desktop-settings.html`). Static HTML with inline CSS and SVG; every screen is framed as a Windows 11 window at 1100 × 720 and at 420 × 720, with 1:1 crops for states and sizes.

## Brief

musicgame (React + Vite) is being wrapped as a Windows desktop app with Tauri v2. The window is frameless (`decorations: false`), so the app must draw Minimize, Maximize/Restore and Close itself, merged with its existing top bar rather than as an OS-style strip stacked above it. The owner's reference shows a dark strip with the three glyphs at the top right, blended into the app: "the minimize, fullscreen and close buttons are together with the design of the app".

Constraints that shaped every direction:

- The app's page column is `max-width: 760px` (1160 px on Home), centred. On an 1100 px window there are 170 px of empty margin either side of every screen except Home, so the window controls can live in that margin without touching the bar at all.
- The top bar is 56 px with 44 × 44 icon buttons (`.ibtn`, radius 12) at `y = 8`. Quizzes add a round strip and a timer ring under it; lessons add a step strip with buttons; the Settings sheet is a modal with a backdrop at `z-index: 20`; the feedback sheet is at `z-index: 10`.
- Windows 11 keeps rounding the corners (8 px) and drawing a shadow for a frameless window as long as `shadow: true`; it also owns an outer resize inset (5 px, Tauri's borderless resizing) and expects Close to turn red on hover.
- Portuguese titles are long: the longest topic title is 45 characters ("Tétrades com Fundamental nas Cordas 6, 5 e 4").

## The three directions

**A — Inline.** The controls are three more app buttons: 44 × 44, radius 12, Feather-style 18 px glyphs at 1.75 px stroke, on the same baseline as Stats, Tuner and Settings. On wide windows they float in the right margin at the icon baseline; when the bar reaches them (Home, narrow windows) a 1 × 20 px divider separates app actions from window actions. The clickable area is 44 × 52 from the top edge so a flick to the corner still lands, but the visible hover is the inset rounded square.
*Trade-offs:* the most "together with the app"; reuses `.ibtn` hover and focus verbatim. But a ✕ drawn in the app's own button style reads as an app action (leave quiz, close sheet) rather than a window action, the corner pixel is only a target because the hit area is secretly extended, and at 420 px the drag area shrinks to the wordmark.

**B — Corner.** Windows 11 caption metrics exactly: three 46 × 32 buttons flush to the top-right corner, 10 × 10 one-pixel glyphs, no radius, no strip and no border. They sit on the app's `--bg`, use the app's `--bg-elevated` as hover, and Windows red for Close. Because the controls hang from the corner and the page column is 760 px, nothing in the app moves on any screen except Home and windows narrower than about 1060 px, where the bar's right padding grows by the cluster width.
*Trade-offs:* muscle memory and corner targeting identical to native windows; clearly "system", never mistaken for an app action; one CSS rule covers every layout. On Home the 32 px controls and the 44 px app icons have different vertical centres (as in VS Code, Spotify and Edge). The Snap Layouts flyout on hovering Maximize needs a native hit test, not HTML.

**C — Band.** The top bar leaves the page column and becomes a 48 px full-width band on a lifted surface (`#202020`), holding Back, title, the app's icon buttons and the controls (46 × 48) edge to edge. Content stays centred beneath.
*Trade-offs:* reads most like a desktop application and gives the window the largest drag area. But Back and the quiz title move 170 px left of the content column on an 1100 px window, the shared top bar changes for the web build too (or forks per platform), and the sheet backdrop and focus trap need band-specific rules because app buttons live in the same band as window buttons.

## Recommendation: B — Corner

B matches the owner's reference literally (a dark top-right cluster with thin glyphs, no visible strip) while changing nothing in the app on normal windows. It is the only direction where every existing screen keeps its layout, where the controls can never be confused with app actions, and where Windows habits (slam the mouse into the corner, double-click the bar, Alt+F4) all work without explanation. Its one visual cost, the different centre lines on Home, is the same compromise every major Windows app makes and is invisible on quizzes, lessons, Stats and the Tuner.

If the owner prefers the controls to read as part of the app's toolbar, A is the fallback: it needs the same plumbing and differs only in the cluster's CSS, so switching later is cheap. C is not recommended.

## Spec of the recommended direction (B)

### Window (`tauri.conf.json`)

| Setting | Value | Why |
| --- | --- | --- |
| `decorations` | `false` | The app draws the controls |
| `shadow` | `true` | Keeps Windows 11 rounded corners and the DWM shadow |
| `transparent` | `false` | No per-pixel alpha needed; keeps WebView2 fast |
| `width` × `height` | 1100 × 720, `center: true` | The reference screenshots' size |
| `minWidth` × `minHeight` | 400 × 560 | The phone layout plus the control cluster |
| `title` | `musicgame` | Still shown in the taskbar and Alt-Tab |
| `resizable` | `true` | Tauri's borderless resizing gives a 5 px inset on all edges |

Capabilities needed by the chrome: `core:window:allow-start-dragging`, `allow-toggle-maximize`, `allow-minimize`, `allow-maximize`, `allow-unmaximize`, `allow-is-maximized`, `allow-hide`, `allow-show`, `allow-set-focus`.

### Control cluster

| Item | Value |
| --- | --- |
| Position | `position: fixed; top: 0; right: 0; z-index: 100` |
| Size | 138 × 32: three buttons of 46 × 32, no gap, no radius |
| Order, left to right | Minimize, Maximize/Restore, Close |
| Glyph | 10 × 10 SVG, 1 px stroke, `shape-rendering: crispEdges` for the horizontal and square glyphs; centred in the button |
| Glyph colour, active window | `--fg` #f0f0f0 |
| Glyph colour, inactive window | `rgba(240, 240, 240, 0.45)` |
| Hover, Minimize and Maximize | background `--bg-elevated` #2b2b2b |
| Pressed, Minimize and Maximize | background `--border` #333, glyph at 70 % |
| Hover, Close | background `#C42B1C`, glyph `#fff` |
| Pressed, Close | background `#B1271A`, glyph `rgba(255, 255, 255, 0.75)` |
| Focus | `outline: 2px solid var(--accent); outline-offset: -3px` (inside, so the window edge never clips it) |
| Cursor | `default`, not `pointer` (system control) |
| Tooltip | native `title`: Minimize / Maximize / Restore / Close; PT Minimizar / Maximizar / Restaurar / Fechar; `aria-label` the same |
| Transitions | none (Windows caption buttons do not fade); `prefers-reduced-motion` is already global |

Glyph paths (viewBox 0 0 10 10):

```text
minimize  M0 5h10
maximize  rect x=.5 y=.5 w=9 h=9 rx=1
restore   M2.5 2.5V1.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7.5  +  rect x=.5 y=2.5 w=7 h=7 rx=1
close     M.5 .5l9 9 M9.5 .5l-9 9
```

States and sources of truth:

- Maximized: swap to the Restore glyph and label; set `data-maximized` on `#root` from `getCurrentWindow().onResized` + `isMaximized()`. When maximized Windows removes the rounded corners and the resize inset, so the buttons reach the very top edge.
- Focus: `onFocusChanged` sets `data-window-focus`; only the glyph colour changes. The app does not dim.
- Resize inset: while not maximized the top 5 px of each button belong to the resize handle; effective click area is 46 × 27. This is the native behaviour too.
- Tab order: the cluster is the last element in `#root`, so Tab from the last content control reaches Minimize → Maximize → Close and Shift+Tab from the first control wraps to Close. Enter and Space activate. While a sheet is open its focus trap excludes the cluster; Alt+F4 and Win+Down still work.
- Close hides the window to the tray (`CloseRequested` → `prevent_close()` + `hide()`); Quit lives only in the tray menu. The first hide shows a one-time in-app toast before hiding: "musicgame keeps running in the tray" / "O musicgame continua na bandeja".

### App bar and drag regions

- `.topbar` keeps 56 px, 44 × 44 icons at `y = 8`. It gets `data-tauri-drag-region`; so do its non-interactive children `.topbar-title` and `.wordmark` (Tauri checks the event target itself, so children need the attribute or `pointer-events: none`). Double-click on any drag region toggles maximize; Tauri does this for the attribute.
- `.quiz-progress` (round strip, pills, timer ring) is also a drag region: nothing in it is interactive. `.lesson-steps` is not: its segments are buttons.
- A full-width drag strip outside the page column: `position: fixed; top: 0; left: 0; right: 138px; height: 56px; z-index: 4` with the drag attribute, under the sticky bar (`z-index: 5`). It gives the empty margins beside the 760 px column to the window.
- Collision rule. When the page column's right edge comes within 148 px of the window edge, the bar reserves that space:

  ```css
  #root { container-type: inline-size; }               /* 100cqw excludes the scrollbar */
  .topbar { padding-right: max(10px, calc(148px - (100cqw - 100%) / 2)); }
  ```

  `100%` resolves against the page width, so the formula is 148 px minus the right margin. At 1100 px this is 148 px on Home (1160 px column) and 10 px on every other screen; under 1060 px it is 148 px everywhere. If container units are unavailable, a `ResizeObserver` on `.topbar` setting a `--caption-pad` custom property is the fallback.
- Under 480 px the wordmark drops from 22 to 20 px.
- Optional narrow fallback, owner's call: under 480 px the quiz title keeps only about 118 px and truncates ("Notas Natur…"). If that bothers, below 480 px give `.topbar` `padding-top: 32px` instead of the right padding, which stacks the controls above the bar on their own row only on tiny windows.
- Right-click on the drag region does nothing (no system menu for frameless windows); Alt+Space is lost. Win+Arrow snapping works because the window keeps its thick frame.

### Behaviour per screen

| Screen | Bar content | Drag regions | Controls |
| --- | --- | --- | --- |
| Home | wordmark, Stats, Tuner, Settings | wordmark, bar background, margins | adjacent to the gear at 1100 px (bar pads 148 px); in the margin above about 1310 px |
| Quiz | Back, title, Sound, Settings; round strip below | bar, title, round strip, margins | in the margin at 1100 px; adjacent below about 1060 px |
| Lesson | Back, title, step chip; step strip below | bar, title, margins (not the step strip) | as Quiz |
| Stats, Tuner | Back, title | bar, title, margins | as Quiz |
| Settings sheet open | unchanged under the backdrop | the backdrop is not draggable | above the backdrop (`z-index: 100 > 20`), full brightness and clickable; Esc closes the sheet, not the window |
| Feedback sheet open | unchanged | bar still drags | above the sheet (`100 > 10`) |
| Results | Back, title, Sound, Settings | bar, title, margins | as Quiz |

### Sizes at a glance

| Element | Size |
| --- | --- |
| Cluster | 138 × 32 at the top-right corner |
| Button | 46 × 32, radius 0 |
| Glyph | 10 × 10, 1 px |
| App bar | 56 px; icons 44 × 44 at `y = 8`, radius 12 |
| Collision padding | 148 px (138 + the bar's 10 px) |
| Drag strip | full width minus 138 px, 56 px tall |
| Resize inset | 5 px on every edge while not maximized |
| Minimum window | 400 × 560 |

## App icon and tray icon

Three concepts, each with a master SVG (256–32 px), a small master (24 and 16 px) and tray masters, all in `mocks/desktop-icons.html` with source:

- **Marker.** Dark tile (`--bg-card` with a `--border-strong` rim), one white string, one faint fret wire, one mint dot: a note on a line and a finger on a string in the same shape. Quiet on the dark taskbar, a clear dark square on the light one.
- **Grid.** Mint tile with three strings, two frets and a dark finger dot. The brightest of the three and the most "guitar"; also the loudest next to the app's own restraint.
- **Monogram.** The lowercase m of the wordmark drawn as three mint strokes with two arches, which also read as strings. Most brand-like, least literal; at 16 px the arches merge into a readable block m.

Recommendation: **Marker**. It is the only one that says both halves of the app (reading and the fretboard), it keeps the app's dark surface, and its 16 px form (line plus dot) is unlike any neighbouring taskbar icon.

Sizes to export from the chosen concept:

| File | Sizes | Source |
| --- | --- | --- |
| `icon.ico` | 256, 48, 32 from the master; 24, 16 from the small master | combine with an ICO packer; do not let `tauri icon` downscale the master to 16 |
| `icon.png` | 512 | master |
| `128x128.png`, `128x128@2x.png`, `32x32.png` | 128, 256, 32 | master |
| `tray-dark-{16,20,24,32}.png` | glyph white `#fff`, dot `--accent` | tray master, 1 px transparent padding at 16, 2 px at 32 |
| `tray-light-{16,20,24,32}.png` | glyph `#1b1b1b`, dot `#0a8a5c` | tray master; mint alone is 1.5 : 1 on the light taskbar |

The tray picks dark or light by reading `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize\SystemUsesLightTheme` (the taskbar follows the *system* theme, not the app theme) and swaps with `TrayIcon::set_icon` when it changes. Windows chooses 16, 20, 24 or 32 px from display scaling, so all four are checked on both taskbars.

## Tray menu

Native Windows menu; only items, order and labels are specified.

| # | English | Português | Kind | Behaviour |
| --- | --- | --- | --- | --- |
| 1 | Open musicgame | Abrir musicgame | default (bold) | shows and focuses the window; also left click and double click on the icon |
| 2 | Continue: ‹topic› / Up next: ‹topic› | Continuar: ‹tópico› / Próximo passo: ‹tópico› | item | opens straight into that quiz; uses `recommendTopic()` (`continue` vs `next`); disabled while a quiz round is running |
| 3 | Tuner | Afinador | item | opens the window on the Tuner |
| — | separator | | | |
| 4 | Start with Windows | Iniciar com o Windows | checkbox | same state as the Settings toggle |
| — | separator | | | |
| 5 | Quit | Sair | item | ends the process |

Changes suggested to the plan: no Stats item (two clicks away once open; five lines keep the menu scannable); keep "Open musicgame" even while the window is visible rather than swapping it for "Hide"; set the tray tooltip to "musicgame" plus the recommended topic on a second line; no notification balloons, the one-time in-app toast explains close-to-tray instead. Topic names follow the current language setting, so the menu is rebuilt when the language changes.

## Desktop section of the Settings sheet

Two groups appended after Sounds, in the existing `.setting` / `.setting-row` style (mock in `mocks/desktop-settings.html`, EN and PT):

**This computer / Neste computador** (desktop build only)

- Row: "Start with Windows" / "Iniciar com o Windows" with the existing `.switch`; hint "Opens quietly in the tray, not as a window." / "Abre discretamente na bandeja, sem janela."
- Static note: "Closing the window keeps musicgame in the tray. To quit, use the tray menu." / "Fechar a janela mantém o musicgame na bandeja. Para sair, use o menu da bandeja."
- The toggle reflects the real autostart state when the sheet opens (`tauri-plugin-autostart` with `--tray`), not a cached preference.

**Progress / Progresso** (both builds, so the browser can export before switching)

- Two `.btn.btn-secondary.sm` buttons: "Export progress…" / "Exportar progresso…" and "Import progress…" / "Importar progresso…"; the ellipsis signals a file dialog.
- Hint: "Scores and answer history, as one .json file. Use it to move progress between this app and the browser version." / "Pontuações e histórico de respostas, em um arquivo .json. Use para levar o progresso entre este app e a versão no navegador."
- After an export, a second hint line: "Last export: 14 Oct 2026, 21:12" / "Última exportação: 14 out 2026, 21:12".
- Export writes `{ version, exportedAt, language, scores, attempts }`: the scores and answer-history storage keys verbatim, no settings (they are per device). Desktop uses a native save dialog with default name `musicgame-progress-YYYY-MM-DD.json`; the browser downloads the same file.
- Import validates `version` and shape, then uses the existing `ConfirmDialog`: "Import 12 plays across 5 topics?" with note "Added to what is here. Best scores keep the higher value; answer history is merged by date." Cancel / Import. Merge, never replace: Stats already has Reset all for that. Errors name the cause: "This file is not a musicgame export." / "This export is from a newer version. Update the app first."

## Decisions (approved 2026-10-16, implemented)

1. **Direction:** B, Corner.
2. **Close hover colour:** Windows red `#C42B1C`.
3. **Narrow windows under 480 px:** keep the 148 px right padding; long titles truncate.
4. **Snap Layouts:** not added; dragging to the screen edges and Win+Arrow still snap.
5. **Icon concept:** Marker. Sources are in `src-tauri/icons/source/`; `npm run desktop:icons` renders every size.
6. **Import semantics:** merge only.
7. **Tray menu:** as specified, with no Stats item; "Up next:" for never-played topics.

Implementation notes that differ from or add to the spec:
- The desktop build scrolls `#root` rather than the page, so the scrollbar starts below the caption buttons instead of running up beside Close.
- Saved window state covers size, position and maximized state only; restoring decorations would bring the native frame back.
- The first close shows the tray note for about two seconds, then hides; the tray remembers it was shown.
- `color-scheme: dark` on `:root` gives native scrollbars and form controls the dark theme in both builds.

## Original questions for the owner

1. **Direction:** B (recommended), or A if the controls should read as app toolbar buttons.
2. **Close hover colour:** Windows red `#C42B1C` (recommended, convention) or the app's `--danger` #f87171 with a dark glyph.
3. **Narrow windows under 480 px:** keep the 148 px right padding (title truncates to about 118 px) or stack the controls above the bar on tiny windows only.
4. **Snap Layouts:** accept that hovering Maximize shows no snap flyout, or add a native hit test (`tauri-plugin-decorum` or a `WM_NCHITTEST` handler returning `HTMAXBUTTON`).
5. **Icon concept:** Marker (recommended), Grid or Monogram.
6. **Import semantics:** merge only (recommended) or also offer replace.
7. **Tray menu:** confirm dropping a Stats item and the "Up next:" wording for never-played topics.
