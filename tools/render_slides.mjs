// Renders every render/queue/<post>/<n>.html that has no image yet to
// site/media/ig/<post>-<n>.jpg (1080x1350, JPEG q92). A slide must add class
// "ready" to <body> once its fonts and images have loaded; a slide that never
// gets ready, or renders at the wrong size, fails the run and is listed in
// render/status.json so nothing half-rendered is ever published.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const QUEUE = 'render/queue';
const OUT = 'site/media/ig';
fs.mkdirSync(OUT, { recursive: true });
const status = { at: new Date().toISOString(), rendered: [], skipped: [], failed: [] };
const posts = fs.existsSync(QUEUE) ? fs.readdirSync(QUEUE).filter((d) => fs.statSync(path.join(QUEUE, d)).isDirectory()) : [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const post of posts.sort()) {
  if (!/^[a-z0-9_][a-z0-9-]*$/.test(post)) { status.failed.push({ post, error: 'bad folder name' }); continue; }
  const files = fs.readdirSync(path.join(QUEUE, post)).filter((f) => /^\d+\.html$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
  for (const f of files) {
    const n = parseInt(f);
    const out = path.join(OUT, `${post}-${n}.jpg`);
    if (fs.existsSync(out)) { status.skipped.push(out); continue; }
    try {
      await page.goto('file://' + path.resolve(QUEUE, post, f), { waitUntil: 'load', timeout: 60000 });
      await page.waitForSelector('body.ready', { timeout: 45000 });
      const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
      if (size[0] !== 1080 || size[1] !== 1350) throw new Error(`page is ${size[0]}x${size[1]}, expected 1080x1350`);
      const broken = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
      if (broken.length) throw new Error('image did not load: ' + broken.join(', '));
      await page.screenshot({ path: out, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      status.rendered.push(out);
    } catch (e) {
      status.failed.push({ post, slide: n, error: String(e.message || e).slice(0, 300) });
    }
  }
}
await browser.close();
fs.writeFileSync('render/status.json', JSON.stringify(status, null, 1) + '\n');
console.log(JSON.stringify(status, null, 1));
if (status.failed.length) process.exitCode = 1;
