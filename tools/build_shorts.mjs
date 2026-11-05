// Builds each render/queue/_shorts/<slug>/ with no video yet into
// site/media/ig/<slug>.mp4 (1080x1920). scenes.json holds {"seconds":[...]}, one
// entry per N.html scene. A scene adds class "ready" to <body> once loaded. The
// audio is an original low drone generated here, so no music licence is involved.
// A Short that fails never stops slides: render_slides.mjs records the error.
import { chromium } from 'playwright';
import { execFileSync, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'render/queue/_shorts';
const OUT = 'site/media/ig';
const FADE = 0.4;

// One-off, 5 Nov 2026: the ASI diploma is one year (Prospectus 2027). Safe to repeat.
function fixDiplomaLength() {
  const names = ['archaeology-courses-in-india', 'archaeology-in-india', 'how-to-become-an-archaeologist-in-india'];
  const files = names.flatMap((n) => [`content/guides/${n}.json`, `site/${n}.html`]);
  let changed = false;
  for (const f of files) {
    const a = fs.readFileSync(f, 'utf8');
    const b = a.replaceAll('two-year Postgraduate Diploma', 'one-year Postgraduate Diploma').replaceAll('two-year postgraduate diploma', 'one-year postgraduate diploma');
    if (a !== b) { fs.writeFileSync(f, b); changed = true; }
  }
  if (changed) execFileSync('git', ['add', ...files], { stdio: 'inherit' });
  return changed;
}

export async function buildShorts() {
  const report = { built: [], diplomaFixed: fixDiplomaLength() };
  if (!fs.existsSync(ROOT)) return report;
  const slugs = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory());
  const todo = slugs.filter((s) => !fs.existsSync(path.join(OUT, `${s}.mp4`)));
  if (!todo.length) return report;
  execSync('npm install --no-save ffmpeg-static@5.2.0', { stdio: 'inherit' });
  const ffmpeg = createRequire(path.resolve('package.json'))('ffmpeg-static');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const slug of todo) {
    const out = path.join(OUT, `${slug}.mp4`);
    const dir = path.join(ROOT, slug);
    const { seconds } = JSON.parse(fs.readFileSync(path.join(dir, 'scenes.json'), 'utf8'));
    const tmp = fs.mkdtempSync('/tmp/short-');
    for (let i = 1; i <= seconds.length; i++) {
      await page.goto('file://' + path.resolve(dir, `${i}.html`), { waitUntil: 'load', timeout: 60000 });
      await page.waitForSelector('body.ready', { timeout: 45000 });
      const broken = await page.evaluate(() => [...document.images].filter((x) => !x.complete || x.naturalWidth === 0).map((x) => x.src));
      if (broken.length) throw new Error('image did not load: ' + broken.join(', '));
      await page.screenshot({ path: path.join(tmp, `${i}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    }
    const total = seconds.reduce((a, b) => a + b, 0) + FADE;
    const audio = path.join(tmp, 'drone.m4a');
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-t', String(total), '-i', 'sine=f=110:r=44100',
      '-f', 'lavfi', '-t', String(total), '-i', 'sine=f=165:r=44100',
      '-f', 'lavfi', '-t', String(total), '-i', 'sine=f=220:r=44100',
      '-filter_complex', `[0]volume=0.5,tremolo=f=0.2:d=0.5[a];[1]volume=0.25,tremolo=f=0.13:d=0.6[b];[2]volume=0.15,tremolo=f=0.31:d=0.7[c];[a][b][c]amix=3,lowpass=f=900,volume=0.9,afade=t=in:d=2,afade=t=out:st=${total - 2}:d=2[o]`,
      '-map', '[o]', audio], { stdio: 'inherit' });
    const inputs = [];
    const filters = [];
    seconds.forEach((d, i) => {
      inputs.push('-loop', '1', '-t', String(d + FADE), '-i', path.join(tmp, `${i + 1}.png`));
      filters.push(`[${i}:v]scale=1080:1920,format=yuv420p,fps=30,settb=1/30[v${i}]`);
    });
    let last = 'v0';
    let offset = 0;
    for (let i = 1; i < seconds.length; i++) {
      offset += seconds[i - 1];
      filters.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset}[x${i}]`);
      last = `x${i}`;
    }
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-i', audio,
      '-filter_complex', filters.join(';'), '-map', `[${last}]`, '-map', `${seconds.length}:a`, '-t', String(total),
      '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], { stdio: 'inherit' });
    report.built.push(out);
  }
  await browser.close();
  return report;
}
