// Builds a self-contained web preview of the app (with sample data) that can be hosted under any path.
//   node scripts/build-preview.mjs
// Output: dist-preview/ (web export) + preview/index.html (host page) + preview/files.json (publish map).
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist-preview');
const out = join(root, 'preview');

execSync('npx expo export -p web --output-dir dist-preview', {
  cwd: root,
  stdio: 'inherit',
  // Secrets from .env.local must never reach the public preview; an empty variable wins over .env files.
  env: { ...process.env, EXPO_PUBLIC_DEMO_DATA: '1', EXPO_PUBLIC_GROQ_API_KEY: '' },
});

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(dist).filter((p) => !/[\\/](index\.html|favicon\.ico|metadata\.json)$/.test(p));
const bundle = files.find((p) => p.includes(`${sep}_expo${sep}`) && p.endsWith('.js'));
if (!bundle) throw new Error('No web bundle found in dist-preview');

// Asset URLs are root-absolute ("/assets/..."); make them relative so they resolve next to the page.
const code = readFileSync(bundle, 'utf8').replaceAll('"/assets/', '"assets/');
writeFileSync(bundle, code);

// The preview host reserves top-level names starting with "_", so publish the bundle under js/.
const bundlePath = `js/${bundle.split(sep).pop()}`;
const host = readFileSync(join(root, 'scripts', 'preview-host.html'), 'utf8').replace('__BUNDLE__', bundlePath);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), host);
// Local check: serve the project root and open /dist-preview/host.html (a sub-path, like the real host).
// The real host adds its own viewport meta; the local copy needs one to render at phone width.
const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
writeFileSync(join(dist, 'host.html'), viewport + host);
mkdirSync(join(dist, 'js'), { recursive: true });
writeFileSync(join(dist, bundlePath), code);

// Publish map, relative to dist-preview (use it as the publish root). Data assets use a custom
// extension, so they're declared as JSON explicitly.
const map = Object.fromEntries(
  files.map((p) => {
    const rel = relative(dist, p).split(sep).join('/');
    const key = p === bundle ? bundlePath : rel;
    const from = p === bundle ? bundlePath : rel;
    return [key, rel.endsWith('.qdata') ? { from, contentType: 'application/json' } : from];
  }),
);
writeFileSync(join(out, 'files.json'), JSON.stringify(map, null, 2));
console.log(`Preview ready: ${Object.keys(map).length} files, bundle ${bundlePath}`);
