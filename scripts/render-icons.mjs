// Renders the desktop app and tray icons from src-tauri/icons/source/*.svg.
// Run with `npm run desktop:icons` after changing a source SVG. It drives a
// locally installed Chrome or Edge in headless mode, so no image library is needed.
//
// Sizes follow docs/design/DESKTOP.md: 256, 48 and 32 px come from the full
// master, while 24 and 16 px use the simplified small master, which stays legible.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ICONS = new URL('../src-tauri/icons/', import.meta.url);
const source = name => readFileSync(new URL(`source/${name}.svg`, ICONS));
const out = name => new URL(name, ICONS);

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const browser = BROWSERS.find(path => existsSync(path));
if (!browser) throw new Error('Chrome or Edge not found; set CHROME_PATH.');

const port = 9500 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), 'musicgame-icons-'));
const child = spawn(browser, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let targets;
for (let i = 0; i < 120 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(250); }
}
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve));
let id = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  pending.get(message.id)?.(message);
  pending.delete(message.id);
});
const send = (method, params = {}) => new Promise(resolve => {
  pending.set(++id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

/** A PNG of the SVG at size × size pixels, with a transparent background. */
async function render(svg, size) {
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  const img = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const html = `<html><body style="margin:0;background:transparent"><img src="${img}" width="${size}" height="${size}" style="display:block"></body></html>`;
  await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await sleep(150);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } });
  return Buffer.from(shot.result.data, 'base64');
}

// An .ico holding PNG images, which Windows reads at every size.
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(image => image.png)]);
}

const master = source('app');
const small = source('app-small');
const icoImages = [];
for (const size of [256, 48, 32]) icoImages.push({ size, png: await render(master, size) });
for (const size of [24, 16]) icoImages.push({ size, png: await render(small, size) });
writeFileSync(out('icon.ico'), ico(icoImages));
writeFileSync(out('icon.png'), await render(master, 512));
writeFileSync(out('128x128@2x.png'), await render(master, 256));
writeFileSync(out('128x128.png'), await render(master, 128));
writeFileSync(out('32x32.png'), await render(master, 32));
for (const theme of ['dark', 'light']) {
  for (const size of [16, 20, 24, 32]) writeFileSync(out(`tray-${theme}-${size}.png`), await render(source(`tray-${theme}`), size));
}

socket.close();
const exited = new Promise(resolve => child.once('exit', resolve));
child.kill();
await exited;
// Chrome can hold its profile files for a moment after exiting.
try { rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch { /* left in the temp folder */ }
console.log('Rendered app and tray icons into src-tauri/icons/.');
