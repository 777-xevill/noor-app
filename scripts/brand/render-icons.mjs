// Renders every app icon and splash image from one drawing of the Noor mark: a pointed arch
// (the mishkat, the niche of Ayat an-Nur, 24:35) with a lamp glowing inside it.
//   node scripts/brand/render-icons.mjs
// Uses Microsoft Edge or Chrome through puppeteer-core; set BROWSER to override the path.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = (p) => join(root, 'assets', p);
const BROWSER =
  process.env.BROWSER ??
  (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : '/usr/bin/google-chrome');

// The mark on a 1024 grid, centred on (512, 512). `ink` is the arch and lamp colour.
function mark({ ink, glow = true }) {
  return `
    ${glow ? `<radialGradient id="glow" cx="512" cy="560" r="230" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${ink}" stop-opacity="0.34"/>
      <stop offset="0.55" stop-color="${ink}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${ink}" stop-opacity="0"/>
    </radialGradient>
    <circle cx="512" cy="560" r="230" fill="url(#glow)"/>` : ''}
    <path d="M318 800 V492 C318 362 408 272 512 196 C616 272 706 362 706 492 V800"
      fill="none" stroke="${ink}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="512" cy="560" r="50" fill="${ink}"/>`;
}

const svg = ({ size = 1024, bg, content, scale = 1 }) => `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#34383F"/><stop offset="1" stop-color="#15171A"/>
    </linearGradient>
  </defs>
  ${bg === 'graphite' ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${content}</g>
</svg>`;

const WHITE = '#FFFFFF';
const GRAPHITE = '#1B1D21';

const assets = [
  // iOS / store icon: full-bleed, no transparency.
  { file: 'icon.png', size: 1024, svg: svg({ bg: 'graphite', content: mark({ ink: WHITE }), scale: 0.86 }) },
  // Android adaptive icon: the launcher masks to a circle or squircle, so keep the mark in the safe zone.
  { file: 'android-icon-foreground.png', size: 1024, svg: svg({ content: mark({ ink: WHITE }), scale: 0.6 }), transparent: true },
  { file: 'android-icon-background.png', size: 1024, svg: svg({ bg: 'graphite', content: '' }) },
  { file: 'android-icon-monochrome.png', size: 1024, svg: svg({ content: mark({ ink: WHITE, glow: false }), scale: 0.6 }), transparent: true },
  // Splash: the mark alone, dark on the light canvas and white on the dark one.
  { file: 'splash-icon.png', size: 1024, svg: svg({ content: mark({ ink: GRAPHITE, glow: false }), scale: 0.9 }), transparent: true },
  { file: 'splash-icon-dark.png', size: 1024, svg: svg({ content: mark({ ink: WHITE }), scale: 0.9 }), transparent: true },
  { file: 'favicon.png', size: 48, svg: svg({ size: 48, bg: 'graphite', content: mark({ ink: WHITE, glow: false }), scale: 0.9 }) },
  // Vector source for the website and store artwork.
  { file: 'brand/noor-mark.svg', svgOnly: true, svg: svg({ bg: 'graphite', content: mark({ ink: WHITE }), scale: 0.86 }) },
];

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true });
const page = await browser.newPage();
for (const a of assets) {
  mkdirSync(dirname(out(a.file)), { recursive: true });
  if (a.svgOnly) {
    writeFileSync(out(a.file), a.svg);
  } else {
    await page.setViewport({ width: a.size, height: a.size, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:transparent">${a.svg.replace(/^<\?xml[^>]*>/, '')}</body></html>`);
    await page.screenshot({ path: out(a.file), omitBackground: !!a.transparent, clip: { x: 0, y: 0, width: a.size, height: a.size } });
  }
  console.log('wrote', a.file);
}
await browser.close();
