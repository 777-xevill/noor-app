// Makes the Google Play graphics in store/graphics/: the 512 px icon, the 1024×500 feature graphic and phone
// screenshots (1080×1920, in English and Bangla) from a web export of the app's demo mode.
//   EXPO_NO_DOTENV=1 EXPO_PUBLIC_DEMO_DATA=1 npx expo export -p web --output-dir <dir>
//   node scripts/brand/render-store-graphics.mjs <dir>
// Uses Microsoft Edge or Chrome through puppeteer-core; set BROWSER to override the path.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = join(import.meta.dirname, '..', '..');
const out = join(root, 'store', 'graphics');
mkdirSync(out, { recursive: true });
const dist = process.argv[2];
if (!dist) {
  console.error('Usage: node scripts/brand/render-store-graphics.mjs <web export dir>');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  let file = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(8124);

const BROWSER =
  process.env.BROWSER ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Icon: the app icon at Play's size.
const iconData = readFileSync(join(root, 'assets', 'icon.png')).toString('base64');
await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0"><img src="data:image/png;base64,${iconData}" style="width:512px;height:512px;display:block"></body>`);
await page.screenshot({ path: join(out, 'icon-512.png') });

// Screenshots: 9:16, the shape Play accepts without letterboxing.
await page.setViewport({ width: 432, height: 768, deviceScaleFactor: 2.5 });
await page.goto('http://localhost:8124/', { waitUntil: 'networkidle2', timeout: 60000 });
await wait(2500);
const SCREENS = [['01-home', '/'], ['02-prayers', '/prayers'], ['03-quran', '/quran/1'], ['04-duas', '/duas'], ['05-tracker', '/tracker'], ['06-explore', '/explore']];
for (const lang of ['en', 'bn']) {
  await page.evaluate((language) => {
    const raw = localStorage.getItem('noor.settings');
    const v = raw ? JSON.parse(raw) : { state: {}, version: 2 };
    Object.assign(v.state, { language, onboarded: true, theme: 'light' });
    localStorage.setItem('noor.settings', JSON.stringify(v));
  }, lang);
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(3000);
  for (const [name, path] of SCREENS) {
    await page.evaluate((p) => {
      window.history.pushState({}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, path);
    await wait(2800);
    await page.screenshot({ path: join(out, `${lang}-${name}.png`) });
    const body = await page.evaluate(() => document.body.innerText);
    console.log(lang, name, /Unmatched Route|Something went wrong|This screen doesn/.test(body) ? 'CHECK' : 'ok');
  }
}
// Feature graphic: the mark and the app's promise, next to the Home screenshot just rendered.
const mark = readFileSync(join(root, 'assets', 'icon.png')).toString('base64');
const home = readFileSync(join(out, 'en-01-home.png')).toString('base64');
await page.goto('about:blank');
await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600&display=swap"></head>
<body style="margin:0;width:1024px;height:500px;overflow:hidden;background:linear-gradient(135deg,#F1F3F5 0%,#DDE2E7 100%);font-family:Geist,system-ui,sans-serif;color:#16181C;position:relative">
  <div style="position:absolute;left:72px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center">
    <img src="data:image/png;base64,${mark}" style="width:84px;height:84px;border-radius:20px;margin-bottom:22px">
    <div style="font-size:72px;font-weight:600;letter-spacing:-2px;line-height:1">Noor</div>
    <div style="font-size:29px;font-weight:500;line-height:1.3;margin-top:18px;color:#3C4149">Prayer times, the Quran in Bangla and English, Qibla and duas.</div>
  </div>
  <img src="data:image/png;base64,${home}" style="position:absolute;right:76px;top:44px;width:300px;border-radius:38px;box-shadow:0 24px 60px rgba(22,24,28,.28)">
</body></html>`, { waitUntil: 'networkidle0' });
await wait(500);
await page.screenshot({ path: join(out, 'feature-graphic-1024x500.png') });

await browser.close();
server.close();
