#!/usr/bin/env node
// Dev file server. Usage: node tools/serve.mjs [folder] [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(root, process.argv[2] || '.');
const port = Number(process.argv[3] || 8000);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if(p.endsWith('/')) p += 'index.html';
  const file = path.join(dir, path.normalize(p));
  if(!file.startsWith(dir)){ res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if(err){ res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(data);
  });
}).listen(port, () => console.log(`Serving ${path.relative(process.cwd(), dir) || '.'} at http://localhost:${port}`));
