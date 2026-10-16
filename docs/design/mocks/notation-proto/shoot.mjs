// Screenshots of the notation prototype with headless Chrome over the DevTools
// protocol. Usage (from the repo root, with the Vite dev server running):
//   node docs/design/mocks/notation-proto/shoot.mjs [baseUrl] [only]
// Writes WebP files into docs/design/mocks/notation-shots/.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'notation-shots');
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.argv[2] ?? 'http://localhost:5180/docs/design/mocks/notation-proto/index.html';
const ONLY = process.argv[3];
const PORT = Number(process.env.CDP_PORT ?? 9444);

// name, viewport, query, options. `clip` crops a region (CSS px) of the full page; `scale` is the
// device scale of the output; `half` stores the frame at 50 % for the board.
const SHOTS = [
  ['strip', [1920, 1200], 'screen=strip', { full: true }],
  ['feedback-1920-before', [1920, 1032], 'screen=feedback&theme=paper', { half: true }],
  ['feedback-1920-after', [1920, 1032], 'screen=feedback&theme=linked', { half: true }],
  ['feedback-1920-after-ink', [1920, 1032], 'screen=feedback&theme=ink', { half: true }],
  ['feedback-1920-after-quiet', [1920, 1032], 'screen=feedback&theme=quiet', { half: true }],
  ['feedback-1920-detail-before', [1920, 1032], 'screen=feedback&theme=paper', { clip: '.notation-pair', pad: 24 }],
  ['feedback-1920-detail-after', [1920, 1032], 'screen=feedback&theme=linked', { clip: '.notation-pair', pad: 24 }],
  ['feedback-1100-before', [1100, 720], 'screen=feedback&theme=paper', { half: true }],
  ['feedback-1100-after', [1100, 720], 'screen=feedback&theme=linked', { half: true }],
  ['feedback-390-before', [390, 844], 'screen=feedback&theme=paper', { full: true }],
  ['feedback-390-after', [390, 844], 'screen=feedback&theme=linked', { full: true }],
  ['feedback-390-detail-after', [390, 844], 'screen=feedback&theme=linked', { clip: '.notation-pair', pad: 16, scale: 2 }],
  ['feedback-1100-pt-after', [1100, 720], 'screen=feedback&theme=linked&lang=pt', { half: true }],
  ['mc-1920-before', [1920, 1032], 'screen=mc&theme=paper', { half: true }],
  ['mc-1920-after', [1920, 1032], 'screen=mc&theme=ink', { half: true }],
  ['mc-1920-answered-before', [1920, 1032], 'screen=mc&theme=paper&answered=1', { half: true }],
  ['mc-1920-answered-after', [1920, 1032], 'screen=mc&theme=ink&answered=1', { half: true }],
  ['mc-390-after', [390, 844], 'screen=mc&theme=ink', { full: true }],
  ['lesson-treble-1920-before', [1920, 1032], 'screen=lesson-treble&theme=paper', { half: true }],
  ['lesson-treble-1920-after', [1920, 1032], 'screen=lesson-treble&theme=ink', { half: true }],
  ['lesson-treble-1920-detail-after', [1920, 1032], 'screen=lesson-treble&theme=ink', { clip: '.vex-stave', pad: 12 }],
  ['lesson-treble-1100-four-after', [1100, 720], 'screen=lesson-treble&theme=ink&step=four', { half: true }],
  ['lesson-treble-1100-four-before', [1100, 720], 'screen=lesson-treble&theme=paper&step=four', { half: true }],
  ['lesson-clefs-1920-before', [1920, 1032], 'screen=lesson-clefs&theme=paper', { half: true }],
  ['lesson-clefs-1920-after', [1920, 1032], 'screen=lesson-clefs&theme=ink', { half: true }],
  ['lesson-clefs-1100-bass-after', [1100, 720], 'screen=lesson-clefs&theme=ink&step=bass', { half: true }],
  ['lesson-measure-1920-before', [1920, 1032], 'screen=lesson-measure&theme=paper', { half: true }],
  ['lesson-measure-1920-after', [1920, 1032], 'screen=lesson-measure&theme=linked', { half: true }],
  ['lesson-measure-1920-detail-after', [1920, 1032], 'screen=lesson-measure&theme=linked', { clip: '.vex-stave', pad: 12 }],
  ['quiz-measure-1100-before', [1100, 720], 'screen=quiz-measure&theme=paper', { half: true }],
  ['quiz-measure-1100-after', [1100, 720], 'screen=quiz-measure&theme=linked', { half: true }],
  ['explorer-1920-before', [1920, 1032], 'screen=explorer&theme=paper', { half: true }],
  ['explorer-1920-after', [1920, 1032], 'screen=explorer&theme=linked', { half: true }],
  ['explorer-1920-detail-after', [1920, 1032], 'screen=explorer&theme=linked', { clip: '.notation-pair', pad: 24 }],
  ['explorer-390-after', [390, 844], 'screen=explorer&theme=linked', { full: true }],
];

mkdirSync(OUT, { recursive: true });
const profile = join(tmpdir(), `mg-notation-profile-${PORT}`);
rmSync(profile, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank',
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 160; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(250); }
}
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0;
const pending = new Map();
const logs = [];
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    logs.push(`${msg.params.type}: ${msg.params.args.map(a => a.value ?? a.description).join(' ')}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') logs.push('exception: ' + msg.params.exceptionDetails.exception?.description);
});
const send = (method, params = {}) => new Promise(resolve => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description ?? 'eval failed');
  return res.result?.result?.value;
};
await send('Page.enable');
await send('Runtime.enable');

// Warm-up: the first load may trigger a Vite dependency re-optimisation.
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1032, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `${BASE}?screen=strip` });
await sleep(2500);

const report = [];
for (const [name, [w, h], query, opts] of SHOTS) {
  if (ONLY && !name.includes(ONLY)) continue;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
  await send('Page.navigate', { url: `${BASE}?${query}` });
  await sleep(1400);
  // Wait for VexFlow: every .vex-stave must contain an svg.
  const ready = await evaluate(`new Promise(r => { let n = 0; const t = setInterval(() => { const s = [...document.querySelectorAll('.vex-stave')]; if ((s.length && s.every(e => e.querySelector('svg'))) || ++n > 40) { clearInterval(t); r(s.length); } }, 100); })`);
  await sleep(300);
  let clip;
  const metrics = await send('Page.getLayoutMetrics');
  const fullH = Math.ceil(metrics.result.cssContentSize.height);
  if (opts.clip) {
    const box = await evaluate(`(() => { const els = [...document.querySelectorAll(${JSON.stringify(opts.clip)})]; const r = els.map(e => e.getBoundingClientRect()).reduce((a, b) => ({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) }), { left: 1e9, top: 1e9, right: 0, bottom: 0 }); return { x: r.left + scrollX, y: r.top + scrollY, w: r.right - r.left, h: r.bottom - r.top }; })()`);
    const pad = opts.pad ?? 0;
    clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2, scale: opts.scale ?? 1 };
  } else if (opts.full) {
    clip = { x: 0, y: 0, width: w, height: Math.min(fullH, 6000), scale: opts.scale ?? 1 };
  } else {
    clip = { x: 0, y: 0, width: w, height: h, scale: opts.half ? 0.5 : 1 };
  }
  const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 90, captureBeyondViewport: true, clip });
  writeFileSync(join(OUT, `${name}.webp`), Buffer.from(shot.result.data, 'base64'));
  // Measurements for the legibility section.
  const measure = await evaluate(`(() => {
    const out = {};
    const svg = document.querySelector('.vex-stave svg'); if (!svg) return out;
    const r = svg.getBoundingClientRect(); out.svg = [Math.round(r.width), Math.round(r.height)];
    const vb = svg.viewBox.baseVal; out.scale = vb && vb.width ? +(r.width / vb.width).toFixed(2) : 1;
    const texts = [...document.querySelectorAll('.vex-stave svg text')].map(t => t.getBoundingClientRect().height);
    if (texts.length) out.textPx = [Math.round(Math.min(...texts)), Math.round(Math.max(...texts))];
    const heads = [...document.querySelectorAll('.vex-stave svg .vf-notehead path, .vex-stave svg .vf-stavenote path')].map(p => p.getBoundingClientRect());
    if (heads.length) out.headPx = Math.round(Math.max(...heads.map(h => h.width)));
    return out;
  })()`).catch(e => ({ error: String(e) }));
  report.push({ name, staves: ready, ...measure });
}
console.log(JSON.stringify({ report, logs }, null, 1));
ws.close();
chrome.kill();
