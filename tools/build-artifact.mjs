#!/usr/bin/env node
// Bundles index.html + css/ + config/ + i18n/ + js/ into single files:
//   dist/noa-farm.html             page fragment for a claude.ai Artifact (no <html>/<head>/<body>)
//   dist/noa-farm-standalone.html  full single-file page (open by double-click / share as one file)
// Usage: node tools/build-artifact.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './load.mjs';

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const title = (src.match(/<title>[\s\S]*?<\/title>/) || ['<title>Noa Farm</title>'])[0];
const metas = (src.match(/<meta name="(claude:viewport-fit-sides|description)"[^>]*>/g) || []).join('\n');
const fontLinks = (src.match(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts[^>]*>/g) || []).join('\n');
const css = [...src.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)">/g)]
  .map((m) => `/* ${m[1]} */\n` + read(m[1])).join('\n');
const scripts = [...src.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((rel) => `// ---- ${rel}\n` + read(rel).replace(/<\/script/gi, '<\\/script')).join('\n');

const body = `<div id="app" class="app"></div>
<script>
${js}
</script>`;

const fragment = `${title}
${metas}
${fontLinks}
<style>
${css}
</style>
${body}
`;

const standalone = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${title}
${metas}
${fontLinks}
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/noa-farm.html'), fragment);
fs.writeFileSync(path.join(ROOT, 'dist/noa-farm-standalone.html'), standalone);
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log(`dist/noa-farm.html (${kb(fragment)}) · dist/noa-farm-standalone.html (${kb(standalone)}) · ${scripts.length} scripts inlined`);
