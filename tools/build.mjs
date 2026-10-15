#!/usr/bin/env node
// build.mjs
// Makes the release version of the game:
//   - joins src/ (ES modules) into one normal script (game.js)
//   - joins css/ into one style.css (fonts are embedded inside)
//   - makes the service worker (sw.js) and the zip package
// No outside library needed. Node 18+ only.
//
//   node tools/build.mjs                  -> dist/ and release/cireep-html5.zip (index.html at the zip root)
//   node tools/build.mjs --out DIR        -> use another output folder
//   node tools/build.mjs --no-zip         -> do not make the zip
//   node tools/build.mjs --hook FILE.js   -> add extra code at the end of the bundle (for testing)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const outDir = path.resolve(root, opt('--out') || 'dist');
const hookFile = opt('--hook');
const wantZip = !argv.includes('--no-zip');

const ENTRY = 'src/main.js';
// Files and folders copied as they are. CSS is not here: it is joined in step 3.
const STATIC_FILES = ['manifest.webmanifest'];
const STATIC_DIRS = ['fonts', 'img'];

// ---------- 1. Read the modules and find which module imports which ----------
const IMPORT_RE = /^import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"];?[ \t]*\r?\n/gm;
const modules = new Map();

function fail(file, msg){ console.error(`Error in ${file}: ${msg}`); process.exit(1); }

function load(rel){
  if(modules.has(rel)) return;
  const file = path.join(root, rel);
  if(!fs.existsSync(file)) fail(rel, 'file does not exist');
  const src = fs.readFileSync(file, 'utf8');
  if(/^\s*import\s+(?!\{)/m.test(src) || /^\s*export\s+default\b/m.test(src) || /^\s*export\s*[{*]/m.test(src) || /\bimport\s*\(/.test(src)){
    fail(rel, 'only `import { a } from ...` and `export function/const/let/var` are supported');
  }
  const deps = [];
  const code = src.replace(IMPORT_RE, (_, names, from) => {
    if(!from.startsWith('.')) fail(rel, `import from outside the project: ${from}`);
    deps.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), from)));
    return '';
  });
  modules.set(rel, { rel, code, deps });
  deps.forEach(load);
}
load(ENTRY);

// Order = depth-first by import order. This is the same order ES modules run in.
const order = []; const seen = new Set();
(function visit(rel){ if(seen.has(rel)) return; seen.add(rel); modules.get(rel).deps.forEach(visit); order.push(rel); })(ENTRY);

// ---------- 2. Join into one scope: check for duplicate names ----------
const DECL_RE = /^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|var)\s+([\w$]+))/gm;
const owner = new Map();
const parts = order.map(rel => {
  const { code } = modules.get(rel);
  let m; DECL_RE.lastIndex = 0;
  while((m = DECL_RE.exec(code))){
    const name = m[1] || m[2];
    if(owner.has(name)) fail(rel, `name "${name}" is already used in ${owner.get(name)} (all modules share one scope)`);
    owner.set(name, rel);
  }
  const body = code.replace(/^export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\b)/gm, '').replace(/\s+$/, '');
  return `// ===== ${rel} =====\n${body}\n`;
});
let bundle = `(function(){\n'use strict';\n\n${parts.join('\n')}`;
if(hookFile) bundle += `\n// ===== hook =====\n${fs.readFileSync(path.resolve(hookFile), 'utf8')}\n`;
bundle += '})();\n';

// ---------- 3. Write dist: index.html, game.js, style.css and static files ----------
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'game.js'), bundle);

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const TAG = '<script type="module" src="src/main.js"></script>';
if(!html.includes(TAG)) fail('index.html', `${TAG} not found`);
html = html.replace(TAG, '<script>window.CIREEP_SW = "sw.js";</script>\n<script src="game.js"></script>');

STATIC_FILES.forEach(f => fs.copyFileSync(path.join(root, f), path.join(outDir, f)));
STATIC_DIRS.forEach(d => fs.cpSync(path.join(root, d), path.join(outDir, d), { recursive: true }));

// Join all CSS files linked in index.html (same order) into one style.css.
// WOFF fonts are embedded as data URI. There is no extra request, so the fonts still work
// when the game runs in a sandboxed iframe without same-origin (CORS blocks font files).
const CSS_LINK_RE = /[ \t]*<link rel="stylesheet" href="(css\/[^"]+\.css)">[ \t]*\r?\n/g;
const cssFiles = [...html.matchAll(CSS_LINK_RE)].map(m => m[1]);
if(!cssFiles.length) fail('index.html', 'no <link rel="stylesheet" href="css/..."> tag found');
const cssBundle = cssFiles.map(rel => {
  const css = fs.readFileSync(path.join(root, rel), 'utf8').replace(/url\("\.\.\/(fonts\/[^"]+\.woff)"\)/g, (_, fontRel) => {
    const data = fs.readFileSync(path.join(root, fontRel)).toString('base64');
    fs.rmSync(path.join(outDir, fontRel), { force: true }); // The font is inside the CSS now, so remove the copy
    return `url(data:font/woff;base64,${data})`;
  });
  return `/* ===== ${rel} ===== */\n${css.trim()}\n`;
}).join('\n');
fs.writeFileSync(path.join(outDir, 'style.css'), cssBundle);
// Keep one <link> for style.css (at the place of the first CSS link) and remove the others
let firstCssLink = true;
html = html.replace(CSS_LINK_RE, () => { if(!firstCssLink) return ''; firstCssLink = false; return '<link rel="stylesheet" href="style.css">\n'; });
fs.writeFileSync(path.join(outDir, 'index.html'), html);

// ---------- 4. Service worker: the file list and version are made automatically ----------
function walk(dir, base = ''){
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name), base + e.name + '/') : [base + e.name]);
}
const files = walk(outDir).sort();
const hash = crypto.createHash('sha1');
files.forEach(f => { hash.update(f); hash.update(fs.readFileSync(path.join(outDir, f))); });
hash.update(fs.readFileSync(path.join(root, 'tools/sw.template.js')));
const version = 'cireep-' + hash.digest('hex').slice(0, 10);
const core = ['./', ...files];
const sw = fs.readFileSync(path.join(root, 'tools/sw.template.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__CORE__', JSON.stringify(core, null, 2));
fs.writeFileSync(path.join(outDir, 'sw.js'), sw);
const all = [...files, 'sw.js'].sort();

// ---------- 5. Zip (index.html at the root, as itch.io needs) ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xFFFFFFFF; for(const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(entries){
  const DOS_TIME = 0, DOS_DATE = ((2025 - 1980) << 9) | (1 << 5) | 1; // Fixed date, so every build gives the same zip
  const locals = [], centrals = []; let offset = 0;
  for(const { name, data } of entries){
    const nameBuf = Buffer.from(name, 'utf8'), comp = zlib.deflateRawSync(data, { level: 9 }), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(DOS_TIME, 10); lh.writeUInt16LE(DOS_DATE, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26);
    locals.push(lh, nameBuf, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(DOS_TIME, 12); ch.writeUInt16LE(DOS_DATE, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
let zipInfo = '';
if(wantZip){
  const zipPath = path.join(root, 'release', 'cireep-html5.zip');
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  const buf = zip(all.map(name => ({ name, data: fs.readFileSync(path.join(outDir, name)) })));
  fs.writeFileSync(zipPath, buf);
  zipInfo = ` | zip: ${path.relative(root, zipPath)} (${(buf.length / 1024).toFixed(0)} KB)`;
}
console.log(`Build done: ${order.length} modules -> ${path.relative(root, outDir)}/game.js (${(bundle.length / 1024).toFixed(0)} KB) | ${all.length} files | ${version}${zipInfo}`);
