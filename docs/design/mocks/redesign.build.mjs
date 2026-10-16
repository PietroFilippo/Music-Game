// Builds the redesign mock boards (redesign-index.html, redesign-a.html,
// redesign-b.html, redesign-c.html) as self-contained static HTML.
// Run: node docs/design/mocks/redesign.build.mjs
// The fretboard geometry is a port of src/components/Fretboard.tsx so the
// boards show the real neck; staves and tabs approximate VexFlow's layout.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- tokens */
const TOKENS = {
  bg: '#151816', sunken: '#101312', surface: '#1d211e', elevated: '#262b27',
  fg: '#f2f4f0', fg2: '#c9cec8', muted: '#9aa39b',
  accent: '#7fe0b4', accentStrong: '#3ccf95', onAccent: '#0c1711',
  danger: '#f08a7e', amber: '#f2b84b',
  line: '#2d332e', lineStrong: '#3a423b', outline: '#5a655d', focus: '#9cf0cc',
  paper: '#f4f3ee', ink: '#1b1e1b', ink2: '#5b625c',
};
const CURRENT = {
  bg: '#1a1a1a', card: '#242424', elevated: '#2b2b2b', fg: '#f0f0f0', muted: '#a0a0a0',
  accent: '#6ee7b7', accentStrong: '#34d399', danger: '#f87171', warn: '#fbbf24',
  border: '#333333', borderStrong: '#3a3a3a', paper: '#fafafa', ink: '#222222',
};

const hex = h => h.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(1); };

/* ----------------------------------------------------------------- icons */
const ICONS = {
  back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  stats: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  tuner: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
  arrowRight: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
  sound: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5.5a9 9 0 0 1 0 13"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  cross: '<path d="M18 6L6 18M6 6l12 12"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  retry: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/>',
};
const icon = (name, size = 20, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const caption = (maximized) => `<div class="caption" aria-label="Window controls">
<span class="caption-btn"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1" shape-rendering="crispEdges"><path d="M0 5h10"/></svg></span>
<span class="caption-btn">${maximized
    ? '<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"><path d="M2.5 2.5V1.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7.5"/><rect x=".5" y="2.5" width="7" height="7" rx="1"/></svg>'
    : '<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"><rect x=".5" y=".5" width="9" height="9" rx="1"/></svg>'}</span>
<span class="caption-btn caption-close"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"><path d="M.5 .5l9 9M9.5 .5l-9 9"/></svg></span>
</div>`;

/* ------------------------------------------------------------- fretboard */
// Port of Fretboard.tsx geometry. Strings are indexed 0 (high E, top) to 5 (low E, bottom).
const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E'];
const TONES = {
  accent: { fill: 'var(--accent)', stroke: 'var(--accent)', text: 'var(--on-accent)' },
  plain: { fill: 'var(--surface)', stroke: 'var(--fg)', text: 'var(--fg)' },
  root: { fill: 'var(--amber)', stroke: 'var(--amber)', text: 'var(--on-accent)' },
  wrong: { fill: 'var(--danger)', stroke: 'var(--danger)', text: 'var(--on-accent)' },
};
function fretboard({
  frets = 12, first = 0, last = frets, markers = [], highlightStrings = [], showFretNumbers = false,
  stringLabels = 'name', interactive = false, split = false, width = 560, lane = true, focusCell = null,
  style = '', cls = '', label = 'Guitar fretboard', hover = null,
} = {}) {
  const labelW = stringLabels === 'none' ? 6 : stringLabels === 'both' ? 46 : 26;
  const OPEN_W = 34, PAD_R = 12, PAD_T = 18;
  const gap = interactive ? (split ? 38 : 34) : 24;
  const boardH = gap * 5;
  const withOpen = first === 0;
  const startX = withOpen ? labelW + OPEN_W : labelW + 10;
  const offset = withOpen ? 0 : first - 1;
  const fretGap = (width - startX - PAD_R) / (last - offset);
  const height = PAD_T * 2 + boardH + (showFretNumbers ? 18 : 0);
  const y = s => PAD_T + s * gap;
  const x = f => (f === 0 ? labelW + OPEN_W / 2 : startX + (f - offset - 0.5) * fretGap);
  const inRange = f => f >= first && f <= last;
  const cellBox = p => ({
    x: p.fret === 0 ? labelW : startX + (p.fret - offset - 1) * fretGap,
    y: y(p.string) - gap / 2, w: p.fret === 0 ? OPEN_W : fretGap, h: gap,
  });
  const fretList = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  let s = `<svg viewBox="0 0 ${width} ${height}" class="fretboard${interactive ? ' fretboard-interactive' : ''} ${cls}" role="${interactive ? 'group' : 'img'}" aria-label="${label}" style="${style}">`;
  // Target-string lane (redesign addition): a soft band behind the whole string.
  if (lane) for (const st of highlightStrings) {
    s += `<rect x="${labelW + 4}" y="${y(st) - gap / 2}" width="${width - PAD_R - labelW - 4}" height="${gap}" rx="${Math.min(8, gap / 4)}" fill="var(--accent)" opacity=".10"/>`;
  }
  if (hover) {
    const b = cellBox(hover);
    s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="var(--accent)" opacity=".14"/>`;
  }
  for (let st = 0; st < 6; st++) {
    const lit = highlightStrings.includes(st);
    s += `<line x1="${labelW + 4}" x2="${width - PAD_R}" y1="${y(st)}" y2="${y(st)}" stroke="${lit ? 'var(--accent)' : 'var(--muted)'}" stroke-width="${lit ? 4 : 1 + st * 0.3}"/>`;
  }
  s += `<line x1="${startX}" x2="${startX}" y1="${PAD_T}" y2="${PAD_T + boardH}" stroke="${withOpen ? 'var(--fg)' : 'var(--line-strong)'}" stroke-width="${withOpen ? 3 : 1}"/>`;
  for (const f of fretList) if (f > 0) s += `<line x1="${startX + (f - offset) * fretGap}" x2="${startX + (f - offset) * fretGap}" y1="${PAD_T}" y2="${PAD_T + boardH}" stroke="var(--line-strong)" stroke-width="1"/>`;
  for (const f of [3, 5, 7, 9, 15, 17, 19, 21].filter(inRange)) s += `<circle cx="${x(f)}" cy="${PAD_T + boardH / 2}" r="5" fill="var(--line-strong)"/>`;
  for (const f of [12, 24].filter(inRange)) for (const row of [1.5, 3.5]) s += `<circle cx="${x(f)}" cy="${PAD_T + gap * row}" r="5" fill="var(--line-strong)"/>`;
  if (stringLabels !== 'none') for (let st = 0; st < 6; st++) {
    const name = stringLabels === 'number' ? String(st + 1) : stringLabels === 'both' ? `${st + 1} ${STRING_NAMES[st]}` : STRING_NAMES[st];
    s += `<text x="${labelW - 4}" y="${y(st) + 4}" font-size="12" text-anchor="end" fill="${highlightStrings.includes(st) ? 'var(--accent)' : 'var(--muted)'}">${name}</text>`;
  }
  if (showFretNumbers) for (const f of fretList) s += `<text x="${x(f)}" y="${height - 6}" font-size="11" fill="var(--muted)" text-anchor="middle" class="fretnum">${f}</text>`;
  for (const m of markers.filter(m => inRange(m.fret))) {
    const tone = TONES[m.tone ?? 'plain'];
    const text = m.label ?? '';
    const wide = text.length > 2;
    s += `<g><circle cx="${x(m.fret)}" cy="${y(m.string)}" r="${wide ? 14 : 11}" fill="${tone.fill}" stroke="${tone.stroke}" stroke-width="2"/>`;
    if (text) s += `<text x="${x(m.fret)}" y="${y(m.string) + 4}" font-size="${wide ? 10 : 11}" text-anchor="middle" fill="${tone.text}" font-weight="${!m.tone || m.tone === 'plain' ? 500 : 700}">${text}</text>`;
    s += '</g>';
  }
  if (focusCell) {
    const b = cellBox(focusCell);
    s += `<rect x="${b.x + 1}" y="${b.y + 1}" width="${b.w - 2}" height="${b.h - 2}" rx="6" fill="none" stroke="var(--focus)" stroke-width="2"/>`;
  }
  s += '</svg>';
  return s;
}
// The phone split board: frets 0–6 and 7–12 at 360 px, as Fretboard.tsx does under 480 px.
function splitBoard(opts) {
  const a = fretboard({ ...opts, interactive: true, split: true, width: 360, first: 0, last: 6 });
  const b = fretboard({ ...opts, interactive: true, split: true, width: 360, first: 7, last: 12 });
  return `<div class="fretboard-split"><span class="fretboard-range">Frets 0–6</span>${a}<span class="fretboard-range">Frets 7–12</span>${b}</div>`;
}

/* ----------------------------------------------------- staff and tablature */
// Treble staff with one whole note. `step` 0 = E4 (bottom line), 1 = F4, 2 = G4 … negative below.
const STEP = { 'd/3': -8, 'e/3': -7, 'f/3': -6, 'g/3': -5, 'a/3': -4, 'b/3': -3, 'c/4': -2, 'd/4': -1, 'e/4': 0, 'f/4': 1, 'g/4': 2, 'a/4': 3, 'b/4': 4, 'c/5': 5, 'd/5': 6, 'e/5': 7, 'f/5': 8, 'g/5': 9, 'a/5': 10 };
function staff({ note, width = 200, height = 170, gap = 10, cls = '', style = '', accidental = '' } = {}) {
  const top = Math.round(height / 2 - 2 * gap) - 6;
  const bottom = top + 4 * gap;
  const left = 12, right = width - 10;
  let s = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="staff ${cls}" role="img" aria-label="Treble staff" style="${style}"><rect width="${width}" height="${height}" rx="8" fill="var(--paper)"/>`;
  for (let i = 0; i < 5; i++) s += `<line x1="${left}" x2="${right}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="var(--ink)" stroke-width="1"/>`;
  s += `<line x1="${left + .5}" x2="${left + .5}" y1="${top}" y2="${bottom}" stroke="var(--ink)" stroke-width="1"/>`;
  s += `<line x1="${right - .5}" x2="${right - .5}" y1="${top}" y2="${bottom}" stroke="var(--ink)" stroke-width="1"/>`;
  s += `<text x="${left + 4}" y="${bottom + gap * 1.05}" font-family="'Segoe UI Symbol','Noto Music',serif" font-size="${gap * 4.55}" fill="var(--ink)">𝄞</text>`;
  if (note !== undefined) {
    const step = STEP[note];
    const nx = left + gap * 7.2;
    const ny = bottom - step * gap / 2;
    const ledgerFrom = step <= -2 ? -2 : step >= 10 ? 10 : null;
    if (ledgerFrom !== null) {
      const dir = step < 0 ? -2 : 2;
      for (let l = ledgerFrom; step < 0 ? l >= step : l <= step; l += dir) {
        const ly = bottom - l * gap / 2;
        s += `<line x1="${nx - gap * 1.1}" x2="${nx + gap * 1.1}" y1="${ly}" y2="${ly}" stroke="var(--ink)" stroke-width="1.1"/>`;
      }
    }
    if (accidental) s += `<text x="${nx - gap * 1.9}" y="${ny + gap * .45}" font-family="'Segoe UI Symbol',serif" font-size="${gap * 1.9}" fill="var(--ink)">${accidental}</text>`;
    s += `<ellipse cx="${nx}" cy="${ny}" rx="${gap * .72}" ry="${gap * .48}" transform="rotate(-22 ${nx} ${ny})" fill="none" stroke="var(--ink)" stroke-width="${gap * .3}"/>`;
  }
  s += '</svg>';
  return s;
}
function tab({ string, fret, width = 200, height = 170, gap = 11, cls = '', style = '' } = {}) {
  const top = Math.round(height / 2 - 2.5 * gap);
  const left = 12, right = width - 10;
  let s = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="tab ${cls}" role="img" aria-label="Tablature" style="${style}"><rect width="${width}" height="${height}" rx="8" fill="var(--paper)"/>`;
  for (let i = 0; i < 6; i++) s += `<line x1="${left}" x2="${right}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="var(--ink)" stroke-width="1"/>`;
  s += `<line x1="${left + .5}" x2="${left + .5}" y1="${top}" y2="${top + 5 * gap}" stroke="var(--ink)" stroke-width="1"/>`;
  s += `<line x1="${right - .5}" x2="${right - .5}" y1="${top}" y2="${top + 5 * gap}" stroke="var(--ink)" stroke-width="1"/>`;
  const fs = gap * 1.9;
  ['T', 'A', 'B'].forEach((ch, i) => { s += `<text x="${left + 14}" y="${top + gap * (0.6 + i * 1.75) + fs * .35}" font-size="${fs}" font-weight="600" text-anchor="middle" fill="var(--ink)">${ch}</text>`; });
  if (string !== undefined) {
    const nx = left + gap * 7.5, ny = top + string * gap;
    s += `<rect x="${nx - gap * .9}" y="${ny - gap * .55}" width="${gap * 1.8}" height="${gap * 1.1}" fill="var(--paper)"/>`;
    s += `<text x="${nx}" y="${ny + gap * .4}" font-size="${gap * 1.15}" font-weight="600" text-anchor="middle" fill="var(--ink)">${fret}</text>`;
  }
  s += '</svg>';
  return s;
}
const notationPair = (pos, { width = 200 } = {}) => { const height = Math.round(width * 0.85); return `<div class="notation-pair">
<figure>${tab({ string: pos.string, fret: pos.fret, width, height, gap: Math.round(width / 18) })}<figcaption>Tab</figcaption></figure>
<figure>${staff({ note: pos.written, width, height, gap: Math.round(width / 20) })}<figcaption>Staff (written)</figcaption></figure></div>`; };

/* ---------------------------------------------------------------- content */
const L = (en, pt) => ({ en, pt });
const MODULES = [
  { n: 1, id: 'foundations', title: L('Music-reading foundations', 'Fundamentos de leitura musical'),
    desc: L('Read notes, rhythms and symbols, and connect the fundamentals to guitar.', 'Leia notas, ritmos e símbolos e conecte os fundamentos à guitarra.'),
    due: 0, history: true, topics: [
      ['pauta-i', L('Staff I — Lines &amp; Spaces', 'Pauta I — Linhas e Espaços'), { plays: 3, avg: 80, best: 90, last: 80 }],
      ['pauta-ii', L('Staff II — Notes on the Staff', 'Pauta II — Notas na Pauta'), { plays: 1, avg: 60, best: 60, last: 60 }],
      ['claves', L('Clefs', 'Claves')], ['clave-sol', L('Treble Clef — 3 Notes', 'Clave de Sol — 3 Notas')],
      ['nome-notas', L('Note Names', 'Nome das Notas')], ['notacao-alfabetica', L('Alphabetical Notation', 'Notação Alfabética')],
      ['nome-figuras', L('Rhythm Note Names', 'Nome das Figuras')], ['notas-descendentes', L('Descending Notes', 'Notas Descendentes')],
      ['propriedades-som', L('Sound Properties', 'Propriedades do Som')], ['notas-teclado', L('Keyboard Notes', 'Notas no Teclado')],
    ] },
  { n: 2, id: 'fretboard', title: L('Guitar fretboard and intervals', 'Braço da guitarra e intervalos'),
    desc: L('Locate notes on the instrument and understand the distances between them.', 'Encontre as notas no instrumento e entenda as distâncias entre elas.'),
    due: 11, history: true, topics: [
      ['cordas-afinacao', L('Strings and Tuning', 'Cordas e Afinação')], ['notas-braco', L('Natural Notes on the Neck', 'Notas Naturais no Braço')],
      ['sustenidos-bemois', L('Sharps and Flats', 'Sustenidos e Bemóis')], ['oitavas', L('Octaves on the Neck', 'Oitavas no Braço')],
      ['intervalos', L('Intervals', 'Intervalos'), { plays: 3, avg: 50, best: 70, last: 30 }],
      ['escalas', L('Major and Minor Scales', 'Escalas Maior e Menor')], ['leitura-braco', L('Staff, Tab and Rhythm', 'Pauta, Tablatura e Ritmo')],
    ] },
  { n: 3, id: 'triads', title: L('Triads, chords and arpeggios', 'Tríades, acordes e arpejos'),
    desc: L('Build three-note chords and play their notes in sequence across the fretboard.', 'Construa acordes de três notas e toque suas notas em sequência pelo braço.'),
    due: 0, history: false, topics: [
      ['triades', L('Building Triads', 'Formação de Tríades')], ['inversoes-triades', L('Inversions and String Sets', 'Inversões e Grupos de Cordas')],
      ['arpejos-triades', L('Triad Arpeggios', 'Arpejos de Tríades')], ['triades-progressoes', L('Triads in Progressions', 'Tríades em Progressões')],
    ] },
  { n: 4, id: 'sevenths', title: L('Seventh chords and harmonic application', 'Tétrades e aplicação harmônica'),
    desc: L('Explore four-note chords, their voicings, and their use in accompaniment and solos.', 'Explore acordes de quatro notas, suas formações e o uso em acompanhamento e solos.'),
    due: 0, history: false, topics: [
      ['tetrades', L('Building Seventh Chords', 'Formação de Tétrades')],
      ['tetrades-formacoes', L('Seventh-Chord Voicings on Strings 6, 5 and 4', 'Tétrades com Fundamental nas Cordas 6, 5 e 4')],
      ['arpejos-tetrades', L('Seventh-Chord Arpeggios', 'Arpejos de Tétrades')], ['tetrades-aplicacao', L('Seventh Chords in Progressions', 'Tétrades em Progressões')],
    ] },
];
const S = {
  en: {
    wordmark: 'musicgame', subtitle: 'Sight-reading practice for electric guitar', continue: 'Continue', upNext: 'Up next', practice: 'Practice', lesson: 'Lesson', learn: 'Learn',
    module: n => `Module ${n}`, notPlayed: 'Not played yet', bestLast: (b, l) => `Best ${b}%, last ${l}%`, topics: (d, t) => `${d} of ${t} topics`,
    review: n => `Review weak spots · ${n}`, caughtUp: 'Nothing to review today', showTopics: n => `Show ${n} topics`, hideTopics: 'Hide topics',
    stats: 'Stats', tuner: 'Tuner', settings: 'Settings', back: 'Back', rounds: 'Module 2 · 10 rounds', due: n => `${n} due for review`, review1: 'Review',
    course: 'Course', home: 'Home', today: 'Today', recent: 'Recent plays', allTopics: 'All topics',
  },
  pt: {
    wordmark: 'musicgame', subtitle: 'Treino de leitura para guitarra elétrica', continue: 'Continuar', upNext: 'Próximo passo', practice: 'Praticar', lesson: 'Lição', learn: 'Aprender',
    module: n => `Módulo ${n}`, notPlayed: 'Ainda não jogado', bestLast: (b, l) => `Melhor ${b}%, último ${l}%`, topics: (d, t) => `${d} de ${t} tópicos`,
    review: n => `Revisar pontos fracos · ${n}`, caughtUp: 'Nada para revisar hoje', showTopics: n => `Mostrar ${n} tópicos`, hideTopics: 'Ocultar tópicos',
    stats: 'Estatísticas', tuner: 'Afinador', settings: 'Configurações', back: 'Voltar', rounds: 'Módulo 2 · 10 rodadas', due: n => `${n} para revisar`, review1: 'Revisão',
    course: 'Curso', home: 'Início', today: 'Hoje', recent: 'Partidas recentes', allTopics: 'Todos os tópicos',
  },
};

// Quiz content (Natural Notes on the Neck, find D on string 6).
const TAP = {
  title: L('Natural Notes on the Neck', 'Notas Naturais no Braço'),
  prompt: L('Find D on string 6 (frets 0–12).', 'Encontre Ré na 6ª corda (casas 0 a 12).'),
  hint: L('Tap the position on the neck. Arrow keys move, Enter selects.', 'Toque na posição no braço. Setas movem, Enter seleciona.'),
  answer: L('Answer: String 6, fret 10', 'Resposta: Corda 6, casa 10'),
  explanation: L('D on string 6: fret 10. Count up from the open string: E (0) → F (1) → G (3) → A (5) → B (7) → C (8) → D (10). E–F and B–C are one fret apart; other neighboring natural notes are two frets apart.',
    'Ré na 6ª corda: casa 10. Conte a partir da corda solta: Mi (0) → Fá (1) → Sol (3) → Lá (5) → Si (7) → Dó (8) → Ré (10). Mi–Fá e Si–Dó ficam a uma casa; as outras notas naturais vizinhas ficam a duas casas.'),
  string: 5, wrong: 9, right: 10,
  route: [['E', 0], ['F', 1], ['G', 3], ['A', 5], ['B', 7], ['C', 8], ['D', 10]],
  written: 'd/4',
};
const tapRevealMarkers = () => [
  ...TAP.route.map(([l, f]) => ({ string: 5, fret: f, label: l, tone: f === TAP.right ? 'accent' : 'plain' })),
  { string: 5, fret: TAP.wrong, label: '✗', tone: 'wrong' },
];
const MC = {
  title: L('Note Names', 'Nome das Notas'),
  prompt: L('Name this note in treble clef.', 'Qual é o nome desta nota na clave de sol?'),
  note: 'b/4', choices: ['B', 'D', 'G', 'F'], correct: 'B',
  explanation: L('B is on line 3, counting from the bottom.', 'Si fica na linha 3, contando de baixo para cima.'),
};
const RESULTS = {
  title: 'Intervals', pct: 30, n: 3, total: 10, best: 70, last: 50,
  misses: [
    [2, 'Tap the perfect 5th above A (R) on string 4.', 'String 1, open', 'String 4, fret 2'],
    [3, 'What interval is it from the root (R) up to the marked note?', 'perfect 4th', 'tritone'],
    [4, 'Tap the major 3rd above E (R) on string 4.', 'String 1, open', 'String 4, fret 6'],
    [6, 'What interval is it from D up to A?', 'major 6th', 'perfect 5th'],
    [8, 'What interval is it from B up to A?', 'octave', 'minor 7th'],
    [9, 'What interval is it from the root (R) up to the marked note?', 'tritone', 'minor 6th'],
    [10, 'Tap the perfect 4th above F (R) on string 4.', 'String 1, open', 'String 4, fret 8'],
  ],
};
const LESSON = {
  title: 'Intervals', step: 3, total: 6,
  steps: ['The distance between two notes', 'Number and quality', 'Across the strings', 'Major and minor thirds', 'Degrees', 'On your guitar'],
  heading: 'Across the strings',
  copy: 'Moving to the next higher string adds 5 semitones (4 from string 3 to string 2). So from G at fret 3 of string 6: the perfect 4th is at the same fret on string 5; the perfect 5th is two frets up from there; and the octave is two strings over and two frets up.',
  markers: [{ string: 5, fret: 3, label: 'R', tone: 'root' }, { string: 4, fret: 3, label: '4', tone: 'accent' }, { string: 4, fret: 5, label: '5', tone: 'accent' }, { string: 3, fret: 5, label: '8', tone: 'accent' }],
  listen: ['Perfect 4th', 'Perfect 5th', 'Octave'],
};

/* -------------------------------------------------------------- shared css */
const SHARED_CSS = `
*{box-sizing:border-box}
html{background:#0b0d0c;color:#e8ebe7;font-family:'Segoe UI Variable Text','Segoe UI',system-ui,sans-serif;-webkit-text-size-adjust:100%}
body{margin:0;padding:28px 36px 90px;max-width:1880px}
a{color:${TOKENS.accent}}
.board-head{max-width:1200px;margin:0 0 24px}
.board-head h1{font-family:'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif;font-size:32px;margin:0 0 6px;letter-spacing:-.4px}
.board-head .kicker{color:#9aa39b;font-size:14px;margin:0 0 8px}
.board-head p{max-width:860px;line-height:1.55;color:#cfd4ce;margin:8px 0}
.board-head .nav{margin:12px 0 0;font-size:14px;color:#9aa39b}
.board-head .nav a{margin-right:16px}
.principles{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;padding:0;list-style:none}
.principles li{border:1px solid #2d332e;border-radius:999px;padding:6px 12px;font-size:13px;color:#cfd4ce}
h2.sec{font-family:'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif;font-size:22px;letter-spacing:-.2px;color:#f2f4f0;margin:48px 0 6px;padding-top:22px;border-top:1px solid #1f2420}
h2.sec small{display:block;font-size:14px;color:#9aa39b;font-weight:400;margin-top:4px;max-width:900px;line-height:1.5}
.row{display:flex;flex-wrap:wrap;gap:28px 32px;align-items:flex-start;margin-top:16px}
.frame{margin:0;display:flex;flex-direction:column;gap:8px}
.frame figcaption{font-size:13px;line-height:1.5;color:#9aa39b;max-width:var(--cw,480px)}
.frame figcaption b{color:#e8ebe7;font-weight:600}
.win{position:relative;overflow:hidden;border:1px solid #000;box-shadow:0 0 0 1px #2a2f2b,0 24px 60px rgba(0,0,0,.5);background:${TOKENS.bg}}
.win.rounded{border-radius:5px}
.win.phone{border-radius:28px;box-shadow:0 0 0 5px #1b1f1c,0 24px 60px rgba(0,0,0,.5)}
.screen{position:relative;transform-origin:top left;background:var(--bg);color:var(--fg);font-family:var(--font);font-size:var(--t0);line-height:1.45;overflow:hidden;container-type:inline-size;container-name:screen}
.screen.tall{overflow:visible}
.win.tall{height:auto!important}
.spec{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;max-width:1400px;margin-top:16px}
.spec .note{border:1px solid #242925;border-radius:12px;padding:16px;background:#121513;font-size:13px;line-height:1.6;color:#cfd4ce}
.spec h3{margin:0 0 8px;font-size:14px;color:#f2f4f0}
table.t{border-collapse:collapse;font-size:13px;margin-top:14px}
table.t th,table.t td{text-align:left;padding:7px 12px;border-bottom:1px solid #242925;vertical-align:top}
table.t th{color:#9aa39b;font-weight:500}
.sw{display:inline-block;width:16px;height:16px;border-radius:4px;vertical-align:-3px;margin-right:8px;border:1px solid rgba(255,255,255,.12)}
.ok{color:#7fe0b4}.warn{color:#f2b84b}.bad{color:#f08a7e}
.callout{font-size:13px;color:#7fe0b4;border:1px dashed #35594a;border-radius:8px;padding:8px 12px;max-width:560px;line-height:1.45;margin-top:10px}

/* ---- the proposed app tokens and components (the "real" CSS) ---- */
.screen{
  --bg:${TOKENS.bg};--bg-sunken:${TOKENS.sunken};--surface:${TOKENS.surface};--elevated:${TOKENS.elevated};
  --fg:${TOKENS.fg};--fg-2:${TOKENS.fg2};--muted:${TOKENS.muted};
  --accent:${TOKENS.accent};--accent-strong:${TOKENS.accentStrong};--accent-soft:rgba(127,224,180,.12);--on-accent:${TOKENS.onAccent};
  --danger:${TOKENS.danger};--danger-soft:rgba(240,138,126,.14);--amber:${TOKENS.amber};--amber-soft:rgba(242,184,75,.14);
  --line:${TOKENS.line};--line-strong:${TOKENS.lineStrong};--outline:${TOKENS.outline};--focus:${TOKENS.focus};
  --paper:${TOKENS.paper};--ink:${TOKENS.ink};--ink-2:${TOKENS.ink2};
  --font:'Segoe UI Variable Text','Segoe UI',system-ui,sans-serif;
  --font-display:'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif;
  --font-readout:'Bahnschrift','Segoe UI Variable Display','Segoe UI',system-ui,sans-serif;
  --t-1:13px;--t0:clamp(15px,14px + .2cqw,17px);--t1:clamp(16px,15px + .25cqw,18px);--t2:clamp(19px,17px + .5cqw,24px);
  --t3:clamp(22px,19px + .8cqw,30px);--t4:clamp(44px,32px + 2.6cqw,76px);--t-answer:clamp(18px,16px + .4cqw,22px);
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:24px;--s6:32px;--s7:48px;--gutter:clamp(16px,2cqw,40px);
  --r-card:16px;--r-ctl:12px;--tap:52px;--tap-sm:44px;--caption-w:138px;
}
.screen h1,.screen h2,.screen h3,.screen p{margin:0}
.screen h1,.screen h2,.screen h3{font-family:var(--font-display);letter-spacing:-.2px}
.readout{font-family:var(--font-readout);font-variant-numeric:tabular-nums;font-weight:600;letter-spacing:0}
.muted{color:var(--muted)}.fg2{color:var(--fg-2)}.small{font-size:var(--t-1)}
.ic{flex:none}
/* top bar */
.top{display:flex;align-items:center;gap:6px;min-height:56px;padding:8px 10px 6px;flex:none}
.desktop .top{padding-right:calc(var(--caption-w) + 10px)}
.top h1{flex:1;font-size:var(--t1);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.top .wordmark{flex:1;font-family:var(--font-display);font-size:22px;font-weight:800;letter-spacing:-.5px;padding-left:6px}
.ibtn{width:var(--tap-sm);height:var(--tap-sm);flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:12px;background:transparent;color:var(--fg)}
.ibtn.on{background:var(--elevated)}
.caption{position:absolute;top:0;right:0;z-index:100;display:flex}
.caption-btn{width:46px;height:32px;display:grid;place-items:center;color:var(--fg)}
.caption-btn svg{overflow:visible}
/* surfaces and controls */
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:var(--s4)}
.btn{min-height:var(--tap);padding:10px 18px;border-radius:var(--r-ctl);display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;font:inherit;font-size:var(--t0);font-weight:600;text-align:center;color:var(--fg);white-space:nowrap}
.btn.sm{min-height:var(--tap-sm);padding:6px 14px;font-size:15px;border-radius:10px}
.btn-primary{background:var(--accent-strong);color:var(--on-accent)}
.btn-secondary{background:var(--elevated);border-color:var(--outline)}
.btn-ghost{background:transparent;font-weight:500;color:var(--fg-2)}
.btn-ghost u{text-decoration-color:var(--outline);text-underline-offset:4px}
.btn-danger{background:transparent;color:var(--danger);border-color:#6a3f3a}
.btn-block{width:100%}
.btn:disabled,.btn.disabled{opacity:.45}
.focus{outline:2px solid var(--focus);outline-offset:3px}
.actions{display:flex;flex-wrap:wrap;gap:10px}
.actions .btn{flex:1}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font-size:var(--t-1);color:var(--muted);border:1px solid var(--line-strong);border-radius:999px;padding:4px 10px;white-space:nowrap}
.chip b{color:var(--fg);font-weight:600}
.chip-accent{color:var(--on-accent);background:var(--accent);border-color:var(--accent);font-weight:600}
.chip-amber{color:var(--amber);border-color:var(--amber)}
.bar{height:6px;border-radius:3px;background:var(--line-strong);overflow:hidden}
.bar span{display:block;height:100%;background:var(--accent);border-radius:3px}
.bar.thin{height:4px}
.kbd{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:6px;border:1px solid var(--outline);border-bottom-width:2px;font:600 12px var(--font-readout);color:var(--muted);background:var(--bg)}
.sep{display:inline-block;width:1px;height:12px;background:var(--line-strong);margin:0 8px;vertical-align:-1px}
.label{font-size:var(--t-1);color:var(--muted)}
.ring{display:inline-grid;place-items:center;position:relative}
.ring svg{position:absolute;inset:0}
.ring b{font-family:var(--font-readout);font-weight:600;font-size:13px}
/* answers */
.answers{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.answers.col{grid-template-columns:1fr}
.answer{min-height:60px;padding:8px 14px;border-radius:var(--r-ctl);display:flex;align-items:center;gap:10px;background:var(--elevated);border:1px solid var(--outline);color:var(--fg);font:inherit;font-size:var(--t-answer);font-weight:600;text-align:left}
.answer .lbl{flex:1}
.answer.center{justify-content:center;text-align:center}
.answer.center .lbl{flex:none}
.answer.ok{background:var(--accent-strong);border-color:var(--accent-strong);color:var(--on-accent)}
.answer.bad{background:var(--danger);border-color:var(--danger);color:var(--on-accent)}
.answer.ok .kbd,.answer.bad .kbd{color:var(--on-accent);border-color:rgba(12,23,17,.35);background:transparent}
.answer.dim{opacity:.55}
.answer.hover{border-color:var(--accent)}
/* quiz progress */
.progress{display:flex;align-items:center;gap:12px;padding:0 var(--gutter) 8px;flex:none}
.segs{display:flex;gap:4px;flex:1;max-width:420px}
.segs span{flex:1;height:6px;border-radius:3px;background:var(--line-strong)}
.segs .ok{background:var(--accent)}.segs .bad{background:var(--danger)}.segs .cur{box-shadow:inset 0 0 0 2px var(--accent)}
.round{font-weight:600;white-space:nowrap}
.pill{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:600;padding:4px 10px;border-radius:999px;background:var(--elevated);font-family:var(--font-readout)}
.pill-ok{color:var(--accent)}.pill-bad{color:var(--danger)}
.timer{position:relative;width:40px;height:40px;display:inline-grid;place-items:center;font:600 14px var(--font-readout)}
.timer svg{position:absolute;inset:0}
.verdict{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-ctl);font-size:var(--t1);font-weight:700}
.verdict-ok{background:var(--accent-soft);color:var(--accent)}
.verdict-bad{background:var(--danger-soft);color:var(--danger)}
.explain{line-height:1.55;color:var(--fg-2)}
.hear{min-height:var(--tap-sm);padding:8px 16px;border-radius:999px;border:1px solid var(--outline);background:var(--surface);color:var(--fg);font:inherit;font-size:15px;display:inline-flex;align-items:center;gap:8px}
.notation-pair{display:flex;flex-wrap:wrap;gap:16px}
.notation-pair figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px}
.notation-pair figcaption{color:var(--muted);font-size:var(--t-1)}
.notation-pair svg{display:block}
.fretboard{display:block;width:100%;height:auto;font-family:var(--font)}
.fretboard-split{width:100%;display:flex;flex-direction:column;align-items:center;gap:2px}
.fretboard-range{align-self:flex-start;font-size:var(--t-1);color:var(--muted)}
.staff,.tab{display:block;font-family:var(--font)}
.paper-panel{background:var(--paper);border-radius:12px;display:inline-block;line-height:0}
/* settings */
.setting{display:flex;flex-direction:column;gap:8px}
.setting-label{font-size:var(--t-1);color:var(--muted)}
.setting-hint{font-size:var(--t-1);color:var(--muted);line-height:1.5}
.setting-name{font-size:var(--t0);font-weight:600}
.segmented{display:flex;border:1px solid var(--outline);border-radius:var(--r-ctl);overflow:hidden;background:var(--bg-sunken)}
.segmented span{flex:1;min-height:46px;display:grid;place-items:center;padding:6px 8px;border-right:1px solid var(--line-strong);font-size:15px}
.segmented span:last-child{border-right:0}
.segmented .on{background:var(--accent-strong);color:var(--on-accent);font-weight:700}
.setting-row{flex-direction:row;align-items:center;justify-content:space-between;gap:12px}
.switch{position:relative;flex:none;width:52px;height:30px;border-radius:15px;background:var(--outline)}
.switch i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:var(--fg)}
.switch.on{background:var(--accent-strong)}.switch.on i{left:25px;background:var(--on-accent)}
.slider{display:flex;align-items:center;gap:12px}
.slider .track{flex:1;height:4px;border-radius:2px;background:var(--outline);position:relative}
.slider .track i{position:absolute;left:0;top:0;height:100%;width:27%;background:var(--accent-strong);border-radius:2px}
.slider .track b{position:absolute;left:27%;top:50%;width:18px;height:18px;border-radius:50%;background:var(--accent-strong);transform:translate(-50%,-50%)}
.setting-group{display:flex;flex-direction:column;gap:10px;padding-top:18px;border-top:1px solid var(--line)}
.sheet-head{display:flex;align-items:center;justify-content:space-between}
.sheet-head h2{font-size:var(--t2)}
/* stats */
.tiles{display:grid;gap:10px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.tile b{display:block;font:600 28px var(--font-readout);line-height:1.1}
.tile span{font-size:var(--t-1);color:var(--muted)}
.srow{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line)}
.srow .n{flex:1;min-width:0;font-weight:600}
.num{font-family:var(--font-readout);font-weight:600;font-variant-numeric:tabular-nums;min-width:44px;text-align:right}
.num small{display:block;font:400 11px var(--font);color:var(--muted);text-align:right}
.num.low{color:var(--amber)}
.num.dash{color:var(--line-strong)}
/* tuner */
.meter{position:relative;width:100%;height:22px;border-radius:11px;background:var(--line-strong)}
.meter .zone{position:absolute;left:45%;width:10%;top:0;bottom:0;border-radius:4px;background:rgba(127,224,180,.35)}
.meter .tick{position:absolute;top:0;bottom:0;width:1px;background:var(--outline)}
.meter .needle{position:absolute;top:-6px;width:4px;height:34px;border-radius:2px;transform:translateX(-50%);background:var(--amber)}
.stringbtn{min-width:52px;min-height:60px;padding:6px 10px;border-radius:10px;border:1px solid var(--outline);background:var(--surface);color:var(--fg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.stringbtn span{color:var(--muted);font-size:11px}.stringbtn strong{font:600 20px var(--font-readout)}
.stringbtn.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
/* bottom sheet (phones) */
.sheet-m{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line-strong);border-radius:20px 20px 0 0;padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 -12px 32px rgba(0,0,0,.45)}
.stickybar{position:absolute;left:0;right:0;bottom:0;padding:14px 16px 16px;background:linear-gradient(180deg,rgba(21,24,22,0),var(--bg) 35%)}
.scrollhint{position:absolute;left:0;right:0;bottom:0;height:40px;background:linear-gradient(180deg,rgba(21,24,22,0),var(--bg))}
`;

/* ----------------------------------------------------------------- frames */
const VIEWS = {
  1920: { w: 1920, h: 1032, scale: .5, kind: 'desktop', maximized: true, name: '1920 × 1032 · maximized desktop window' },
  1366: { w: 1366, h: 768, scale: .5, kind: 'desktop', maximized: false, name: '1366 × 768' },
  1100: { w: 1100, h: 720, scale: .5, kind: 'desktop', maximized: false, name: '1100 × 720 · desktop default window' },
  390: { w: 390, h: 844, scale: 1, kind: 'phone', name: '390 × 844 · phone' },
};
function frame(vw, body, cap, { tall = false, dir = '', lang = 'en', extraCls = '' } = {}) {
  const v = VIEWS[vw];
  const cw = Math.round(v.w * v.scale), ch = Math.round(v.h * v.scale);
  const winCls = v.kind === 'phone' ? 'phone' : v.maximized ? '' : 'rounded';
  const screenCls = `screen ${v.kind} vw${vw} ${dir} ${extraCls}${tall ? ' tall' : ''}`;
  const style = `width:${v.w}px;${tall ? `min-height:${v.h}px` : `height:${v.h}px`};transform:scale(${v.scale})`;
  const inner = `<div class="${screenCls}" lang="${lang}" style="${style}">${v.kind === 'desktop' ? caption(v.maximized) : ''}${body}</div>`;
  // A tall frame grows with its content; the wrapper gets its height from a scaled inner box.
  const wrap = tall
    ? `<div class="win ${winCls} tall" style="width:${cw}px"><div style="transform:scale(${v.scale});transform-origin:top left;width:${v.w}px">${inner.replace(`transform:scale(${v.scale})`, '')}</div></div>`
    : `<div class="win ${winCls}" style="width:${cw}px;height:${ch}px">${inner}</div>`;
  return `<figure class="frame" style="--cw:${cw}px">${wrap}<figcaption><b>${v.name}</b>${cap ? ' — ' + cap : ''}</figcaption></figure>`;
}
// A tall frame needs its wrapper height set after layout; we approximate with JS at load.
const TALL_FIX = `<script>
for (const w of document.querySelectorAll('.win.tall')) {
  const inner = w.firstElementChild; const screen = inner.firstElementChild;
  const s = parseFloat(inner.style.transform.replace(/[^0-9.]/g, '')) || 1;
  w.style.height = Math.ceil(screen.getBoundingClientRect().height) + 'px';
}
</script>`;

/* --------------------------------------------------------- shared pieces */
const pct = (a, b) => Math.round((a / b) * 100);
const played = m => m.topics.filter(t => t[2]).length;
const ring = (frac, size = 40, stroke = 4, text = '') => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<span class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line-strong)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><b>${text}</b></span>`;
};
const timerRing = (frac = .62, seconds = 5) => {
  const c = 2 * Math.PI * 16;
  return `<span class="timer" role="timer"><svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--line-strong)" stroke-width="3"/><circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 20 20)"/></svg>${seconds}</span>`;
};
const segs = (history, cur) => `<div class="segs" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<span class="${i < history.length ? (history[i] ? 'ok' : 'bad') : i === cur ? 'cur' : ''}"></span>`).join('')}</div>`;
const progressRow = ({ history = [], round = 1, timed = false, pad = '', extra = '' }) => `<div class="progress" style="${pad}">${segs(history, round - 1)}<span class="round">Round ${round} of 10</span><span class="pill pill-ok">${icon('check', 16)}${history.filter(Boolean).length}</span><span class="pill pill-bad">${icon('cross', 16)}${history.filter(h => !h).length}</span>${timed ? timerRing() : ''}${extra}</div>`;
const scoreText = (t, s) => (t[2] ? s.bestLast(t[2].best, t[2].last) : s.notPlayed);

const verdictOk = (lang = 'en') => `<div class="verdict verdict-ok">${icon('check', 22)}${lang === 'pt' ? 'Correto!' : 'Correct!'}</div>`;
const verdictBad = (lang = 'en') => `<div class="verdict verdict-bad">${icon('cross', 22)}${lang === 'pt' ? 'Vamos revisar' : 'Let’s review'}</div>`;
const listenBtn = (label = 'Listen') => `<span class="hear">${icon('play', 16)}${label}</span>`;
const kbd = k => `<span class="kbd">${k}</span>`;

function settingsBody({ desktop = true, lang = 'en', cols = 1 } = {}) {
  const seg = (label, opts, on, hint) => `<div class="setting"><div class="setting-label">${label}</div><div class="segmented">${opts.map(o => `<span class="${o === on ? 'on' : ''}">${o}</span>`).join('')}</div>${hint ? `<p class="setting-hint">${hint}</p>` : ''}</div>`;
  const g1 = `${seg('Language', ['English', 'Português'], 'English')}
${seg('Notation', ['Letters', 'Solfege', 'Both'], 'Letters', 'Example: C · D · E')}
${seg('After answer', ['Automatic', 'Continue button'], 'Automatic')}
<div class="setting"><div class="setting-label">Wait</div><div class="slider"><div class="track"><i></i><b></b></div><span class="readout" style="min-width:40px;text-align:right">0.9 s</span></div></div>
${seg('Difficulty', ['No timer', '15 s', '8 s', '4 s'], 'No timer', 'Time per round: easy 15 s, medium 8 s, hard 4 s.')}
<div class="setting setting-row"><div><div class="setting-label">Sounds</div><p class="setting-hint">Correct, wrong and finished quiz.</p></div><span class="switch on"><i></i></span></div>`;
  const g2 = `${desktop ? `<div class="setting-group"><div class="setting setting-row"><div><div class="setting-label">This computer</div><div class="setting-name">Start with Windows</div><p class="setting-hint">Opens quietly in the tray, not as a window.</p></div><span class="switch"><i></i></span></div><p class="setting-hint">Closing the window keeps musicgame in the tray. To quit, use the tray menu.</p></div>` : ''}
<div class="setting-group"><div class="setting-label">Progress</div><div class="actions"><span class="btn btn-secondary sm">${icon('download', 18)}Export progress…</span><span class="btn btn-secondary sm">${icon('upload', 18)}Import progress…</span></div><p class="setting-hint">Scores and answer history, as one .json file. Use it to move progress between this app and the browser version.</p><p class="setting-hint">Last export: 14 Oct 2026, 21:12</p></div>
<p class="setting-hint">Settings are saved on this device.</p>`;
  if (cols === 2) return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 40px;align-items:start"><div style="display:flex;flex-direction:column;gap:18px">${g1}</div><div style="display:flex;flex-direction:column;gap:18px">${g2}</div></div>`;
  return `<div style="display:flex;flex-direction:column;gap:18px">${g1}${g2}</div>`;
}

function statsRows(m, { compact = false } = {}) {
  return m.topics.map(t => {
    const r = t[2];
    const cell = (v, low, suffix = '%') => r ? `<span class="num ${low ? 'low' : ''}">${v}${suffix}${low ? '<small>low</small>' : ''}</span>` : `<span class="num dash">—</span>`;
    return `<div class="srow"><span class="n">${t[1].en}</span>${r ? `<span class="num">${r.plays}<small>plays</small></span>` : '<span class="num dash">—</span>'}${cell(r?.avg, r && r.avg < 60)}${cell(r?.best, false)}${cell(r?.last, r && r.last < 60)}${r ? `<span class="ibtn" style="width:36px;height:36px">${icon('trash', 18)}</span>` : (compact ? '' : '<span style="width:36px"></span>')}</div>`;
  }).join('');
}
const statsHead = () => `<div class="srow" style="border-top:0;padding-top:0"><span class="n label" style="font-weight:500">Topic</span><span class="num label" style="font-weight:500;font-family:var(--font)">Plays</span><span class="num label" style="font-weight:500;font-family:var(--font)">Avg</span><span class="num label" style="font-weight:500;font-family:var(--font)">Best</span><span class="num label" style="font-weight:500;font-family:var(--font)">Last</span><span style="width:36px"></span></div>`;
const tiles = (cols = 4) => `<div class="tiles" style="grid-template-columns:repeat(${cols},1fr)"><div class="tile"><b>7</b><span>plays</span></div><div class="tile"><b>64%</b><span>overall average</span></div><div class="tile"><b>3/25</b><span>topics played</span></div><div class="tile"><b>11</b><span>due for review</span></div></div>`;

function tunerReadout({ big = true } = {}) {
  return `<div class="card" style="display:flex;flex-direction:column;align-items:center;gap:${big ? 16 : 10}px;text-align:center;padding:${big ? '32px 28px' : '20px'}">
<div class="label">String 5</div>
<div class="readout" style="font-size:${big ? 'var(--t4)' : '44px'};line-height:1">A</div>
<div style="font-weight:600;color:var(--amber)">↑ Too low: tighten the string</div>
<div class="meter" role="meter" aria-valuemin="-50" aria-valuemax="50" aria-valuenow="-12"><span class="tick" style="left:25%"></span><span class="tick" style="left:50%"></span><span class="tick" style="left:75%"></span><span class="zone"></span><span class="needle" style="left:38%"></span></div>
<div class="small muted" style="display:flex;gap:16px;justify-content:space-between;width:100%"><span>−50</span><span class="readout" style="color:var(--fg)">−12 cents</span><span>+50</span></div>
<div class="small muted">Hearing A2 · 109.2 Hz</div></div>`;
}
const stringButtons = (vertical = false) => `<div style="display:flex;${vertical ? 'flex-direction:column;' : 'flex-wrap:wrap;justify-content:center;'}gap:8px">${[[6, 'E'], [5, 'A'], [4, 'D'], [3, 'G'], [2, 'B'], [1, 'E']].map(([n, l]) => `<span class="stringbtn ${n === 5 ? 'on' : ''}" style="${vertical ? 'flex-direction:row;justify-content:flex-start;gap:14px;padding:0 16px;min-height:56px' : ''}"><span>${n}</span><strong>${l}</strong>${vertical ? `<span style="margin-left:auto;color:var(--muted)">${icon('play', 16)}</span>` : ''}</span>`).join('')}</div>`;

const missedList = () => `<ul style="list-style:none;margin:10px 0 0;padding:0">${RESULTS.misses.map(([r, q, was, is]) => `<li style="display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:var(--t-1);line-height:1.5"><span class="muted readout" style="white-space:nowrap;font-weight:500;min-width:62px">Round ${r}</span><span><b style="font-weight:600;color:var(--fg)">${q}</b><br><span style="color:var(--danger)">${icon('cross', 12)} ${was}</span> <span class="muted">→</span> <span style="color:var(--accent)">${icon('check', 12)} ${is}</span></span></li>`).join('')}</ul>`;
const resultsHero = () => `<div><div class="label">Game complete</div><div style="display:flex;align-items:baseline;gap:14px;margin:4px 0 10px"><span class="readout" style="font-size:var(--t4);line-height:1">30%</span><span class="muted">3 of 10 correct</span></div><div class="chips"><span class="chip">Best <b>70%</b></span><span class="chip">Last time <b>50%</b></span></div></div>`;

/* =========================================================== DIRECTION A */
const A_CSS = `
.A .page{display:flex;flex-direction:column;height:100%;min-height:100%}
.A .main{flex:1;min-height:0;display:flex;flex-direction:column;gap:var(--s4);padding:4px var(--gutter) var(--s5)}
.A .hero{display:flex;align-items:center;gap:var(--s5);padding:18px 22px;background:linear-gradient(90deg,#1f3a2f 0%,var(--surface) 60%);border:1px solid #2f5c4c;border-radius:var(--r-card)}
.A .hero .t{flex:1;min-width:0}
.A .hero h2{font-size:var(--t3)}
.A .hero .btn{flex:none}
.A .cols{display:grid;gap:var(--s4);align-items:start}
.A .mod{display:flex;flex-direction:column;gap:10px}
.A .mod .mh{display:flex;align-items:flex-start;gap:12px}
.A .mod h3{font-size:var(--t1);flex:1;min-width:0}
.A .topic{display:flex;align-items:center;gap:8px;padding:10px 0;border-top:1px solid var(--line);min-height:56px}
.A .topic .tn{flex:1;min-width:0}
.A .topic .tn b{display:block;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.A .topic .tn span{display:block;font-size:var(--t-1);color:var(--muted);margin-top:2px}
.A .topic .btn.sm{min-height:40px;padding:4px 12px}
.A .stage{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,32%);gap:var(--s5);padding:0 var(--gutter) var(--s4)}
.A .stage .vis{display:flex;align-items:center;justify-content:center;min-width:0;padding:var(--s2) 0}
.A .stage .col{display:flex;flex-direction:column;gap:var(--s4);min-height:0}
.A .stage .col .grow{flex:1}
.A .prompt{font-family:var(--font-display);font-size:var(--t2);font-weight:600;line-height:1.3}
.A .lesson{flex:1;min-height:0;display:grid;grid-template-columns:minmax(320px,36%) minmax(0,1fr);gap:var(--s6);padding:4px var(--gutter) var(--s4)}
.A .steps{display:flex;flex-direction:column;gap:2px;margin:0 0 var(--s4);padding:0;list-style:none}
.A .steps li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;font-size:var(--t-1);color:var(--muted)}
.A .steps li i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--outline);font:600 11px var(--font-readout);font-style:normal;flex:none}
.A .steps li.done i{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.A .steps li.cur{background:var(--elevated);color:var(--fg);font-weight:600}
.A .steps li.cur i{border-color:var(--accent);color:var(--accent)}
.A .copy{font-size:var(--t0);line-height:1.65;color:var(--fg-2);max-width:62ch}
.A .vispanel{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:var(--s5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--s4)}
.A .dialog{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
.A .sheet{width:100%;max-width:600px;max-height:calc(100% - 64px);overflow:hidden;position:relative;background:var(--surface);border:1px solid var(--line-strong);border-radius:16px;padding:8px 20px 20px;display:flex;flex-direction:column;gap:14px}
.A .sheet.clip::after{content:'';position:absolute;left:0;right:0;bottom:0;height:48px;background:linear-gradient(180deg,rgba(29,33,30,0),var(--surface))}
`;

function aShell(vw, { bar, body, lang = 'en', extra = '' }) {
  return `<div class="page">${bar}${body}${extra}</div>`;
}
const topHome = (s, { pt = false } = {}) => `<header class="top"><span class="wordmark">${s.wordmark}</span><span class="ibtn">${icon('stats')}</span><span class="ibtn">${icon('tuner')}</span><span class="ibtn">${icon('settings')}</span></header>`;
const topQuiz = (title, { timed = false } = {}) => `<header class="top"><span class="ibtn">${icon('back')}</span><h1>${title}</h1><span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span></header>`;
const topBack = (title, right = '') => `<header class="top"><span class="ibtn">${icon('back')}</span><h1>${title}</h1>${right}</header>`;

function aHome(vw, lang = 'en') {
  const s = S[lang];
  const cols = vw >= 1600 ? 4 : vw >= 1000 ? 2 : 1;
  const hero = vw >= 1000
    ? `<section class="hero"><div class="t"><div class="label">${s.continue}</div><h2>${lang === 'pt' ? 'Intervalos' : 'Intervals'}</h2><p class="small muted" style="margin-top:4px">${s.rounds}<span class="sep"></span>${s.bestLast(70, 30)}</p></div><span class="btn btn-primary">${icon('play', 18)}${s.practice}</span><span class="btn btn-secondary">${icon('book', 18)}${s.lesson}</span></section>`
    : `<section class="card" style="background:linear-gradient(180deg,#1f3a2f 0%,var(--surface) 100%);border-color:#2f5c4c"><div class="label">${s.continue}</div><h2 style="font-size:var(--t2);margin:2px 0 4px">${lang === 'pt' ? 'Intervalos' : 'Intervals'}</h2><p class="small muted">${s.rounds}<span class="sep"></span>${s.bestLast(70, 30)}</p><div class="actions" style="margin-top:14px"><span class="btn btn-primary">${icon('play', 18)}${s.practice}</span><span class="btn btn-secondary" style="flex:0 0 auto">${icon('book', 18)}${s.lesson}</span></div></section>`;
  const mod = (m, open = true) => `<section class="card mod"><div class="mh"><div style="flex:1;min-width:0"><div class="label">${s.module(m.n)}</div><h3>${m.title[lang]}</h3></div>${ring(played(m) / m.topics.length, 44, 4, `${played(m)}/${m.topics.length}`)}</div>
<div class="bar thin"><span style="width:${pct(played(m), m.topics.length)}%"></span></div>
${m.history ? (m.due ? `<span class="btn btn-secondary sm" style="align-self:flex-start">${icon('retry', 16)}${s.review(m.due)}</span>` : `<span class="small muted">${s.caughtUp}</span>`) : `<span class="small muted">${m.desc[lang]}</span>`}
${open ? `<div>${m.topics.map(t => `<div class="topic"><div class="tn"><b>${t[1][lang]}</b><span>${scoreText(t, s)}</span></div>${vw >= 1000 ? `<span class="btn btn-ghost sm">${icon('book', 18)}<u>${s.learn}</u></span>` : `<span class="ibtn" title="${s.learn}">${icon('book', 18)}</span>`}<span class="btn btn-primary sm">${s.practice}</span></div>`).join('')}</div>`
    : `<span class="btn btn-secondary sm" style="align-self:flex-start">${s.showTopics(m.topics.length)}${icon('chevronDown', 16)}</span>`}
</section>`;
  const body = `<main class="main">${hero}<div class="cols" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${MODULES.map((m, i) => mod(m, cols > 1 || i < 2)).join('')}</div></main>`;
  return aShell(vw, { bar: topHome(s), body });
}

function aLesson(vw) {
  const two = vw >= 1000;
  const stepList = `<ol class="steps">${LESSON.steps.map((t, i) => `<li class="${i + 1 < LESSON.step ? 'done' : i + 1 === LESSON.step ? 'cur' : ''}"><i>${i + 1 < LESSON.step ? '✓' : i + 1}</i>${t}</li>`).join('')}</ol>`;
  const nav = `<div class="actions" style="margin-top:auto;padding-top:var(--s4)"><span class="btn btn-secondary" style="flex:0 0 auto">${icon('chevronLeft')}Previous</span><span class="btn btn-primary">Next${icon('chevronRight')}</span></div>`;
  const listen = `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${LESSON.listen.map(l => listenBtn(l)).join('')}</div>`;
  const board = fretboard({ frets: 7, markers: LESSON.markers, showFretNumbers: true, style: vw >= 1600 ? 'max-width:980px' : '' });
  if (two) {
    return aShell(vw, {
      bar: topBack(LESSON.title, `<span class="chip">${LESSON.step} / ${LESSON.total}</span>`),
      body: `<div class="lesson"><div style="display:flex;flex-direction:column;min-height:0">${stepList}<h2 style="font-size:var(--t3);margin-bottom:12px">${LESSON.heading}</h2><p class="copy">${LESSON.copy}</p>${nav}</div><div class="vispanel">${board}${listen}</div></div>`,
    });
  }
  return aShell(vw, {
    bar: topBack(LESSON.title, `<span class="chip">${LESSON.step} / ${LESSON.total}</span>`),
    body: `<div style="display:flex;gap:4px;padding:0 16px 8px">${LESSON.steps.map((_, i) => `<span style="flex:1;height:5px;border-radius:3px;background:${i + 1 < LESSON.step ? 'var(--accent)' : 'var(--line-strong)'};${i + 1 === LESSON.step ? 'box-shadow:inset 0 0 0 2px var(--accent)' : ''}"></span>`).join('')}</div>
<main class="main" style="text-align:center;gap:12px"><div class="label">Step 3 of 6</div><h2 style="font-size:var(--t3)">${LESSON.heading}</h2><p class="copy" style="margin:0 auto">${LESSON.copy}</p>${board}${listen}</main>
<div class="stickybar"><div class="actions"><span class="btn btn-secondary">${icon('chevronLeft')}Previous</span><span class="btn btn-primary">Next${icon('chevronRight')}</span></div></div>`,
  });
}

function aQuizTap(vw, { answered = false, lang = 'en' } = {}) {
  const markers = answered ? tapRevealMarkers() : [];
  const two = vw >= 1000;
  const boardOpts = { showFretNumbers: true, highlightStrings: [TAP.string], interactive: true, markers };
  const col = answered
    ? `<div class="prompt">${TAP.prompt[lang]}</div>${verdictBad(lang)}<p style="font-weight:600">${TAP.answer[lang]}</p><p class="explain">${TAP.explanation[lang]}</p><div>${listenBtn(lang === 'pt' ? 'Ouvir' : 'Listen')}</div>${notationPair({ string: 5, fret: 10, written: TAP.written }, { width: vw >= 1600 ? 220 : vw >= 1200 ? 180 : 156 })}<div class="grow"></div><span class="btn btn-primary btn-block">${lang === 'pt' ? 'Continuar' : 'Continue'}<span style="margin-left:auto;opacity:.7;font-size:13px;font-weight:500">Enter ↵</span></span>`
    : `<div class="prompt">${TAP.prompt[lang]}</div><p class="muted">${TAP.hint[lang]}</p><div class="grow"></div><p class="small muted">${lang === 'pt' ? 'Toque no braço para responder; a 6ª corda está destacada.' : 'The target string is highlighted; the answer is taken as soon as you tap.'}</p>`;
  if (two) {
    return aShell(vw, {
      bar: topQuiz(TAP.title[lang]),
      body: `${progressRow({ history: [], round: 1, pad: 'padding-left:var(--gutter)' })}<div class="stage"><div class="vis">${fretboard({ ...boardOpts, focusCell: answered ? null : { string: 5, fret: 5 }, style: vw >= 1600 ? 'max-width:1160px' : '' })}</div><div class="col">${col}</div></div>`,
    });
  }
  // phone: split board, feedback in flow with sticky Continue
  const phoneBody = answered
    ? `<main class="main" style="gap:12px;overflow:hidden"><div class="prompt" style="text-align:center;font-size:var(--t1)">${TAP.prompt[lang]}</div>${fretboard({ ...boardOpts, interactive: true, split: true, width: 360, first: 7, last: 12, cls: 'phone-reveal' })}${verdictBad(lang)}<p style="font-weight:600">${TAP.answer[lang]}</p><p class="explain small">${TAP.explanation[lang]}</p><div style="text-align:center">${listenBtn()}</div>${notationPair({ string: 5, fret: 10, written: TAP.written }, { width: 156 })}</main><div class="stickybar"><span class="btn btn-primary btn-block">Continue</span></div>`
    : `<main class="main" style="gap:12px"><div class="prompt" style="text-align:center;font-size:var(--t1)">${TAP.prompt[lang]}</div>${splitBoard({ showFretNumbers: true, highlightStrings: [TAP.string] })}</main>`;
  return aShell(vw, { bar: topQuiz(TAP.title[lang]), body: `${progressRow({ history: [true], round: 2 })}${phoneBody}` });
}

function aQuizMc(vw, { answered = false } = {}) {
  const two = vw >= 1000;
  const answers = (col) => `<div class="answers ${col ? 'col' : ''}">${MC.choices.map((c, i) => `<span class="answer ${answered ? (c === MC.correct ? 'ok' : 'dim') : i === 1 ? 'hover' : ''}"><span class="lbl">${c}</span>${two ? kbd(i + 1) : ''}</span>`).join('')}</div>`;
  const staffBig = staff({ note: MC.note, width: 420, height: 280, gap: 18, style: `width:${vw >= 1600 ? 720 : 520}px;height:auto;max-width:100%` });
  if (two) {
    const col = `<div class="prompt">${MC.prompt.en}</div>${answers(true)}${answered ? `${verdictOk()}<p class="explain">${MC.explanation.en}</p><div class="grow"></div><span class="btn btn-primary btn-block auto">Continue<span style="margin-left:auto;opacity:.7;font-size:13px;font-weight:500">auto · 0.9 s</span></span>` : `<div class="grow"></div><p class="small muted">Press 1–4 to answer. Space plays the note again when Listen is available.</p>`}`;
    return aShell(vw, { bar: topQuiz(MC.title.en), body: `${progressRow({ history: [true, true, false, true], round: 5, timed: true, pad: 'padding-left:var(--gutter)' })}<div class="stage"><div class="vis">${staffBig}</div><div class="col">${col}</div></div>` });
  }
  return aShell(vw, { bar: topQuiz(MC.title.en), body: `${progressRow({ history: [true, true, false, true], round: 5, timed: true })}<main class="main" style="gap:14px;text-align:center"><div class="prompt" style="font-size:var(--t1)">${MC.prompt.en}</div>${staff({ note: MC.note, width: 280, height: 180, gap: 12, style: 'width:100%;height:auto' })}${answers(false)}</main>` });
}

function aResults(vw) {
  const two = vw >= 1000;
  const left = `<section class="card">${resultsHero()}<div class="actions" style="margin-top:18px"><span class="btn btn-primary">${icon('retry')}Play again</span><span class="btn btn-secondary">${icon('book')}Lesson</span><span class="btn btn-ghost" style="flex:0 0 auto"><u>Back to course</u></span></div></section>`;
  const right = `<section class="card"><h3 style="font-size:var(--t1)">To review (7)</h3>${missedList()}<span class="btn btn-secondary btn-block" style="margin-top:12px">${icon('retry')}Review these 7</span></section>`;
  const body = two
    ? `<main class="main" style="display:grid;grid-template-columns:minmax(300px,36%) minmax(0,1fr);gap:var(--s5);align-items:start;max-width:1400px">${left}${right}</main>`
    : `<main class="main">${left}${right}</main>`;
  return aShell(vw, { bar: topQuiz(RESULTS.title), body });
}

function aStats(vw) {
  const cols = vw >= 1600 ? 4 : vw >= 1000 ? 2 : 1;
  const mods = MODULES.map(m => `<section class="card"><div class="label">Module ${m.n}</div><h3 style="font-size:var(--t1);margin-bottom:${m.due ? 2 : 8}px">${m.title.en}</h3>${m.due ? `<p class="small" style="color:var(--amber);margin-bottom:8px">${m.due} due for review</p>` : ''}${statsHead()}${statsRows(m)}</section>`).join('');
  return aShell(vw, { bar: topBack('Stats'), body: `<main class="main">${tiles(cols === 1 ? 2 : 4)}<div class="cols" style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:var(--s4);align-items:start">${mods}</div><div><span class="btn btn-danger">Reset all progress</span><p class="small muted" style="margin-top:10px">Clears plays, scores and the answer history used for reviews. Settings are not affected.</p></div></main>` });
}

function aTuner(vw) {
  const two = vw >= 1000;
  const notes = `<p class="small muted">An unplugged electric guitar is quiet: use an amp or an audio interface, or play close to the microphone.</p><p class="small muted">Sound is analyzed on this device and is never recorded or sent.</p>`;
  if (two) {
    return aShell(vw, { bar: topBack('Tuner'), body: `<main class="main" style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:var(--s5);align-items:start;max-width:1200px"><div style="display:flex;flex-direction:column;gap:14px"><p class="muted">Standard tuning (E A D G B E, A = 440 Hz). Play one open string at a time.</p>${tunerReadout()}<span class="btn btn-secondary" style="align-self:flex-start">${icon('mic', 18)}Turn off microphone</span>${notes}</div><div class="card" style="display:flex;flex-direction:column;gap:12px"><h3 style="font-size:var(--t1)">Hear the open strings</h3>${stringButtons(true)}</div></main>` });
  }
  return aShell(vw, { bar: topBack('Tuner'), body: `<main class="main" style="text-align:center;gap:14px"><p class="small muted">Standard tuning (E A D G B E, A = 440 Hz). Play one open string at a time.</p>${tunerReadout({ big: false })}<span class="btn btn-secondary" style="align-self:center">${icon('mic', 18)}Turn off microphone</span><h3 style="font-size:var(--t-1);color:var(--muted);font-weight:500;margin-top:6px">Hear the open strings</h3>${stringButtons()}${notes}</main>` });
}

function aSettings(vw) {
  const under = aHome(vw);
  if (vw >= 640) {
    return under.replace('</div>$', '') + `<div class="dialog"><div class="sheet ${vw < 1200 ? 'clip' : ''}" style="max-width:${vw >= 1000 ? 620 : 560}px"><div class="sheet-head"><h2>Settings</h2><span class="ibtn">${icon('close')}</span></div>${settingsBody({ desktop: true })}</div></div>`;
  }
  return under + `<div class="dialog" style="align-items:flex-end"><div class="sheet" style="border-radius:20px 20px 0 0;max-height:88%;overflow:hidden;padding-top:8px"><div style="width:36px;height:4px;border-radius:2px;background:var(--outline);margin:0 auto 6px"></div><div class="sheet-head"><h2>Settings</h2><span class="ibtn">${icon('close')}</span></div>${settingsBody({ desktop: false })}</div></div>`;
}

const asA = html => `<div class="A" style="display:contents">${html}</div>`;

/* =========================================================== DIRECTION B */
const B_CSS = `
.B .app{display:grid;grid-template-columns:248px minmax(0,1fr);height:100%}
.B .app.slim{grid-template-columns:64px minmax(0,1fr)}
.B .rail{background:var(--bg-sunken);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:12px 10px;gap:4px;min-height:0}
.B .rail .wordmark{font-family:var(--font-display);font-size:22px;font-weight:800;letter-spacing:-.5px;padding:6px 10px 14px}
.B .rail .item{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;color:var(--fg-2);min-height:44px}
.B .rail .item.on{background:var(--elevated);color:var(--fg)}
.B .rail .item .t{flex:1;min-width:0}
.B .rail .item .t b{display:block;font-weight:600;font-size:var(--t-1);line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.B .rail .item .t span{display:block;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.B .rail .item .badge{font:600 12px var(--font-readout);color:var(--amber);border:1px solid var(--amber);border-radius:999px;padding:1px 7px}
.B .rail .group{font-size:12px;color:var(--muted);padding:14px 10px 4px}
.B .rail .foot{margin-top:auto}
.B .rail .cont{margin:4px 0 10px;padding:12px;border-radius:12px;background:linear-gradient(180deg,#1f3a2f,var(--surface));border:1px solid #2f5c4c}
.B .rail .cont h3{font-size:var(--t0);margin:2px 0 8px}
.B .slim .rail{padding:12px 10px;align-items:center}
.B .slim .rail .item{width:44px;height:44px;justify-content:center;padding:0}
.B .view{display:flex;flex-direction:column;min-width:0;min-height:0;height:100%}
.B .content{flex:1;min-height:0;padding:4px var(--gutter) var(--s5);display:flex;flex-direction:column;gap:var(--s4)}
.B .modhead h1{font-size:var(--t3)}
.B .trow{display:grid;grid-template-columns:minmax(0,1fr) 180px auto auto;gap:14px;align-items:center;padding:10px 0;border-top:1px solid var(--line);min-height:60px}
.B .trow .tn b{display:block;font-weight:600}
.B .trow .tn span{font-size:var(--t-1);color:var(--muted)}
.B .trow.narrow{grid-template-columns:minmax(0,1fr) auto auto;gap:8px}
.B .trow.next{background:var(--accent-soft);margin:0 -12px;padding:10px 12px;border-radius:10px;border-top-color:transparent}
.B .quizmain{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:var(--s4);padding:4px var(--gutter) var(--s4);text-align:center}
.B .prompt{font-family:var(--font-display);font-size:var(--t2);font-weight:600;line-height:1.3;max-width:34ch}
.B .drawer{width:420px;flex:none;background:var(--surface);border-left:1px solid var(--line-strong);display:flex;flex-direction:column;gap:14px;padding:16px 20px 20px;min-height:0;text-align:left}
.B .drawer .grow{flex:1}
.B .split{flex:1;min-height:0;display:flex}
.B .split > .quizmain{flex:1}
.B .tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);padding:0 var(--gutter)}
.B .tabs span{padding:10px 12px;font-size:var(--t-1);color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
.B .tabs span.done{color:var(--fg-2)}
.B .tabs span.cur{color:var(--fg);border-bottom-color:var(--accent);font-weight:600}
.B .copy{font-size:var(--t0);line-height:1.65;color:var(--fg-2);max-width:70ch}
.B .mchips{display:flex;gap:8px;overflow:hidden;padding:0 16px 10px}
.B .mchips span{flex:none;padding:8px 12px;border-radius:999px;border:1px solid var(--outline);font-size:14px;display:flex;gap:8px;align-items:center}
.B .mchips span.on{background:var(--accent-strong);color:var(--on-accent);border-color:var(--accent-strong);font-weight:600}
`;
function bRail(active = 'm2', { slim = false, lang = 'en' } = {}) {
  const s = S[lang];
  const item = (key, ic, title, sub, badge = '') => `<span class="item ${active === key ? 'on' : ''}" title="${title}">${ic}${slim ? '' : `<span class="t"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span>${badge}`}</span>`;
  const mods = MODULES.map(m => item(`m${m.n}`, ring(played(m) / m.topics.length, 28, 3, ''), `${s.module(m.n)}`, slim ? '' : m.title[lang], m.due ? `<span class="badge">${m.due}</span>` : '')).join('');
  return `<nav class="rail">${slim ? `<span class="item">${icon('back')}</span>` : `<span class="wordmark">${s.wordmark}</span>
<div class="cont"><div class="label">${s.continue}</div><h3>${lang === 'pt' ? 'Intervalos' : 'Intervals'}</h3><span class="btn btn-primary sm btn-block">${icon('play', 16)}${s.practice}</span></div>`}
${slim ? '' : `<div class="group">${s.course}</div>`}${mods}
${slim ? '' : `<div class="group">${lang === 'pt' ? 'Ferramentas' : 'Tools'}</div>`}
${item('stats', icon('stats'), s.stats, '')}${item('tuner', icon('tuner'), s.tuner, '')}
<div class="foot">${slim ? item('sound', icon('sound'), 'Sound', '') : ''}${item('settings', icon('settings'), s.settings, '')}</div></nav>`;
}
const bTop = (title, right = '', { back = false } = {}) => `<header class="top">${back ? `<span class="ibtn">${icon('back')}</span>` : ''}<h1>${title}</h1>${right}</header>`;

function bHome(vw, lang = 'en') {
  const s = S[lang];
  const m = MODULES[1];
  const wide = vw >= 1000;
  const rows = m.topics.map((t, i) => `<div class="trow ${wide ? '' : 'narrow'} ${t[0] === 'intervalos' ? 'next' : ''}"><div class="tn"><b>${t[1][lang]}</b><span>${scoreText(t, s)}${t[0] === 'intervalos' ? `<span class="sep"></span><span style="color:var(--accent)">${s.continue}</span>` : ''}</span></div>${wide ? `<div class="bar thin" style="width:180px"><span style="width:${t[2] ? t[2].best : 0}%"></span></div>` : ''}<span class="btn btn-ghost sm">${icon('book', 18)}<u>${s.learn}</u></span><span class="btn btn-primary sm">${s.practice}</span></div>`).join('');
  const head = `<div class="modhead"><div class="label">${s.module(2)}<span class="sep"></span>${s.topics(1, 7)}</div><h1>${m.title[lang]}</h1><p class="muted" style="margin-top:6px;max-width:70ch">${m.desc[lang]}</p><div style="display:flex;align-items:center;gap:16px;margin-top:14px;flex-wrap:wrap"><div class="bar" style="width:${wide ? 320 : 160}px"><span style="width:14%"></span></div><span class="btn btn-secondary sm">${icon('retry', 16)}${s.review(11)}</span></div></div>`;
  if (wide) {
    return `<div class="app">${bRail('m2', { lang })}<div class="view">${bTop('', '')}<main class="content" style="max-width:1100px">${head}<div>${rows}</div></main></div></div>`;
  }
  return `<div class="page" style="height:100%;display:flex;flex-direction:column"><header class="top"><span class="wordmark">${s.wordmark}</span><span class="ibtn">${icon('stats')}</span><span class="ibtn">${icon('tuner')}</span><span class="ibtn">${icon('settings')}</span></header>
<div class="mchips">${MODULES.map(mm => `<span class="${mm.n === 2 ? 'on' : ''}">${ring(played(mm) / mm.topics.length, 18, 3)}${s.module(mm.n)}</span>`).join('')}</div>
<main class="content" style="padding-top:8px"><section class="card" style="background:linear-gradient(180deg,#1f3a2f,var(--surface));border-color:#2f5c4c"><div class="label">${s.continue}</div><h2 style="font-size:var(--t2);margin:2px 0 10px">${lang === 'pt' ? 'Intervalos' : 'Intervals'}</h2><div class="actions"><span class="btn btn-primary">${icon('play', 18)}${s.practice}</span><span class="btn btn-secondary" style="flex:0 0 auto">${icon('book', 18)}${s.lesson}</span></div></section>${head}<div>${rows}</div></main><div class="scrollhint"></div></div>`;
}

function bLesson(vw) {
  const wide = vw >= 1000;
  const tabs = `<div class="tabs">${LESSON.steps.map((t, i) => `<span class="${i + 1 < LESSON.step ? 'done' : i + 1 === LESSON.step ? 'cur' : ''}">${i + 1}. ${wide ? t : ''}</span>`).join('')}</div>`;
  const board = fretboard({ frets: 7, markers: LESSON.markers, showFretNumbers: true, style: 'max-width:1000px' });
  const listen = `<div style="display:flex;gap:10px;flex-wrap:wrap">${LESSON.listen.map(l => listenBtn(l)).join('')}</div>`;
  if (wide) {
    return `<div class="app slim">${bRail('m2', { slim: true })}<div class="view">${bTop(LESSON.title, `<span class="chip">${LESSON.step} / ${LESSON.total}</span>`)}${tabs}<main class="content" style="max-width:1100px;gap:18px;padding-top:18px"><h2 style="font-size:var(--t3)">${LESSON.heading}</h2><p class="copy">${LESSON.copy}</p>${board}${listen}<div class="actions" style="margin-top:auto;justify-content:flex-start"><span class="btn btn-secondary" style="flex:0 0 auto">${icon('chevronLeft')}Previous</span><span class="btn btn-primary" style="flex:0 0 auto;min-width:200px">Next${icon('chevronRight')}</span></div></main></div></div>`;
  }
  return `<div class="page" style="height:100%;display:flex;flex-direction:column">${bTop(LESSON.title, `<span class="chip">${LESSON.step} / ${LESSON.total}</span>`, { back: true })}${tabs}<main class="content" style="gap:12px;padding-top:14px;text-align:center"><h2 style="font-size:var(--t3)">${LESSON.heading}</h2><p class="copy" style="margin:0 auto">${LESSON.copy}</p>${board}${listen.replace('display:flex', 'display:flex;justify-content:center')}</main><div class="stickybar"><div class="actions"><span class="btn btn-secondary">${icon('chevronLeft')}Previous</span><span class="btn btn-primary">Next${icon('chevronRight')}</span></div></div></div>`;
}

function bQuizTap(vw, { answered = false, lang = 'en' } = {}) {
  const wide = vw >= 1000;
  const board = fretboard({ showFretNumbers: true, highlightStrings: [TAP.string], interactive: true, markers: answered ? tapRevealMarkers() : [], style: `max-width:${answered ? 1000 : 1200}px` });
  const main = `<main class="quizmain"><div class="prompt">${TAP.prompt[lang]}</div>${board}<p class="small muted">${TAP.hint[lang]}</p></main>`;
  const drawer = answered ? `<aside class="drawer">${verdictBad(lang)}<p style="font-weight:600">${TAP.answer[lang]}</p><p class="explain">${TAP.explanation[lang]}</p><div>${listenBtn()}</div>${notationPair({ string: 5, fret: 10, written: TAP.written }, { width: 176 })}<div class="grow"></div><span class="btn btn-primary btn-block">Continue</span></aside>` : '';
  if (wide) {
    return `<div class="app slim">${bRail('m2', { slim: true })}<div class="view">${bTop(TAP.title[lang], `<span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span>`)}${progressRow({ history: [], round: 1, pad: 'padding-left:var(--gutter)' })}<div class="split">${main}${drawer}</div></div></div>`;
  }
  // phone: same as A's phone treatment
  return asA(aQuizTap(390, { answered, lang }));
}
function bQuizMc(vw) {
  const wide = vw >= 1000;
  if (!wide) return asA(aQuizMc(390));
  const answers = `<div class="answers" style="grid-template-columns:repeat(4,minmax(0,1fr));width:100%;max-width:1000px">${MC.choices.map((c, i) => `<span class="answer center ${i === 1 ? 'hover' : ''}"><span class="lbl">${c}</span>${kbd(i + 1)}</span>`).join('')}</div>`;
  return `<div class="app slim">${bRail('m1', { slim: true })}<div class="view">${bTop(MC.title.en, `<span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span>`)}${progressRow({ history: [true, true, false, true], round: 5, timed: true, pad: 'padding-left:var(--gutter)' })}<main class="quizmain"><div class="prompt">${MC.prompt.en}</div>${staff({ note: MC.note, width: 420, height: 260, gap: 16, style: `width:${vw >= 1600 ? 640 : 480}px;height:auto;max-width:100%` })}${answers}<p class="small muted">Press 1–4 to answer.</p></main></div></div>`;
}
function bResults(vw) {
  const wide = vw >= 1000;
  const inner = `<section class="card">${resultsHero()}<div class="actions" style="margin-top:18px"><span class="btn btn-primary">${icon('retry')}Play again</span><span class="btn btn-secondary">${icon('book')}Lesson</span><span class="btn btn-ghost" style="flex:0 0 auto"><u>Back to course</u></span></div></section><section class="card"><h3 style="font-size:var(--t1)">To review (7)</h3>${missedList()}<span class="btn btn-secondary btn-block" style="margin-top:12px">${icon('retry')}Review these 7</span></section>`;
  if (wide) return `<div class="app slim">${bRail('m2', { slim: true })}<div class="view">${bTop(RESULTS.title, `<span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span>`)}<main class="content" style="max-width:820px">${inner}</main></div></div>`;
  return `<div class="page" style="height:100%;display:flex;flex-direction:column">${topQuiz(RESULTS.title)}<main class="content">${inner}</main></div>`;
}
function bStats(vw) {
  const wide = vw >= 1000;
  const mods = MODULES.map(m => `<section class="card" id="s${m.n}"><div style="display:flex;align-items:baseline;gap:12px"><h3 style="font-size:var(--t1);flex:1">Module ${m.n} · ${m.title.en}</h3>${m.due ? `<span class="chip chip-amber">${m.due} due for review</span>` : ''}</div>${statsHead()}${statsRows(m)}</section>`).join('');
  const body = `<main class="content" style="max-width:1100px">${tiles(wide ? 4 : 2)}${mods}<div><span class="btn btn-danger">Reset all progress</span><p class="small muted" style="margin-top:10px">Clears plays, scores and the answer history used for reviews. Settings are not affected.</p></div></main>`;
  if (wide) return `<div class="app">${bRail('stats')}<div class="view">${bTop('Stats')}${body}</div></div>`;
  return `<div class="page" style="height:100%;display:flex;flex-direction:column">${topBack('Stats')}${body}<div class="scrollhint"></div></div>`;
}
function bTuner(vw) {
  const wide = vw >= 1000;
  const body = `<main class="content" style="max-width:720px;gap:16px"><p class="muted">Standard tuning (E A D G B E, A = 440 Hz). Play one open string at a time.</p>${tunerReadout({ big: wide })}<span class="btn btn-secondary" style="align-self:flex-start">${icon('mic', 18)}Turn off microphone</span><h3 style="font-size:var(--t1)">Hear the open strings</h3>${stringButtons()}<p class="small muted">An unplugged electric guitar is quiet: use an amp or an audio interface, or play close to the microphone.</p><p class="small muted">Sound is analyzed on this device and is never recorded or sent.</p></main>`;
  if (wide) return `<div class="app">${bRail('tuner')}<div class="view">${bTop('Tuner')}${body}</div></div>`;
  return `<div class="page" style="height:100%;display:flex;flex-direction:column">${topBack('Tuner')}${body.replace('align-self:flex-start', 'align-self:center').replace('max-width:720px', 'text-align:center')}</div>`;
}
function bSettings(vw) {
  const wide = vw >= 1000;
  if (wide) {
    return `<div class="app">${bRail('settings')}<div class="view" style="position:relative">${bTop('', '')}<main class="content" style="max-width:1100px">${bHome(vw).match(/<main class="content"[^>]*>([\s\S]*)<\/main>/)[1]}</main><div style="position:absolute;inset:0;background:rgba(0,0,0,.45)"></div><aside class="drawer" style="position:absolute;top:0;right:0;bottom:0;width:460px;padding-top:40px;overflow:hidden"><div class="sheet-head"><h2>Settings</h2><span class="ibtn">${icon('close')}</span></div>${settingsBody({ desktop: true })}</aside></div></div>`;
  }
  return asA(aSettings(390));
}

/* =========================================================== DIRECTION C */
const C_CSS = `
.C .desk{display:flex;flex-direction:column;height:100%}
.C .top{min-height:48px;padding-top:4px;padding-bottom:4px}
.C .paper-area{flex:1;min-height:0;display:flex;flex-direction:column;padding:4px var(--gutter) var(--s4)}
.C .strip{flex:none;background:var(--bg-sunken);border-top:1px solid var(--line);padding:var(--s3) var(--gutter) var(--s3);display:flex;align-items:center;gap:var(--s5)}
.C .strip .fretboard{flex:1}
.C .qa{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(360px,1fr);gap:var(--s6);align-items:start}
.C .prompt{font-family:var(--font-display);font-size:var(--t2);font-weight:600;line-height:1.3;max-width:40ch}
.C .sheetgrid{display:grid;gap:var(--s5);align-items:start}
.C table.course{width:100%;border-collapse:collapse;font-size:var(--t0)}
.C table.course th{text-align:left;font-weight:500;font-size:var(--t-1);color:var(--muted);padding:6px 8px;border-bottom:1px solid var(--line-strong)}
.C table.course td{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:middle;height:46px}
.C table.course td.n{font-family:var(--font-readout);font-weight:600;text-align:right;font-variant-numeric:tabular-nums;width:64px}
.C table.course td.dash{color:var(--line-strong);text-align:right}
.C table.course tr.mod td{padding:18px 8px 8px;border-bottom:1px solid var(--line-strong)}
.C table.course tr.mod h3{font-size:var(--t1);display:inline}
.C table.course tr.next td{background:var(--accent-soft)}
.C table.course .btn.sm{min-height:36px;padding:2px 12px;font-size:14px}
.C .today{display:flex;flex-direction:column;gap:var(--s4)}
.C .tl{display:flex;gap:10px;align-items:baseline;padding:8px 0;border-top:1px solid var(--line);font-size:var(--t-1)}
.C .tl b{color:var(--fg)}
.C .lane{display:flex;align-items:center;gap:14px;height:44px;padding:0 var(--gutter);border-top:1px solid var(--line)}
.C .lane .nm{width:72px;font:600 18px var(--font-readout)}
.C .lane .wire{flex:1;height:1px;background:var(--muted)}
.C .lane.on .wire{height:3px;background:var(--amber)}
.C .lane.on{background:var(--amber-soft)}
.C .copy{font-size:var(--t0);line-height:1.65;color:var(--fg-2);max-width:62ch}
.C .steps{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 14px;padding:0;list-style:none}
.C .steps li{font-size:var(--t-1);color:var(--muted);padding:6px 10px;border-radius:8px;border:1px solid var(--line)}
.C .steps li.done{color:var(--fg-2);border-color:var(--accent)}
.C .steps li.cur{background:var(--elevated);color:var(--fg);font-weight:600;border-color:var(--outline)}
.C .form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s5) var(--s7);max-width:1100px}
`;
const cTop = (title, right = '', { back = true } = {}) => `<header class="top">${back ? `<span class="ibtn">${icon('back')}</span>` : `<span class="wordmark" style="font-size:20px">musicgame</span>`}${title ? `<h1>${title}</h1>` : ''}${right}</header>`;

function cHome(vw, lang = 'en') {
  const s = S[lang];
  const wide = vw >= 1000;
  const twoTables = vw >= 1600;
  const row = t => `<tr class="${t[0] === 'intervalos' ? 'next' : ''}"><td>${t[1][lang]}${t[0] === 'intervalos' ? `<span class="small" style="color:var(--accent);margin-left:10px">${s.continue}</span>` : ''}</td>${t[2] ? `<td class="n">${t[2].best}%</td><td class="n" style="color:${t[2].last < 60 ? 'var(--amber)' : 'inherit'}">${t[2].last}%</td>` : '<td class="dash">—</td><td class="dash">—</td>'}<td style="text-align:right;white-space:nowrap"><span class="btn btn-ghost sm">${icon('book', 16)}<u>${s.learn}</u></span> <span class="btn btn-primary sm">${s.practice}</span></td></tr>`;
  const table = (mods) => `<table class="course"><thead><tr><th>${lang === 'pt' ? 'Tópico' : 'Topic'}</th><th style="text-align:right">${lang === 'pt' ? 'Melhor' : 'Best'}</th><th style="text-align:right">${lang === 'pt' ? 'Último' : 'Last'}</th><th></th></tr></thead><tbody>${mods.map(m => `<tr class="mod"><td colspan="4"><div style="display:flex;align-items:center;gap:14px"><span class="label">${s.module(m.n)}</span><h3>${m.title[lang]}</h3><span class="bar thin" style="width:120px;margin-left:auto"><span style="width:${pct(played(m), m.topics.length)}%"></span></span><span class="small muted readout">${played(m)}/${m.topics.length}</span></div></td></tr>${m.topics.map(row).join('')}`).join('')}</tbody></table>`;
  const today = `<aside class="today"><section class="card" style="background:linear-gradient(180deg,#1f3a2f,var(--surface));border-color:#2f5c4c"><div class="label">${s.continue}</div><h2 style="font-size:var(--t2);margin:2px 0 4px">${lang === 'pt' ? 'Intervalos' : 'Intervals'}</h2><p class="small muted">${s.rounds}<span class="sep"></span>${s.bestLast(70, 30)}</p><div class="actions" style="margin-top:14px"><span class="btn btn-primary">${icon('play', 18)}${s.practice}</span><span class="btn btn-secondary" style="flex:0 0 auto">${icon('book', 18)}${s.lesson}</span></div></section>
<section class="card"><h3 style="font-size:var(--t1);margin-bottom:6px">${s.review1}</h3><div class="tl" style="border-top:0"><span style="flex:1">${s.module(2)}</span><span class="btn btn-secondary sm">${icon('retry', 16)}${s.review(11)}</span></div><div class="tl"><span style="flex:1">${s.module(1)}</span><span class="muted">${s.caughtUp}</span></div></section>
<section class="card"><h3 style="font-size:var(--t1);margin-bottom:6px">${s.recent}</h3><div class="tl" style="border-top:0"><b>Intervals</b><span class="muted" style="flex:1">${lang === 'pt' ? 'hoje' : 'today'}</span><span class="readout" style="color:var(--amber)">30%</span></div><div class="tl"><b>Intervals</b><span class="muted" style="flex:1">${lang === 'pt' ? 'ontem' : 'yesterday'}</span><span class="readout">50%</span></div><div class="tl"><b>Staff I</b><span class="muted" style="flex:1">12 Oct</span><span class="readout">90%</span></div></section></aside>`;
  if (wide) {
    return `<div class="desk">${cTop('', `<span class="ibtn">${icon('stats')}</span><span class="ibtn">${icon('tuner')}</span><span class="ibtn">${icon('settings')}</span>`, { back: false })}<main class="paper-area" style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:var(--s6);align-items:start;overflow:hidden">${twoTables ? `<div class="sheetgrid" style="grid-template-columns:1fr 1fr">${table([MODULES[0], MODULES[2]])}${table([MODULES[1], MODULES[3]])}</div>` : table(MODULES)}${today}</main></div>`;
  }
  return `<div class="desk">${cTop('', `<span class="ibtn">${icon('stats')}</span><span class="ibtn">${icon('tuner')}</span><span class="ibtn">${icon('settings')}</span>`, { back: false })}<main class="paper-area" style="gap:14px">${today.replace('<aside class="today">', '<div class="today">').replace('</aside>', '</div>')}${table(MODULES).replace(/<th style="text-align:right">[^<]*<\/th><th style="text-align:right">[^<]*<\/th>/, '<th></th><th></th>')}</main><div class="scrollhint"></div></div>`;
}
function cStrip(board, right = '') {
  return `<div class="strip">${board}${right ? `<div style="display:flex;flex-direction:column;gap:8px;flex:none">${right}</div>` : ''}</div>`;
}
function cLesson(vw) {
  const wide = vw >= 1000;
  const steps = `<ol class="steps">${LESSON.steps.map((t, i) => `<li class="${i + 1 < LESSON.step ? 'done' : i + 1 === LESSON.step ? 'cur' : ''}">${i + 1}. ${t}</li>`).join('')}</ol>`;
  const nav = `<div class="actions" style="justify-content:flex-start;margin-top:18px"><span class="btn btn-secondary" style="flex:0 0 auto">${icon('chevronLeft')}Previous</span><span class="btn btn-primary" style="flex:0 0 auto;min-width:180px">Next${icon('chevronRight')}</span></div>`;
  const board = fretboard({ frets: 7, markers: LESSON.markers, showFretNumbers: true, style: 'max-width:1500px' });
  if (wide) {
    return `<div class="desk">${cTop(LESSON.title, `<span class="chip">${LESSON.step} / ${LESSON.total}</span>`)}<main class="paper-area" style="padding-top:10px">${steps}<h2 style="font-size:var(--t3);margin-bottom:10px">${LESSON.heading}</h2><p class="copy">${LESSON.copy}</p>${nav}</main>${cStrip(board, LESSON.listen.map(l => listenBtn(l)).join(''))}</div>`;
  }
  return asA(aLesson(390));
}
function cQuizTap(vw, { answered = false, lang = 'en' } = {}) {
  const wide = vw >= 1000;
  if (!wide) return asA(aQuizTap(390, { answered, lang }));
  const board = fretboard({ showFretNumbers: true, highlightStrings: [TAP.string], interactive: true, markers: answered ? tapRevealMarkers() : [], style: 'max-width:1500px' });
  const paper = answered
    ? `<div class="qa"><div><div class="prompt">${TAP.prompt[lang]}</div><div style="margin-top:14px">${verdictBad(lang)}</div><p style="font-weight:600;margin-top:12px">${TAP.answer[lang]}</p><p class="explain" style="margin-top:6px">${TAP.explanation[lang]}</p><div style="margin-top:12px">${listenBtn()}</div></div><div style="display:flex;flex-direction:column;gap:14px;align-items:flex-start">${notationPair({ string: 5, fret: 10, written: TAP.written }, { width: 200 })}<span class="btn btn-primary" style="min-width:260px">Continue<span style="margin-left:14px;opacity:.7;font-size:13px;font-weight:500">Enter ↵</span></span></div></div>`
    : `<div class="qa"><div><div class="prompt">${TAP.prompt[lang]}</div><p class="muted" style="margin-top:8px">${TAP.hint[lang]}</p></div></div>`;
  return `<div class="desk">${cTop(TAP.title[lang], `<span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span>`)}${progressRow({ history: [], round: 1, pad: 'padding-left:var(--gutter)' })}<main class="paper-area">${paper}</main>${cStrip(board)}</div>`;
}
function cQuizMc(vw) {
  const wide = vw >= 1000;
  if (!wide) return asA(aQuizMc(390));
  const answers = `<div class="answers col" style="max-width:420px">${MC.choices.map((c, i) => `<span class="answer ${i === 1 ? 'hover' : ''}"><span class="lbl">${c}</span>${kbd(i + 1)}</span>`).join('')}</div>`;
  return `<div class="desk">${cTop(MC.title.en, `<span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span>`)}${progressRow({ history: [true, true, false, true], round: 5, timed: true, pad: 'padding-left:var(--gutter)' })}<main class="paper-area"><div class="qa" style="align-items:center"><div><div class="prompt" style="margin-bottom:18px">${MC.prompt.en}</div>${staff({ note: MC.note, width: 420, height: 260, gap: 16, style: `width:${vw >= 1600 ? 640 : 460}px;height:auto;max-width:100%` })}</div>${answers}</div></main></div>`;
}
function cResults(vw) {
  const wide = vw >= 1000;
  if (!wide) return asA(aResults(390));
  return `<div class="desk">${cTop(RESULTS.title, `<span class="ibtn">${icon('sound')}</span><span class="ibtn">${icon('settings')}</span>`)}<main class="paper-area"><div class="qa" style="grid-template-columns:minmax(300px,.8fr) minmax(0,1.2fr)"><div>${resultsHero()}<div class="actions" style="margin-top:22px;justify-content:flex-start"><span class="btn btn-primary" style="flex:0 0 auto">${icon('retry')}Play again</span><span class="btn btn-secondary" style="flex:0 0 auto">${icon('book')}Lesson</span><span class="btn btn-ghost" style="flex:0 0 auto"><u>Back to course</u></span></div></div><div><h3 style="font-size:var(--t1)">To review (7)</h3>${missedList()}<span class="btn btn-secondary" style="margin-top:12px">${icon('retry')}Review these 7</span></div></div></main></div>`;
}
function cStats(vw) {
  const wide = vw >= 1000;
  if (!wide) return asA(aStats(390));
  const mods = MODULES.map(m => `<tr class="mod"><td colspan="6"><div style="display:flex;align-items:center;gap:14px"><span class="label">Module ${m.n}</span><h3>${m.title.en}</h3>${m.due ? `<span class="chip chip-amber" style="margin-left:auto">${m.due} due for review</span>` : ''}</div></td></tr>${m.topics.map(t => { const r = t[2]; const c = (v, low) => r ? `<td class="n" style="${low ? 'color:var(--amber)' : ''}">${v}%${low ? '<span class="small" style="font:400 11px var(--font);margin-left:4px">low</span>' : ''}</td>` : '<td class="dash">—</td>'; return `<tr><td>${t[1].en}</td>${r ? `<td class="n">${r.plays}</td>` : '<td class="dash">—</td>'}${c(r?.avg, r && r.avg < 60)}${c(r?.best, false)}${c(r?.last, r && r.last < 60)}<td style="width:44px">${r ? `<span class="ibtn" style="width:36px;height:36px">${icon('trash', 18)}</span>` : ''}</td></tr>`; }).join('')}`).join('');
  return `<div class="desk">${cTop('Stats')}<main class="paper-area" style="gap:16px;max-width:1300px">${tiles(4)}<table class="course"><thead><tr><th>Topic</th><th style="text-align:right">Plays</th><th style="text-align:right">Average</th><th style="text-align:right">Best</th><th style="text-align:right">Last</th><th></th></tr></thead><tbody>${mods}</tbody></table><div><span class="btn btn-danger">Reset all progress</span><p class="small muted" style="margin-top:10px">Clears plays, scores and the answer history used for reviews. Settings are not affected.</p></div></main></div>`;
}
function cTuner(vw) {
  const wide = vw >= 1000;
  if (!wide) return asA(aTuner(390));
  const lanes = [[6, 'E'], [5, 'A'], [4, 'D'], [3, 'G'], [2, 'B'], [1, 'E']].map(([n, l]) => `<div class="lane ${n === 5 ? 'on' : ''}"><span class="nm"><span class="muted" style="font-size:12px;margin-right:8px">${n}</span>${l}</span><span class="wire"></span><span class="hear" style="min-height:36px;padding:4px 12px;font-size:13px">${icon('play', 14)}${n === 5 ? 'Playing reference' : 'Hear'}</span></div>`).join('');
  return `<div class="desk">${cTop('Tuner')}<main class="paper-area" style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:var(--s6);align-items:start;max-width:1300px"><div style="display:flex;flex-direction:column;gap:14px"><p class="muted">Standard tuning (E A D G B E, A = 440 Hz). Play one open string at a time.</p>${tunerReadout()}<span class="btn btn-secondary" style="align-self:flex-start">${icon('mic', 18)}Turn off microphone</span></div><div><p class="small muted">An unplugged electric guitar is quiet: use an amp or an audio interface, or play close to the microphone.</p><p class="small muted" style="margin-top:8px">Sound is analyzed on this device and is never recorded or sent.</p></div></main><div style="flex:none;background:var(--bg-sunken);border-top:1px solid var(--line)"><div class="label" style="padding:10px var(--gutter) 4px">Open strings · tap one to hear it; the detected string lights up</div>${lanes}</div></div>`;
}
function cSettings(vw) {
  const wide = vw >= 1000;
  if (!wide) return asA(aSettings(390));
  return `<div class="desk">${cTop('Settings')}<main class="paper-area" style="padding-top:12px">${settingsBody({ desktop: true, cols: 2 })}</main></div>`;
}

/* ================================================================ boards */
const nav = (current) => ['redesign-index.html', 'redesign-a.html', 'redesign-b.html', 'redesign-c.html', 'redesign-notation.html'].map(f => f === current ? `<b>${f.replace('redesign-', '').replace('.html', '')}</b>` : `<a href="${f}">${f.replace('redesign-', '').replace('.html', '')}</a>`).join(' ');
function page(title, head, sections, { css = '', current = '' } = {}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · musicgame redesign mocks</title>
<style>${SHARED_CSS}${A_CSS}${B_CSS}${C_CSS}${css}</style></head>
<body><header class="board-head"><p class="kicker">musicgame · UI redesign · ${nav(current)}</p>${head}</header>${sections}${TALL_FIX}</body></html>`;
}
const sec = (title, sub, frames) => `<h2 class="sec">${title}${sub ? `<small>${sub}</small>` : ''}</h2><div class="row">${frames.join('')}</div>`;

function directionBoard(key, { title, blurb, principles, screens, tradeoffs }) {
  const head = `<h1>Direction ${key} — ${title}</h1>${blurb.map(p => `<p>${p}</p>`).join('')}<ul class="principles">${principles.map(p => `<li>${p}</li>`).join('')}</ul>`;
  const sections = screens.map(s => sec(s.title, s.sub, s.frames)).join('');
  const notes = `<h2 class="sec">Trade-offs<small>What this direction costs, and where it is weaker than the others.</small></h2><div class="spec">${tradeoffs.map(([h, t]) => `<div class="note"><h3>${h}</h3>${t}</div>`).join('')}</div>`;
  return page(`Direction ${key}`, head, sections + notes, { current: `redesign-${key.toLowerCase()}.html` });
}
const F = (vw, fn, cap, opts = {}) => frame(vw, fn(vw, opts.args ?? {}), cap, opts);
const all = (fn, caps, { dir, tall = {}, args = {} } = {}) => [1920, 1366, 1100, 390].map(vw => frame(vw, fn(vw, args), caps[vw] ?? '', { dir, tall: !!tall[vw] }));

/* ---------- A */
const boardA = directionBoard('A', {
  title: 'Stage',
  blurb: [
    'One page, no new navigation. The page column stops at nothing: content fills the window up to a comfortable measure, and every quiz becomes a two-pane stage. The instrument or the staff takes the wide left pane and scales with the window; the question, the answers and, after answering, the feedback live in a fixed right column, so nothing ever covers the question and Continue never moves.',
    'Home turns the 25-topic scroll into a course board: the Continue band across the top, then the four modules side by side, each with its topic list, a progress ring and its Review weak spots button. On a maximized 1920 window the whole course is visible without scrolling. Lessons split the same way: step list and text on the left, a large visual panel on the right, with Previous/Next under the text instead of 700 px away at the bottom of the window.',
  ],
  principles: ['Visual left, words right', 'Feedback replaces answers, in place', 'Continue stays put, Enter triggers it', 'Fretboard scales with the pane', 'Keys 1–4 answer on desktop', 'Phones keep the current single column'],
  screens: [
    { title: 'Home', sub: 'Course board: four module columns at 1600 px and up, two columns from 1000 px, one column with collapsible modules on phones. The 1100 px frame is the Portuguese check: the 45-character title wraps to two lines and the row stays 56 px high.',
      frames: [frame(1920, aHome(1920), 'Everything fits without scrolling: hero band, four modules, 25 topics, Review weak spots · 11 on Module 2.', { dir: 'A' }), frame(1366, aHome(1366), 'Two module columns; Module 1 continues below the fold.', { dir: 'A' }), frame(1100, aHome(1100, 'pt'), 'Português. “Tétrades com Fundamental nas Cordas 6, 5 e 4” wraps to two lines without breaking the row.', { dir: 'A', lang: 'pt' }), frame(390, aHome(390), 'Phone: Continue card, then modules; finished or untouched modules start collapsed.', { dir: 'A' })] },
    { title: 'Lesson step', sub: 'Step list with titles replaces the five-pixel strip: the learner sees the six steps and that “On your guitar” closes each lesson. The visual panel is as wide as the window allows; Listen buttons sit under the diagram they play.',
      frames: all(aLesson, { 1920: 'Intervals, step 3. The neck is 980 px wide; markers and labels scale with it.', 1366: 'Same split at 1366.', 1100: 'The default desktop window: 36 % text, 64 % visual.', 390: 'Phone: segment strip, centered text, visual, sticky Previous/Next.' }, { dir: 'A' }) },
    { title: 'Quiz — fretboard tap question', sub: 'The target string (string 6) is highlighted with a lane and a thicker string. On desktop a keyboard focus ring shows on fret 5 of that string. The right column holds the prompt and the hint; the answer is taken on tap.',
      frames: all(aQuizTap, { 1920: 'Board 1160 px wide: each fret cell is about 76 × 70 px.', 1366: 'Board about 820 px wide.', 1100: 'The default window keeps the two panes; the board is 640 px, larger than today’s 560 px cap.', 390: 'Phone: the split board, frets 0–6 and 7–12, unchanged.' }, { dir: 'A' }) },
    { title: 'Quiz — feedback after a wrong tap', sub: 'Nothing slides over the question. The solution is drawn on the same board (route E–F–G–A–B–C–D, the wrong tap marked ✗); the column shows the verdict, the answer, the explanation, Listen, tab and staff, and Continue pinned at the bottom with its Enter hint.',
      frames: all(aQuizTap, { 1920: 'The learner compares their tap and the answer on one neck.', 1366: 'The column is 32 % of the width, never under 360 px.', 1100: 'At 1100 px the notation pair shrinks to 180 px.', 390: 'Phone: the feedback is in flow under the board (scrolled to the verdict), Continue is sticky; no sheet covers the neck.' }, { dir: 'A', args: { answered: true } }) },
    { title: 'Quiz — multiple choice with a staff', sub: 'The staff renders at twice today’s size (VexFlow accepts the width). Answers stack in the column with key hints 1–4; the hovered choice shows the accent border. A timed round shows the ring in the progress row.',
      frames: all(aQuizMc, { 1920: 'Note Names, round 5, 8-second timer running.', 1366: '', 1100: '', 390: 'Phone: staff above a 2 × 2 answer grid, as today but with the new tokens.' }, { dir: 'A' }).concat([frame(1920, aQuizMc(1920, { answered: true }), 'After a correct answer in automatic mode: the right choice turns green with its icon, the others dim, the explanation appears under the answers and Continue shows the auto-advance delay.', { dir: 'A' })]) },
    { title: 'Results', sub: 'Score and actions left, missed rounds right. A Lesson button joins Play again, so a bad score has a way back to the explanation. Misses show ✗ and ✓ icons, not only red and green.',
      frames: all(aResults, { 1920: '', 1366: '', 1100: '', 390: 'Phone: stacked, as today.' }, { dir: 'A' }) },
    { title: 'Stats', sub: 'Four tiles (the fourth is “due for review”), then one card per module in a grid, with a column header row, tabular numerals and a “low” label under scores below 60 %. Reset buttons appear only on topics that have data.',
      frames: all(aStats, { 1920: 'Four module cards side by side; the whole table fits in 1032 px.', 1366: 'Two columns.', 1100: '', 390: 'Phone: one column, the tiles in a 2 × 2 grid.' }, { dir: 'A' }) },
    { title: 'Tuner', sub: 'A proper readout: the string name in the readout face, the direction in words and an arrow, a 22 px meter with ticks at ±25 cents, and the cents value in numerals. Reference strings become a vertical list with play icons on wide screens.',
      frames: all(aTuner, { 1920: 'Listening state, string 5 heard 12 cents flat.', 1366: '', 1100: '', 390: 'Phone: stacked; the meter spans the width.' }, { dir: 'A' }) },
    { title: 'Settings', sub: 'Still a centered dialog on desktop and a bottom sheet on phones, with the desktop-only “This computer” group and the Progress group. Width grows to 620 px on wide screens so the segmented controls breathe.',
      frames: [frame(1920, aSettings(1920), 'The full sheet fits a 1032 px window.', { dir: 'A' }), frame(1100, aSettings(1100), 'At 720 px tall the sheet scrolls inside; the dialog keeps the caption corner clear.', { dir: 'A' }), frame(390, aSettings(390), 'Phone sheet (no “This computer” group in the browser build).', { dir: 'A', tall: false })] },
  ],
  tradeoffs: [
    ['Two layouts for the quiz', 'The quiz has a two-pane layout from 1000 px and the stacked one below; feedback is “in column” on one and “in flow” on the other. GameShell renders both from the same state, but tests and the focus order need both paths.'],
    ['Wide boards need bigger text', 'Scaling the 560 px SVG to 1160 px scales fret numbers to 22 px and markers to 44 px, which is fine; but the string labels (12 px → 25 px) start to look heavy. The spec caps the board at 1160 px and sets marker text to 10–11 units.'],
    ['Home is dense on 1366 × 768', 'Two module columns put Module 1’s ten topics under the fold; the board still scrolls about one screen. Collapsing finished modules (as today) helps.'],
    ['No global navigation', 'Stats, Tuner and Settings stay as icons; there is still no jump from a quiz to another topic. A is the least change: it accepts that the app is “pick a topic, play it”.'],
  ],
});

/* ---------- B */
const boardB = directionBoard('B', {
  title: 'Rail',
  blurb: [
    'A persistent left rail turns the course into places. Each module is a destination with a progress ring and a due-count badge, Continue lives at the top of the rail, and Stats, Tuner and Settings are one click away from anywhere. The main area shows one module at a time as a generous list with per-topic progress bars, so the long scroll disappears without hiding the course.',
    'During lessons and quizzes the rail collapses to a 64 px strip (Back, sound, settings), the visual takes the centre of the window at up to 1200 px, and feedback docks as a right-hand drawer that pushes the content rather than covering it. Phones get module chips under the wordmark and otherwise share Direction A’s single column.',
  ],
  principles: ['Modules are places', 'The rail shows progress and what is due', 'Quiz focus: rail collapses', 'Feedback docks, never covers', 'Answers in one row under the visual', 'Settings is a drawer too'],
  screens: [
    { title: 'Home (Module 2 selected)', sub: 'Rail: Continue card, four modules with rings and the Module 2 badge “11”, tools below. Main: the module page with a wide topic list; the recommended topic is tinted and labelled Continue.',
      frames: [frame(1920, bHome(1920), 'The list uses the width: a 180 px best-score bar per topic, Learn and Practice side by side.', { dir: 'B' }), frame(1366, bHome(1366), '', { dir: 'B' }), frame(1100, bHome(1100, 'pt'), 'Português: the rail truncates module titles with an ellipsis (full title on hover); topic rows wrap freely.', { dir: 'B', lang: 'pt' }), frame(390, bHome(390), 'Phone: module chips scroll horizontally; the rail does not exist.', { dir: 'B' })] },
    { title: 'Lesson step', sub: 'Step tabs with titles across the top; copy at 70 characters per line; the visual as wide as the 1100 px column; Previous/Next at the end of the content.',
      frames: all(bLesson, { 1920: 'Collapsed rail on the left.', 1366: '', 1100: '', 390: 'Phone: numbered tabs without titles.' }, { dir: 'B' }) },
    { title: 'Quiz — fretboard tap question', sub: 'Centered, up to 1200 px wide. The prompt is above the neck, the hint below.',
      frames: all(bQuizTap, { 1920: 'The biggest neck of the three directions in the unanswered state.', 1366: '', 1100: '', 390: 'Phone: as Direction A.' }, { dir: 'B' }) },
    { title: 'Quiz — feedback drawer', sub: 'The drawer (420 px) docks on the right; the board shrinks to make room (instant under prefers-reduced-motion). Continue is pinned at the bottom of the drawer.',
      frames: all(bQuizTap, { 1920: '', 1366: 'The board goes from 1200 to about 700 px when the drawer opens.', 1100: 'At 1100 px the board is about 540 px with the drawer open: the squeeze is the cost of this direction.', 390: 'Phone: in-flow feedback, as A.' }, { dir: 'B', args: { answered: true } }) },
    { title: 'Quiz — multiple choice with a staff', sub: 'Four answers in a row under a large staff, each with its key hint.',
      frames: all(bQuizMc, { 1920: '', 1366: '', 1100: '', 390: '' }, { dir: 'B' }) },
    { title: 'Results', sub: 'A single 820 px column beside the collapsed rail.', frames: all(bResults, {}, { dir: 'B' }) },
    { title: 'Stats', sub: 'The rail stays, so modules are also anchors; each module card has a column header row and tabular numerals.', frames: all(bStats, { 1920: '', 1366: '', 1100: '', 390: 'Phone: cards stacked.' }, { dir: 'B' }) },
    { title: 'Tuner', sub: 'A 720 px column beside the rail with the large readout.', frames: all(bTuner, {}, { dir: 'B' }) },
    { title: 'Settings', sub: 'A right-hand drawer (460 px) over the dimmed page, like the feedback drawer. The caption corner stays above it.',
      frames: [frame(1920, bSettings(1920), '', { dir: 'B' }), frame(1100, bSettings(1100), 'At 720 px tall the drawer scrolls.', { dir: 'B' }), frame(390, bSettings(390), 'Phone: bottom sheet.', { dir: 'B' })] },
  ],
  tradeoffs: [
    ['Most new code', 'A rail, module routes, a collapsed rail state, a drawer component and a module-page layout are all new. The app has no router today; module selection becomes state in App.tsx.'],
    ['Less overview', 'Only one module’s topics are visible at a time. The rings help, but seeing the 25 topics requires four clicks.'],
    ['The drawer squeezes the board', 'At 1100 px the neck drops to about 540 px when feedback opens, smaller than today, exactly when the learner compares their tap with the answer. A keeps the board size constant.'],
    ['Two chrome systems', 'The rail is a second place for Settings, Sound and Back; the top bar still exists for titles. Drag regions for the desktop window need the rail header too.'],
  ],
});

/* ---------- C */
const boardC = directionBoard('C', {
  title: 'Desk',
  blurb: [
    'Paper above, instrument below. The window is split like a practice desk: the upper area is the “paper” (prompt, staff, tab, answers, explanations) and a full-width instrument strip at the bottom holds the neck, pinned, as wide as the window. Reading happens above; finding happens below. Lessons work the same way, and the Tuner turns the strip into six string lanes you can tap to hear and that light up when heard.',
    'Home becomes a course sheet: all 25 topics in a table (two tables side by side at 1600 px and up) with best and last scores, plus a Today panel with Continue, due reviews and recent plays. Stats is the same table with more columns. Settings is a full page in two columns on desktop.',
  ],
  principles: ['Read above, play below', 'The neck is as wide as the window', 'Tables where the content is tabular', 'Today panel: Continue, due, recent', 'Tuner lanes are the strings', 'Phones fall back to Direction A'],
  screens: [
    { title: 'Home', sub: 'Course sheet plus Today panel. Rows are 46 px; the recommended topic is tinted.',
      frames: [frame(1920, cHome(1920), 'Two tables: Modules 1 and 3 left, 2 and 4 right. All 25 topics, both scores, and Today, without scrolling.', { dir: 'C' }), frame(1366, cHome(1366), 'One table; Module 3 and 4 below the fold.', { dir: 'C' }), frame(1100, cHome(1100), '', { dir: 'C' }), frame(390, cHome(390), 'Phone: Today cards first, then the table without the score columns.', { dir: 'C' })] },
    { title: 'Lesson step', sub: 'Text on the paper, the neck on the strip with Listen buttons at its right end.',
      frames: all(cLesson, { 1920: 'The neck is 1500 px wide: each of the eight frets is about 180 px.', 1366: '', 1100: 'At 1100 × 720 the strip takes about a third of the height.', 390: 'Phone: Direction A’s layout.' }, { dir: 'C' }) },
    { title: 'Quiz — fretboard tap question (Portuguese check)', sub: 'The paper holds the prompt and hint; the strip holds the neck with the target string lane. Shown in Portuguese to check the longer prompt.',
      frames: all(cQuizTap, { 1920: 'The largest neck: 1500 px, cells about 100 × 70 px.', 1366: '', 1100: '', 390: 'Phone: Direction A.' }, { dir: 'C', args: { lang: 'pt' } }) },
    { title: 'Quiz — feedback', sub: 'The paper shows the verdict, explanation, Listen, tab and staff, and Continue; the strip shows the route and the wrong tap.',
      frames: all(cQuizTap, { 1920: '', 1366: '', 1100: '', 390: '' }, { dir: 'C', args: { answered: true } }) },
    { title: 'Quiz — multiple choice with a staff', sub: 'No neck for this topic, so the paper takes the whole window: staff left, answers right with key hints.',
      frames: all(cQuizMc, {}, { dir: 'C' }) },
    { title: 'Results', sub: 'Score left, misses right, on the paper.', frames: all(cResults, {}, { dir: 'C' }) },
    { title: 'Stats', sub: 'One table, six columns, module header rows with the due chip.', frames: all(cStats, {}, { dir: 'C' }) },
    { title: 'Tuner', sub: 'The readout on the paper; the six open strings as lanes on the strip. The heard string lights amber; tapping a lane plays its reference tone.', frames: all(cTuner, {}, { dir: 'C' }) },
    { title: 'Settings', sub: 'A full page, two columns on desktop: playing settings left, this computer and progress right.', frames: [frame(1920, cSettings(1920), '', { dir: 'C' }), frame(1100, cSettings(1100), '', { dir: 'C' }), frame(390, cSettings(390), 'Phone: bottom sheet.', { dir: 'C' })] },
  ],
  tradeoffs: [
    ['Huge boards need their own typography', 'At 1500 px the SVG scales labels to about 32 px and markers to 60 px. The board would need a size-aware mode (smaller unit sizes for wide widths), which Fretboard.tsx does not have.'],
    ['Half the topics have no neck', 'Module 1 and many Module 3–4 questions show a staff, a keyboard or text. The strip is empty or absent for them, so the layout metaphor only holds for part of the course.'],
    ['Vertical squeeze on the default window', 'At 1100 × 720 the strip takes a third of the height; the paper above has room for a prompt and a short explanation only. Long explanations scroll.'],
    ['Phones are a different app', 'A pinned strip does not fit a phone, so phones use Direction A. Two mental models for one product.'],
  ],
});

/* ---------- index */
const swatch = (name, hex, note = '') => `<tr><td><span class="sw" style="background:${hex}"></span>${name}</td><td><code>${hex}</code></td><td>${note}</td></tr>`;
const paletteTable = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:1200px">
<div><h3 style="margin:16px 0 0">Current</h3><table class="t">
${swatch('--bg', CURRENT.bg)}${swatch('--bg-card', CURRENT.card)}${swatch('--bg-elevated', CURRENT.elevated)}${swatch('--fg', CURRENT.fg)}${swatch('--fg-muted', CURRENT.muted)}${swatch('--accent', CURRENT.accent)}${swatch('--accent-strong', CURRENT.accentStrong)}${swatch('--danger', CURRENT.danger)}${swatch('--warn (also root markers)', CURRENT.warn)}${swatch('--border', CURRENT.border)}${swatch('--border-strong', CURRENT.borderStrong)}${swatch('--paper', CURRENT.paper)}${swatch('--ink', CURRENT.ink)}
</table></div>
<div><h3 style="margin:16px 0 0">Proposed</h3><table class="t">
${swatch('--bg', TOKENS.bg, 'page; a touch of green in the grey')}${swatch('--bg-sunken', TOKENS.sunken, 'rail, instrument strip, segmented control tracks')}${swatch('--surface', TOKENS.surface, 'cards, panels (was --bg-card)')}${swatch('--elevated', TOKENS.elevated, 'buttons, pills, hover')}${swatch('--fg', TOKENS.fg)}${swatch('--fg-2', TOKENS.fg2, 'new: secondary text, lesson copy, explanations')}${swatch('--muted', TOKENS.muted, 'labels, captions, strings')}${swatch('--accent', TOKENS.accent, 'correct, progress, degree markers, links')}${swatch('--accent-strong', TOKENS.accentStrong, 'primary buttons, with --on-accent text')}${swatch('--danger', TOKENS.danger, 'wrong; softer than today, same meaning')}${swatch('--amber', TOKENS.amber, 'root markers, low scores, tuner off-pitch; always with a label or glyph')}${swatch('--line', TOKENS.line, 'decorative rules and card edges')}${swatch('--line-strong', TOKENS.lineStrong, 'fret wires, tracks, inlays')}${swatch('--outline', TOKENS.outline, 'new: boundaries of interactive controls')}${swatch('--focus', TOKENS.focus, 'new: focus ring, 12 : 1 on every surface')}${swatch('--paper', TOKENS.paper, 'notation; slightly warm to cut glare')}${swatch('--ink', TOKENS.ink)}
</table></div></div>`;
const cPairs = [
  ['Body text on page', [CURRENT.fg, CURRENT.bg], [TOKENS.fg, TOKENS.bg]],
  ['Body text on card / surface', [CURRENT.fg, CURRENT.card], [TOKENS.fg, TOKENS.surface]],
  ['Secondary text on surface', [CURRENT.fg, CURRENT.card], [TOKENS.fg2, TOKENS.surface]],
  ['Muted text on page', [CURRENT.muted, CURRENT.bg], [TOKENS.muted, TOKENS.bg]],
  ['Muted text on surface', [CURRENT.muted, CURRENT.card], [TOKENS.muted, TOKENS.surface]],
  ['Muted text on elevated (key hints, pills)', [CURRENT.muted, CURRENT.elevated], [TOKENS.muted, TOKENS.elevated]],
  ['Accent text on surface (correct, links)', [CURRENT.accent, CURRENT.card], [TOKENS.accent, TOKENS.surface]],
  ['Primary button text', ['#0f0f0f', CURRENT.accentStrong], [TOKENS.onAccent, TOKENS.accentStrong]],
  ['Wrong text on surface', [CURRENT.danger, CURRENT.card], [TOKENS.danger, TOKENS.surface]],
  ['Text on wrong marker / answer', ['#0f0f0f', CURRENT.danger], [TOKENS.onAccent, TOKENS.danger]],
  ['Amber text on surface (low score)', [CURRENT.warn, CURRENT.card], [TOKENS.amber, TOKENS.surface]],
  ['Text on root marker', ['#0f0f0f', CURRENT.warn], [TOKENS.onAccent, TOKENS.amber]],
  ['Control boundary on surface', [CURRENT.borderStrong, CURRENT.card], [TOKENS.outline, TOKENS.surface]],
  ['Control boundary on page', [CURRENT.borderStrong, CURRENT.bg], [TOKENS.outline, TOKENS.bg]],
  ['Focus ring on surface', [CURRENT.accent, CURRENT.card], [TOKENS.focus, TOKENS.surface]],
  ['Ink on paper', [CURRENT.ink, CURRENT.paper], [TOKENS.ink, TOKENS.paper]],
  ['Accent fill vs surface (progress, markers)', [CURRENT.accent, CURRENT.card], [TOKENS.accent, TOKENS.surface]],
];
const grade = (v, min) => Number(v) >= min ? 'ok' : Number(v) >= min * 0.9 ? 'warn' : 'bad';
const contrastTable = `<table class="t" style="max-width:900px"><thead><tr><th>Pair</th><th>Target</th><th>Current</th><th>Proposed</th></tr></thead><tbody>${cPairs.map(([n, c, p]) => {
  const min = /boundary|fill|ring/.test(n) ? 3 : 4.5;
  const cv = contrast(...c), pv = contrast(...p);
  return `<tr><td>${n}</td><td>${min} : 1</td><td class="${grade(cv, min)}">${cv} : 1</td><td class="${grade(pv, min)}">${pv} : 1</td></tr>`;
}).join('')}</tbody></table>
<p class="callout">Control boundaries are the one pair under 3 : 1 in both palettes. The proposal raises them from 1.4 : 1 to 2.7–3.0 : 1 and never relies on the border alone: answer buttons and secondary buttons are also filled (--elevated) and carry text; the focus ring is a separate 12 : 1 colour. Amber marks roots and low scores but never alone: roots carry an “R”, low scores a “low” label, the tuner an arrow and words.</p>`;

const typeDemo = `<div class="screen" style="width:1100px;padding:24px 28px;border-radius:12px;border:1px solid #242925;display:flex;flex-direction:column;gap:14px;height:auto">
<div style="display:grid;grid-template-columns:200px 1fr;gap:8px 24px;align-items:baseline">
<span class="label">--t4 display · readout face</span><span class="readout" style="font-size:var(--t4);line-height:1">30% <span style="font-size:.5em;color:var(--amber)">A ↑</span></span>
<span class="label">--t3 page / lesson heading</span><h2 style="font-size:var(--t3)">Across the strings · Em outra corda</h2>
<span class="label">--t2 question prompt</span><span style="font-family:var(--font-display);font-size:var(--t2);font-weight:600">Find D on string 6 (frets 0–12).</span>
<span class="label">--t-answer answer label</span><span style="font-size:var(--t-answer);font-weight:600">perfect 5th <span class="kbd">3</span></span>
<span class="label">--t1 row title</span><span style="font-size:var(--t1);font-weight:600">Seventh-Chord Voicings on Strings 6, 5 and 4</span>
<span class="label">--t0 body</span><span class="fg2" style="max-width:62ch;line-height:1.65">Moving to the next higher string adds 5 semitones (4 from string 3 to string 2). So from G at fret 3 of string 6: the perfect 4th is at the same fret on string 5.</span>
<span class="label">--t-1 caption / label</span><span class="label">Best 70%, last 30% <span class="sep"></span> Module 2 · 10 rounds</span>
<span class="label">readout numerals</span><span class="readout" style="font-size:20px">Round 5 of 10 · ✓ 3 ✗ 1 · −12 cents · 109.2 Hz · 2/10</span>
</div></div>`;

const indexSections = `
<h2 class="sec">The problem, in one picture<small>Today at 1920 × 1032 the quiz is a 760 px column: a 560 px neck, 500 px of empty screen below it, and feedback that slides over the question. The three directions below all start from this screenshot.</small></h2>
<div class="row"><figure class="frame" style="--cw:960px"><img src="current-quiz-board-1920.png" alt="Current quiz at 1920 px: a small fretboard in a narrow column" width="960" style="border:1px solid #2a2f2b;border-radius:6px;display:block"><figcaption><b>Current app, 1920 px</b> — Natural Notes on the Neck. The target string is not marked; the board is 29 % of the width; cells are 38 × 34 px.</figcaption></figure>
<figure class="frame" style="--cw:960px"><img src="current-quiz-feedback-1920.png" alt="Current feedback sheet covering the question" width="960" style="border:1px solid #2a2f2b;border-radius:6px;display:block"><figcaption><b>Current feedback</b> — the sheet covers the board; the solution is a second, smaller board inside the sheet.</figcaption></figure></div>

<h2 class="sec">Audit summary<small>Confirmed against the screenshots and the code. The full audit with evidence is in docs/design/REDESIGN.md.</small></h2>
<div class="spec">
<div class="note"><h3>Space</h3>Page column capped at 760 px (1160 on Home); fretboard capped at 560 px (Fretboard.tsx WIDTH); VexFlow staves at 200–280 px. At 1920 the quiz uses 29 % of the width and the lesson leaves 700 px between the visual and Previous/Next.</div>
<div class="note"><h3>Home</h3>25 topic cards with 50 buttons; the 1920 page is 2697 px tall, the phone page 4000+. The Continue card is 320 px wide and sticky over empty space. Each module’s most prominent control is “Hide topics”.</div>
<div class="note"><h3>Feedback covers the question</h3>The fixed sheet (max-height 78vh) hides the board the learner just tapped; the solution is redrawn smaller inside the sheet. On phones the sheet covers the whole neck.</div>
<div class="note"><h3>Target string</h3>“Find D on string 6” draws no highlight: naturals.ts passes no highlightStrings, although Fretboard.tsx supports it and intervals.ts uses it. One-line fix, independent of the redesign.</div>
<div class="note"><h3>Hierarchy and reading</h3>Everything centered; quiz prompt 19 px; Stats numbers 13 px; chips 13 px; fret numbers 11 px inside a scaled-down SVG; uppercase tracked labels in seven places.</div>
<div class="note"><h3>Navigation</h3>Results offer Play again and Back, not the lesson. Stats and Tuner are reachable only from Home. No keyboard shortcut answers a question or continues.</div>
<div class="note"><h3>Consistency</h3>Card borders (#333 on #242424) are 1.2 : 1, invisible; secondary buttons and answer buttons have 1.4 : 1 borders. Amber means both “root” and “low score”. Fret cells on desktop are 38 × 34 px, under the 44 px target.</div>
<div class="note"><h3>Stats and Tuner</h3>Stats lists 25 rows with “—” for 22 of them and a disabled trash icon on each; no column headers. The Tuner is a 560 px column whose panel shows a sentence until the microphone is on; the meter is 18 px with no scale.</div>
</div>

<h2 class="sec">Three directions<small>Each board shows every screen at 1920 × 1032, 1366 × 768, 1100 × 720 and 390 × 844, with one Portuguese check.</small></h2>
<div class="row">
<figure class="frame" style="--cw:480px"><a href="redesign-a.html"><div class="win" style="width:480px;height:258px"><div class="screen desktop A" style="width:1920px;height:1032px;transform:scale(.25)">${caption(true)}${aHome(1920)}</div></div></a><figcaption><b>A — Stage</b> (recommended). Two-pane quizzes, course board Home, split lessons. The least new code.</figcaption></figure>
<figure class="frame" style="--cw:480px"><a href="redesign-b.html"><div class="win" style="width:480px;height:258px"><div class="screen desktop B" style="width:1920px;height:1032px;transform:scale(.25)">${caption(true)}${bHome(1920)}</div></div></a><figcaption><b>B — Rail</b>. A module rail with rings and due counts; feedback and settings as docked drawers.</figcaption></figure>
<figure class="frame" style="--cw:480px"><a href="redesign-c.html"><div class="win" style="width:480px;height:258px"><div class="screen desktop C" style="width:1920px;height:1032px;transform:scale(.25)">${caption(true)}${cHome(1920)}</div></div></a><figcaption><b>C — Desk</b>. Paper above, instrument strip below; a course sheet and a tuner with string lanes.</figcaption></figure>
</div>
<div class="row">
<figure class="frame" style="--cw:480px"><a href="redesign-a.html"><div class="win" style="width:480px;height:258px"><div class="screen desktop A" style="width:1920px;height:1032px;transform:scale(.25)">${caption(true)}${aQuizTap(1920, { answered: true })}</div></div></a><figcaption><b>A</b> feedback: solution on the same neck, text in the column.</figcaption></figure>
<figure class="frame" style="--cw:480px"><a href="redesign-b.html"><div class="win" style="width:480px;height:258px"><div class="screen desktop B" style="width:1920px;height:1032px;transform:scale(.25)">${caption(true)}${bQuizTap(1920, { answered: true })}</div></div></a><figcaption><b>B</b> feedback: a docked drawer.</figcaption></figure>
<figure class="frame" style="--cw:480px"><a href="redesign-c.html"><div class="win" style="width:480px;height:258px"><div class="screen desktop C" style="width:1920px;height:1032px;transform:scale(.25)">${caption(true)}${cQuizTap(1920, { answered: true })}</div></div></a><figcaption><b>C</b> feedback: paper above, the neck below.</figcaption></figure>
</div>

<h2 class="sec">Palette<small>Same identity: dark, mint accent, paper for notation. The greys get a trace of green so the mint belongs to them, borders become visible where they matter, and amber is named for what it does.</small></h2>
${paletteTable}
<h3 style="margin:28px 0 0;font-size:16px">Contrast (WCAG 2.x)</h3>${contrastTable}

<h2 class="sec">Type and spacing<small>Two families, two jobs. Segoe UI Variable (Text for body, Display for headings) is the system face on Windows 11 and falls back to system-ui elsewhere, so nothing is downloaded. Bahnschrift, also shipped with Windows, is the readout face: scores, round counts, timer, cents, fret numbers in tables. It is the typographic cousin of a tuner display and an amp faceplate; on other platforms it falls back to the display face with tabular numerals.</small></h2>
${typeDemo}
<table class="t" style="max-width:900px;margin-top:18px"><thead><tr><th>Token</th><th>Value</th><th>Use</th></tr></thead><tbody>
<tr><td>--t-1</td><td>13px</td><td>captions, labels, chips, table headers</td></tr>
<tr><td>--t0</td><td>clamp(15px, 14px + .2vw, 17px)</td><td>body, buttons, lesson copy (line-height 1.65)</td></tr>
<tr><td>--t1</td><td>clamp(16px, 15px + .25vw, 18px)</td><td>row titles, top-bar title, card titles</td></tr>
<tr><td>--t2</td><td>clamp(19px, 17px + .5vw, 24px)</td><td>question prompt, sheet titles</td></tr>
<tr><td>--t3</td><td>clamp(22px, 19px + .8vw, 30px)</td><td>page and lesson headings, Home hero title</td></tr>
<tr><td>--t4</td><td>clamp(44px, 32px + 2.6vw, 76px)</td><td>results percentage, tuner note (readout face)</td></tr>
<tr><td>--t-answer</td><td>clamp(18px, 16px + .4vw, 22px)</td><td>answer buttons</td></tr>
<tr><td>--s1 … --s7</td><td>4, 8, 12, 16, 24, 32, 48 px</td><td>the only spacing steps</td></tr>
<tr><td>--gutter</td><td>clamp(16px, 2vw, 40px)</td><td>page side padding</td></tr>
<tr><td>--r-card / --r-ctl</td><td>16 px / 12 px</td><td>cards and panels / buttons, answers, inputs</td></tr>
<tr><td>--tap / --tap-sm</td><td>52 px / 44 px</td><td>primary controls / icon buttons, small buttons</td></tr>
</tbody></table>
`;
const boardIndex = page('Overview', `<h1>UI redesign: audit, three directions, palette</h1>
<p>Static mocks for the owner to approve before anything is built. Nothing in src/ changed. Every direction keeps the app’s identity (dark, mint, paper for notation, the same icons and components) and the desktop caption-button corner (138 × 32, top right) free on every screen.</p>
<p class="nav"><a href="redesign-a.html">Direction A — Stage</a> <a href="redesign-b.html">Direction B — Rail</a> <a href="redesign-c.html">Direction C — Desk</a> · write-up: <code>docs/design/REDESIGN.md</code></p>`,
indexSections, { current: 'redesign-index.html' });

writeFileSync(join(OUT, 'redesign-index.html'), boardIndex);
writeFileSync(join(OUT, 'redesign-a.html'), boardA);
writeFileSync(join(OUT, 'redesign-b.html'), boardB);
writeFileSync(join(OUT, 'redesign-c.html'), boardC);
console.log('wrote redesign-index.html, redesign-a.html, redesign-b.html, redesign-c.html');
