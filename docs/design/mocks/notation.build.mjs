// Builds the round-2 notation board (redesign-notation.html) from the
// screenshots of the prototype in notation-proto/ (taken by
// notation-proto/shoot.mjs into notation-shots/).
// Run: node docs/design/mocks/notation.build.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

const T = {
  bg: '#151816', surface: '#1d211e', sunken: '#101312', fg: '#f2f4f0', fg2: '#c9cec8', muted: '#9aa39b',
  accent: '#7fe0b4', amber: '#f2b84b', danger: '#f08a7e', line: '#2d332e', lineStrong: '#3a423b', outline: '#5a655d',
  staffLine: '#7c867e', paperQuiet: '#dcd9cf', ink: '#1b1e1b', quietLine: '#3f463f', quietHighlight: '#047857', quietLabel: '#454c46',
  paperToday: '#fafafa', inkToday: '#000000', labelToday: '#555555', highlightToday: '#059669', bgToday: '#1a1a1a', cardToday: '#242424',
};
const hex = h => h.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)); };
const f = n => n.toFixed(1);
const ok = (n, target) => `<span class="${n >= target ? 'ok' : 'bad'}">${f(n)}</span>`;

const CSS = `
*{box-sizing:border-box}
html{background:#0b0d0c;color:#e8ebe7;font-family:'Segoe UI Variable Text','Segoe UI',system-ui,sans-serif}
body{margin:0;padding:28px 36px 90px;max-width:1880px}
a{color:${T.accent}}
.board-head{max-width:1200px;margin:0 0 24px}
.board-head h1{font-family:'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif;font-size:32px;margin:0 0 6px;letter-spacing:-.4px}
.board-head .kicker{color:#9aa39b;font-size:14px;margin:0 0 8px}
.board-head .kicker a{margin-right:14px}
.board-head p{max-width:860px;line-height:1.55;color:#cfd4ce;margin:8px 0}
h2.sec{font-family:'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif;font-size:22px;letter-spacing:-.2px;color:#f2f4f0;margin:48px 0 6px;padding-top:22px;border-top:1px solid #1f2420}
h2.sec small{display:block;font-size:14px;color:#9aa39b;font-weight:400;margin-top:4px;max-width:960px;line-height:1.5}
.row{display:flex;flex-wrap:wrap;gap:28px 32px;align-items:flex-start;margin-top:16px}
.frame{margin:0;display:flex;flex-direction:column;gap:8px;max-width:100%}
.frame img{display:block;border:1px solid #000;box-shadow:0 0 0 1px #2a2f2b,0 24px 60px rgba(0,0,0,.5);max-width:100%;height:auto;background:${T.bg}}
.frame.phone img{border-radius:28px;box-shadow:0 0 0 5px #1b1f1c,0 24px 60px rgba(0,0,0,.5)}
.frame.detail img{box-shadow:none;border:1px solid #2a2f2b;border-radius:8px}
.frame figcaption{font-size:13px;line-height:1.5;color:#9aa39b;max-width:var(--cw,480px)}
.frame figcaption b{color:#e8ebe7;font-weight:600}
.spec{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:1500px;margin-top:16px}
.note{border:1px solid #242925;border-radius:12px;padding:16px;background:#121513;font-size:13px;line-height:1.6;color:#cfd4ce}
.note h3{margin:0 0 8px;font-size:15px;color:#f2f4f0}
.note.rec{border-color:#35594a}
.note ul{margin:6px 0 0;padding-left:18px}
table.t{border-collapse:collapse;font-size:13px;margin-top:14px}
table.t th,table.t td{text-align:left;padding:7px 12px;border-bottom:1px solid #242925;vertical-align:top}
table.t th{color:#9aa39b;font-weight:500}
.sw{display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:6px;border:1px solid rgba(255,255,255,.12)}
.ok{color:#7fe0b4}.bad{color:#f08a7e}.warn{color:#f2b84b}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;max-width:1900px;margin-top:16px}
.pair .frame img{width:100%}
.callout{font-size:13px;color:#7fe0b4;border:1px dashed #35594a;border-radius:8px;padding:8px 12px;max-width:760px;line-height:1.45;margin-top:10px}
code{font-family:Consolas,'Cascadia Mono',monospace;font-size:12px;color:#c9cec8}
`;

const img = (name, cap, { w, cls = '' } = {}) =>
  `<figure class="frame ${cls}" style="--cw:${w ?? 960}px"><img src="notation-shots/${name}.webp" alt="${name}" ${w ? `width="${w}"` : ''} loading="lazy"><figcaption>${cap}</figcaption></figure>`;
const beforeAfter = (base, capBefore, capAfter, { w = 960, cls = '' } = {}) =>
  `<div class="pair">${img(`${base}-before`, `<b>Before</b> — ${capBefore}`, { w, cls })}${img(`${base}-after`, `<b>After</b> — ${capAfter}`, { w, cls })}</div>`;
const sec = (title, sub, body) => `<h2 class="sec">${title}${sub ? `<small>${sub}</small>` : ''}</h2>${body}`;

const contrastRows = [
  ['Stave and tab lines', T.staffLine, T.surface, 3, 'panel'], ['Stave and tab lines', T.staffLine, T.bg, 3, 'page'],
  ['Glyphs: clefs, noteheads, stems, beams, rests, tab numbers, time signatures', T.fg, T.surface, 4.5, 'panel'], ['Glyphs', T.fg, T.bg, 4.5, 'page'],
  ['Ledger lines (glyph colour, 1 px at 1×)', T.fg, T.surface, 3, 'panel'],
  ['Highlighted note, its ledger lines, halo ring, lit tab string and tab number', T.accent, T.surface, 3, 'panel'], ['Highlight', T.accent, T.bg, 3, 'page'],
  ['Highlight against the glyph colour (the two notehead colours side by side)', T.accent, T.fg, 1.4, 'n/a'],
  ['Line and space numbers, tab string names', T.muted, T.surface, 4.5, 'panel'], ['Line and space numbers', T.muted, T.bg, 4.5, 'page'],
  ['Note labels under the staff', T.fg2, T.surface, 4.5, 'panel'],
  ['Highlighted label', T.accent, T.surface, 4.5, 'panel'],
  ['Linked tab: plain strings (the neck’s string grey)', T.muted, T.surface, 3, 'panel'],
];
const quietRows = [
  ['Quiet paper: ink on paper', T.ink, T.paperQuiet, 4.5], ['Quiet paper: stave lines', T.quietLine, T.paperQuiet, 3],
  ['Quiet paper: highlight', T.quietHighlight, T.paperQuiet, 3], ['Quiet paper: labels', T.quietLabel, T.paperQuiet, 4.5],
  ['Quiet paper card against the page (glare)', T.paperQuiet, T.bg, 0], ['Today’s paper card against the page (glare)', T.paperToday, T.bgToday, 0],
  ['Today: ink on paper', T.inkToday, T.paperToday, 4.5], ['Today: labels on paper', T.labelToday, T.paperToday, 4.5], ['Today: highlight on paper', T.highlightToday, T.paperToday, 3],
];
const table = rows => `<table class="t"><tr><th>Pair</th><th>Colours</th><th>Where</th><th>Target</th><th>Ratio</th></tr>${rows.map(([n, a, b, t, where]) =>
  `<tr><td>${n}</td><td><span class="sw" style="background:${a}"></span>${a} on <span class="sw" style="background:${b}"></span>${b}</td><td>${where ?? ''}</td><td>${t || '—'}</td><td>${t ? ok(cr(a, b), t) : f(cr(a, b))}</td></tr>`).join('')}</table>`;

const head = `<h1>Notation — round 2 of the redesign</h1>
<p class="kicker">musicgame · UI redesign · <a href="redesign-index.html">index</a><a href="redesign-a.html">A — Stage</a><a href="redesign-b.html">B</a><a href="redesign-c.html">C</a><b>notation</b></p>
<p>Direction A is approved. The owner’s one change: the white notation cards (tab and staff in quiz feedback, every staff diagram in the lessons) glare on the dark UI and look pasted in; notation should belong to the same visual language as the app’s own fretboard drawing, and no lesson may get harder to read.</p>
<p>Every drawing on this board is real VexFlow 4 output (Bravura font, SVG backend) from a throwaway prototype served by the Vite dev server: <code>notation-proto/index.html</code>, with prototype copies of the five notation components in <code>notation-proto/notation.tsx</code>. The fretboards are the real <code>Fretboard.tsx</code>. Screens are the approved A layout at 1920 × 1032 (stored at 50 %), 1100 × 720 and 390 × 844; the detail crops are 1 : 1 or 2 : 1. Nothing under <code>src/</code> changed. Write-up: <code>docs/design/REDESIGN.md</code>, section “Notation”.</p>`;

const directions = sec('Three directions, one component strip', 'The same notation in today’s card, and in the three proposals, rendered side by side at 1 : 1 on the page background (first row) and inside a lesson panel. Column 1 is today. Columns 2–4 are the proposals.',
  `<div class="spec">
<div class="note"><h3>N3 · Quiet paper (conservative fallback)</h3>Keeps the card, loses the glare: a warm grey paper (${T.paperQuiet}, 12.7 : 1 against the page instead of 16.7 : 1 today), no border, 12 px radius, ink ${T.ink}. Highlight gets the halo ring too. Shown because it is the smallest change (two tokens and a CSS rule), not because it is recommended: the card is still a pasted-in rectangle, the highlight green is a different green from the neck’s mint, and the eye still re-adapts between the card and the neck on the screens that show both.</div>
<div class="note rec"><h3>N1 · Ink on slate (recommended as the base)</h3>No card. The stave and tab lines are drawn in a grey one step below the neck’s strings (${T.staffLine}), the glyphs in the foreground colour, the highlighted note and its ledger lines in the same mint the fretboard markers use, with a halo ring and a bold label, and the line and space numbers in the muted label colour. Notation sits directly on the panel or the page, like the neck does. Comprehension gain: one colour means “this note” everywhere (the staff note, its label, the neck marker, the lit string); nothing competes with the glyphs; and lessons that show a staff above a neck no longer flip between a bright card and a dark board.</div>
<div class="note rec"><h3>N2 · Ink + linked tab (recommended wherever a neck or a position is shown)</h3>N1, plus the tab drawn in the neck’s own geometry: six lines in the string grey, thicker towards string 6 exactly like the board (1 + 0.3 × string), the played string lit in mint with the fret number on it, and the string names E B G D A E at the left in the same order as the board’s labels. The TAB sign stays, so the learner still recognises real tablature. Comprehension gain: the tab is visibly a picture of the six strings the learner just tapped, in the same orientation (string 1 on top), which is the single most common tab confusion; the lit line answers “which string?” before the number answers “which fret?”; in the rhythm measure the lit string shows the whole phrase is on one string.</div>
</div>
${img('strip', '<b>Component strip at 1920 px.</b> Rows: quiz feedback pair for string 6 fret 10 (sounds D3, written D4, just under the staff, no ledger line needed); the open 6th string (written E3, three ledger lines) and open 1st string (E5); the Treble Clef lesson diagram with numbered lines and spaces; bass F3 and alto C4; the Staff, Tab and Rhythm measure (half, quarter, two beamed eighths on string 1, frets 3 5 7 5) with tab note 3 highlighted; a measure with rests; a tab alone; the piano keyboard.', { w: 1800 })}
<p class="callout">Recommendation: build N1 as the base for every notation component, and N2’s linked tab for <code>GuitarTab</code>, <code>PositionNotation</code> and the tab half of <code>MeasureNotation</code>. N3 only if the owner wants to keep a paper look as a brand trait.</p>`);

const feedback = sec('Quiz feedback — “Find D on string 6”, wrong tap at fret 9', 'The route E–F–G–A–B–C–D on the neck, the answer D at fret 10, the tab with line 6 lit and “10” on it, and the written note D4 under the staff (guitar is written one octave above the sound). Without card chrome the pair grows from 220 to 260 px in the same column at 1920.',
  beforeAfter('feedback-1920', 'A board as approved, with today’s paper cards.', 'N2: tab and staff in ink, string 6 lit in the tab as on the neck.') +
  `<div class="row">${img('feedback-1920-detail-before', '<b>Detail, 1 : 1</b> — today’s 220 px cards.', { cls: 'detail', w: 640 })}${img('feedback-1920-detail-after', '<b>Detail, 1 : 1</b> — N2 at 260 px: string names, lit string 6, the number on the lit string, D4 in the glyph colour.', { cls: 'detail', w: 720 })}</div>` +
  `<div class="row">${img('feedback-1920-after-ink', '<b>N1 only</b> (plain tab, no string link) for comparison.', { w: 960 })}${img('feedback-1920-after-quiet', '<b>N3 quiet paper</b> for comparison.', { w: 960 })}</div>` +
  beforeAfter('feedback-1100', '1100 × 720, the desktop default window; the pair is 156 px.', 'Same window, N2. The lit string reads at 156 px.', { w: 550 }) +
  `<div class="row">${img('feedback-390-before', '<b>390 × 844, before</b> — whole page; feedback in flow under the split neck, as approved in A.', { cls: 'phone', w: 390 })}${img('feedback-390-after', '<b>390 × 844, after</b> — N2. Continue is sticky at the viewport bottom in the app; the capture shows the whole flow.', { cls: 'phone', w: 390 })}${img('feedback-390-detail-after', '<b>Phone detail at 2 : 1</b> — line spacing 10 px, tab number 11 pt, string names 11 px, whole note 11 × 7 px: the same sizes as today, now without glare.', { cls: 'detail', w: 390 })}</div>` +
  `<div class="row">${img('feedback-1100-pt-after', '<b>Português check</b> — captions “Tablatura” and “Pauta (escrita)”, neck labels from the app’s i18n, the Ré answer.', { w: 550 })}</div>`);

const mc = sec('Multiple choice with a staff — Note Names, B on line 3', 'The staff renders at the pane width × 0.7, capped at 720 px (scale 2.57, line spacing 26 px). With N1 the stage is one surface: the question is the drawing, not a card on a stage.',
  beforeAfter('mc-1920', 'Question state, today’s card scaled up.', 'Question state, N1.') +
  beforeAfter('mc-1920-answered', 'Answered (automatic mode), card.', 'Answered, N1.') +
  `<div class="row">${img('mc-390-after', '<b>390 × 844</b> — staff at 1.2 ×, answers 2 × 2.', { cls: 'phone', w: 390 })}</div>`);

const lessons = sec('Lessons — Treble Clef, Clefs, Staff/Tab/Rhythm, explorer', 'Every StaffDiagram keeps its numbered lines (left), numbered spaces (right), labels and highlight; the panel scales the drawing up to 2.2 × (line spacing 22 px). The highlighted note is told apart three ways: the mint colour, the halo ring, and the bold label.',
  beforeAfter('lesson-treble-1920', 'Treble Clef step 3 (B highlighted, lines numbered), paper card inside the dark panel.', 'N1: the diagram is the panel’s content.') +
  `<div class="row">${img('lesson-treble-1920-detail-after', '<b>Detail, 1 : 1</b> — numbers in the readout face, labels “G / Sol”, “A / La”, “B / Ti” (notation setting “both”), halo on B.', { cls: 'detail', w: 780 })}</div>` +
  beforeAfter('lesson-treble-1100-four', 'Step 4 at 1100 × 720: lines and spaces numbered, all three highlighted.', 'N1 at 1100 × 720.', { w: 550 }) +
  beforeAfter('lesson-clefs-1920', 'Clefs lesson, last step: treble, bass and alto.', 'N1: three clefs on the panel.') +
  `<div class="row">${img('lesson-clefs-1100-bass-after', '<b>Bass clef step at 1100</b> — F3 on line 4, highlighted and labelled.', { w: 550 })}</div>` +
  beforeAfter('lesson-measure-1920', 'Staff, Tab and Rhythm, “Count four beats”: half, quarter, two eighths on string 1.', 'N2: the written staff above, the rhythmic tab below with the six strings named; beams, stems and the time signatures in the glyph colour.') +
  `<div class="row">${img('lesson-measure-1920-detail-after', '<b>Detail, 1 : 1</b> — at 1.7 ×: line spacing 17 px, tab numbers 19 px.', { cls: 'detail', w: 880 })}</div>` +
  beforeAfter('quiz-measure-1100', 'The “How long does tab note 3 last?” question at 1100 × 720, card.', 'N2, plus a proposal: the asked note gets the halo on the staff and the lit string in the tab, so “note 3” is unambiguous.', { w: 550 }) +
  beforeAfter('explorer-1920', 'Natural Notes explorer: string 4 fret 2 selected.', 'N2: the lit tab line is string 4 (D), the number 2 sits on it, the written note is E4 on the bottom line.') +
  `<div class="row">${img('explorer-1920-detail-after', '<b>Detail, 1 : 1</b> — explorer pair at 260 px.', { cls: 'detail', w: 640 })}${img('explorer-390-after', '<b>390 × 844</b> — explorer on a phone with the split neck.', { cls: 'phone', w: 390 })}</div>`);

const legibility = sec('Legibility', 'WCAG 2.x contrast computed in this script. Targets: 3 : 1 for graphical objects (lines, noteheads, ring), 4.5 : 1 for text (labels, numbers). “Panel” is the lesson visual panel (surface), “page” the quiz column background.',
  table(contrastRows) +
  `<h3 style="margin:22px 0 0;font-size:15px">The fallback and today</h3>` + table(quietRows) +
  `<div class="spec" style="margin-top:22px">
<div class="note"><h3>Minimum sizes at 390 px (measured in the prototype)</h3><ul><li>Line spacing 10 px (VexFlow default; unchanged from today).</li><li>Whole-note head about 11 × 7 px; ledger lines 1 px, glyph colour (14.7 : 1).</li><li>Tab number 11 pt ≈ 15 px, readout face, bold.</li><li>String names 11 px bold, muted (6.3 : 1); the lit one in mint.</li><li>Line and space numbers 12 px, readout face.</li><li>Note labels 13 px (bold when highlighted).</li><li>Captions “Tab” / “Staff (written)” 13 px, sentence case (round 1, R3).</li></ul></div>
<div class="note"><h3>Highlight without colour alone</h3><ul><li>A 1.5 px ring at radius 10.5 around the notehead with a 18 % mint fill: a shape, visible in greyscale.</li><li>The label under the note goes bold (500 → 700).</li><li>In the tab the lit string is 3 px against 1–2.5 px, and the number sits on it.</li><li>The halo is drawn before the note, so the notehead stays crisp over it.</li></ul></div>
<div class="note"><h3>What stays the same for the learner</h3><ul><li>Same VexFlow layout, clefs, note positions, ledger lines, numbering and labels as today — only the colours and the surface change; the tab gains string names.</li><li>Guitar facts kept: tab line 1 (top) is string 1; written pitch = sounding + 12 (D3 → D4, E2 → E3, E3 → E4).</li><li>The piano keyboard keeps white keys (it is a picture of a real object) but drops to the quiet off-white (${'#e3e1d8'}) with the page colour for black keys. Secondary; see the strip.</li></ul></div>
</div>`);

const decisions = sec('Decisions for the owner', '',
  `<div class="spec">
<div class="note"><h3>1. Direction</h3>N1 + N2 (recommended), N1 alone (plain tab everywhere), or N3 quiet paper.</div>
<div class="note"><h3>2. Linked tab scope</h3>Everywhere a tab is drawn (recommended: feedback, explorer, Strings and Tuning, Staff/Tab/Rhythm lesson and quiz), or only where a neck is on the same screen.</div>
<div class="note"><h3>3. Highlight the asked note in the rhythm quiz</h3>Halo on the staff and lit string in the tab for “tab note n” questions (recommended), or keep the measure neutral as today.</div>
<div class="note"><h3>4. Pair size</h3>260 / 200 / 156 px in the feedback column (recommended, possible without card chrome) or the A spec’s 220 / 180 / 156.</div>
<div class="note"><h3>5. Keyboard</h3>Quiet off-white keys (recommended) or keep #fafafa.</div>
</div>`);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Notation · musicgame redesign mocks</title><style>${CSS}</style></head>
<body><header class="board-head">${head}</header>${directions}${feedback}${mc}${lessons}${legibility}${decisions}</body></html>`;
writeFileSync(join(OUT, 'redesign-notation.html'), html);
console.log('wrote redesign-notation.html');
// Print the contrast table for the write-up.
for (const [n, a, b, t, where] of [...contrastRows, ...quietRows]) console.log(`${n} | ${a} on ${b}${where ? ' (' + where + ')' : ''} | ${t || '—'} | ${f(cr(a, b))}`);
