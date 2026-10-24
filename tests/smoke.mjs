#!/usr/bin/env node
// End-to-end smoke test (Playwright + Chromium):
//   node tests/smoke.mjs [--shots dir]
// Loads index.html, plays the first loop (intro, login gift, spawn, merge, plant, harvest, deliver),
// opens every tab, runs a blindbox, switches language, and fails on any console / page error.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT } from '../tools/load.mjs';

// Playwright is resolved with require() so a globally installed copy (NODE_PATH) also works.
const { chromium } = createRequire(import.meta.url)('playwright');

const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? path.resolve(args[args.indexOf('--shots') + 1] || 'shots') : null;
const page404 = [];
const errors = [];

const launch = { };
if (process.env.HTTPS_PROXY) launch.proxy = { server: process.env.HTTPS_PROXY };
const browser = await chromium.launch(launch);
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false, locale: 'vi-VN' });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => page404.push(r.url() + ' ' + (r.failure() && r.failure().errorText)));

let n = 0;
async function shot(name) {
  if (!shotsDir) return;
  fs.mkdirSync(shotsDir, { recursive: true });
  n += 1;
  await page.screenshot({ path: path.join(shotsDir, String(n).padStart(2, '0') + '-' + name + '.png') });
}
const step = async (label, fn) => {
  try { await fn(); console.log('✓', label); } catch (e) { errors.push(label + ': ' + e.message); console.log('✗', label, e.message); }
};
const center = async (sel) => {
  const b = await page.locator(sel).first().boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
async function dragTo(fromSel, toSel) {
  const a = await center(fromSel), b = await center(toSel);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8);
  await page.waitForTimeout(80);
  await page.mouse.up();
}

await page.goto('file://' + path.join(ROOT, 'index.html'));
// Real-time sky events (rainbow after rain, full moon...) can pop a "secret found" dialog at any moment;
// pin the sky so the scripted run is deterministic.
await page.evaluate(() => { NOA.state.dev.force = { weather: 'sunny', rainbow: false, night: false, fullMoon: false, meteor: false }; });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

await step('fonts with Vietnamese glyphs', async () => {
  const ok = await page.evaluate(async () => {
    const sample = 'Thức tỉnh gen Nguyệt Quang ẩn ỗ ữ ặ';
    await Promise.all(['800 20px "Baloo 2"', '700 16px Nunito', '20px Coiny'].map((f) => document.fonts.load(f, sample)));
    return ['800 20px "Baloo 2"', '700 16px Nunito', '20px Coiny'].map((f) => document.fonts.check(f, sample));
  });
  if (ok.some((x) => !x)) throw new Error('font check failed ' + JSON.stringify(ok));
});

await shot('intro');
await step('intro → start', async () => {
  for (let i = 0; i < 5; i++) await page.locator('.intro-actions .btn').last().click();
  await shot('intro-last');
  await page.locator('.intro-actions .btn').last().click();
  await page.waitForTimeout(500);
});
await step('daily login claim', async () => {
  await page.waitForSelector('.modal', { timeout: 3000 });
  await shot('login');
  await page.locator('.modal-actions .btn').first().click();
  await page.waitForTimeout(400);
});
await shot('farm');

await step('spawn two seeds', async () => {
  await page.locator('#gen-seedSack').click();
  await page.waitForTimeout(250);
  await page.locator('#gen-seedSack').click();
  await page.waitForTimeout(700);
});
await step('merge two identical seeds', async () => {
  const idx = await page.evaluate(() => NOA.state.board.map((it, i) => (it && it.kind === 'seed' ? i : -1)).filter((i) => i >= 0));
  if (idx.length < 2) throw new Error('need 2 seeds, have ' + idx.length);
  await dragTo(`.cell[data-index="${idx[0]}"] .art`, `.cell[data-index="${idx[1]}"]`);
  await page.waitForTimeout(300);
  await shot('merged');
  const lv = await page.evaluate((i) => NOA.state.board[i] && NOA.state.board[i].level, idx[1]);
  if (!(lv >= 2)) throw new Error('merge did not level up');
  await page.waitForTimeout(500);
});
await step('item sheet', async () => {
  const i = await page.evaluate(() => NOA.state.board.findIndex((it) => it && it.kind === 'seed'));
  await page.locator(`.cell[data-index="${i}"] .art`).click();
  await page.waitForSelector('.sheet');
  await shot('sheet');
  await page.locator('.sheet .sh-x').click();
});
await step('plant + harvest', async () => {
  const i = await page.evaluate(() => NOA.state.board.findIndex((it) => it && it.kind === 'seed'));
  await dragTo(`.cell[data-index="${i}"] .art`, '[data-drop="plot"][data-index="0"]');
  await page.waitForTimeout(300);
  const planted = await page.evaluate(() => !!NOA.state.plots[0].seed);
  if (!planted) throw new Error('not planted');
  await shot('planted');
  await page.evaluate(() => { NOA.state.dev.offsetMs += 10 * 60 * 1000; });
  await page.waitForTimeout(600);
  await page.locator('[data-drop="plot"][data-index="0"]').click();
  await page.waitForTimeout(700);
  const prods = await page.evaluate(() => NOA.state.board.filter((it) => it && it.kind === 'product').length);
  if (!prods) throw new Error('no produce');
  await shot('harvested');
});
await step('tutorial order deliverable from the first harvest', async () => {
  const ok = await page.evaluate(() => {
    const o = NOA.state.orders.find((x) => x.lines.length === 1 && x.lines[0].product === 'rice_1');
    return !!o && NOA.orders.canDeliver(o);
  });
  if (!ok) throw new Error('no deliverable rice order after harvest');
  await page.locator('.order.ready .btn').first().click();
  await page.waitForTimeout(800);
  const step = await page.evaluate(() => NOA.ui.story.current() && NOA.ui.story.current().id);
  if (step !== 'animal') throw new Error('tutorial did not reach the animal step, at ' + step);
});
await step('deliver an order (dev items)', async () => {
  await page.evaluate(() => {
    const o = NOA.state.orders[0];
    for (const l of o.lines) for (let k = 0; k < l.count; k++) NOA.board.placeOrStore(NOA.items.newProduct(l.product, Math.max(1, l.minStars || 1), l.needGene ? { id: 'solar', purity: 1 } : null), null);
  });
  await page.waitForTimeout(300);
  await page.locator('.order.ready .btn').first().click();
  await page.waitForTimeout(500);
  await shot('delivered');
});
await step('gene awakening cinematic', async () => {
  await page.evaluate(() => {
    const a = NOA.items.newBreed('tomato', 2, { gene: { id: 'lunar', purity: 2 } });
    NOA.ui.fx.awaken(a, 'awaken');
  });
  await page.waitForSelector('.awaken');
  await page.waitForTimeout(900);
  await shot('awaken');
  await page.locator('.awaken').click();
  await page.waitForTimeout(500);
});

for (const tab of ['labs', 'gacha', 'shop', 'codex']) {
  await step('tab ' + tab, async () => {
    await page.evaluate((t) => NOA.ui.show(t), tab);
    await page.waitForTimeout(300);
    await shot('tab-' + tab);
  });
}
await step('blindbox ×1', async () => {
  await page.evaluate(() => { NOA.res.add('coins', 5000); NOA.state.level = Math.max(NOA.state.level, 2); NOA.ui.show('gacha'); });
  await page.waitForTimeout(200);
  await page.locator('.box-card .btn').first().click();
  await page.waitForSelector('.gstage');
  await shot('box-closed');
  await page.locator('.gstage').click({ position: { x: 195, y: 420 } });
  await page.waitForTimeout(1100);
  await shot('box-shaking');
  await page.waitForTimeout(2400);
  await shot('box-revealed');
  await page.locator('.gs-actions .btn').last().click();
  await page.waitForTimeout(400);
});
await step('blindbox ×10', async () => {
  await page.evaluate(() => { NOA.res.add('gems', 2000); NOA.state.level = Math.max(NOA.state.level, 6); NOA.ui.show('gacha'); });
  await page.waitForTimeout(200);
  await page.locator('.box-card').nth(1).locator('.btn').nth(1).click();
  await page.waitForSelector('.gstage');
  await page.locator('.gstage').click({ position: { x: 195, y: 420 } });
  await page.waitForTimeout(6500);
  await shot('box-x10');
  await page.locator('.gs-actions .btn').last().click();
  await page.waitForTimeout(400);
});
await step('codex secrets + story', async () => {
  await page.evaluate(() => { NOA.ui.show('codex'); NOA.ui.screens.codex.tab('secrets'); });
  await page.waitForTimeout(200);
  await shot('codex-secrets');
  await page.evaluate(() => NOA.ui.screens.codex.tab('story'));
  await page.waitForTimeout(200);
  await shot('codex-story');
});
await step('settings + dev panel', async () => {
  await page.evaluate(() => NOA.ui.settings.open());
  await page.waitForSelector('.modal');
  await shot('settings');
  await page.evaluate(() => NOA.ui.closeTopModal());
  await page.waitForTimeout(250);
  await page.evaluate(() => NOA.ui.settings.dev());
  await page.waitForTimeout(250);
  await shot('dev');
  await page.evaluate(() => NOA.ui.closeTopModal());
  await page.waitForTimeout(250);
});
await step('english', async () => {
  await page.evaluate(() => { NOA.i18n.setLang('en'); NOA.ui.show('farm'); });
  await page.waitForTimeout(400);
  await shot('farm-en');
});
await step('night + meteor + full moon sky', async () => {
  await page.evaluate(() => { NOA.state.dev.force = { night: true, fullMoon: true, meteor: true, weather: 'storm' }; NOA.ui.hud.updateSky(); NOA.ui.hud.spawnMeteor(); });
  await page.waitForTimeout(500);
  await shot('night');
});
await step('payment (disabled) path', async () => {
  const r = await page.evaluate(() => NOA.payment.purchase('gems_60'));
  if (r.ok || r.code !== 'disabled') throw new Error('expected disabled, got ' + JSON.stringify(r));
  const r2 = await page.evaluate(async () => { NOA.state.dev.payProvider = 'mock'; const before = NOA.state.res.gems; const x = await NOA.payment.purchase('gems_60'); return { x, gained: NOA.state.res.gems - before }; });
  if (!r2.x.ok || !r2.x.granted.some((g) => g.key === 'res.gems' && g.n === 60)) throw new Error('mock purchase failed ' + JSON.stringify(r2));
});

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
if (overflow) errors.push('horizontal overflow at 390px');

await browser.close();
const fontFails = page404.filter((u) => /fonts\.(googleapis|gstatic)/.test(u));
if (fontFails.length) console.log('⚠️ font requests failed (network):', fontFails.slice(0, 3));
if (errors.length) {
  console.log('\nFAILED:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('\nAll smoke steps passed.');
