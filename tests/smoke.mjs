#!/usr/bin/env node
// End-to-end smoke test (Playwright + Chromium):
//   node tests/smoke.mjs [--shots dir]
// Loads index.html and plays the v2 loop on the farm map: intro, daily gift, plant from the seed
// picker, harvest (tap + ✂️ swipe), merge in the seed vault, deliver an order, put a chick in the
// coop, feed + collect, run the mill, fill the bee-ship, sell from the barn, open blindboxes,
// visit every screen, switch language — and fails on any console / page error or raw i18n key.
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

const launch = {};
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
  if (!b) throw new Error('not visible: ' + sel);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
async function dragTo(fromSel, toSel) {
  const a = await center(fromSel), b = await center(toSel);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(a.x + (b.x - a.x) * i / 10, a.y + (b.y - a.y) * i / 10);
  await page.waitForTimeout(80);
  await page.mouse.up();
}
const ev = (fn, arg) => page.evaluate(fn, arg);
const tutStep = () => ev(() => (NOA.ui.story.current() || { id: 'done' }).id);
/** Bring a map element into the viewport, then click it */
async function tapMap(sel) {
  await ev((s) => NOA.ui.screens.farm.reveal(document.querySelector(s)), sel);
  await page.waitForTimeout(550);
  await page.locator(sel).click();
}
const finishAll = () => ev(() => NOA.ui.settings.finishAll());
const closeModals = async () => { for (let i = 0; i < 4; i++) { if (!(await ev(() => NOA.ui.hasModal()))) break; await ev(() => NOA.ui.closeTopModal()); await page.waitForTimeout(250); } };

await page.goto('file://' + path.join(ROOT, 'index.html'));
// Real-time sky events (rainbow after rain, full moon...) can pop a "secret found" dialog at any moment;
// pin the sky so the scripted run is deterministic.
await ev(() => { NOA.state.dev.force = { weather: 'sunny', rainbow: false, night: false, fullMoon: false, meteor: false }; });
await ev(() => document.fonts.ready);
await page.waitForTimeout(400);

await step('fonts with Vietnamese glyphs', async () => {
  const ok = await ev(async () => {
    const sample = 'Thức tỉnh gen Nguyệt Quang ẩn ỗ ữ ặ';
    await Promise.all(['800 20px "Baloo 2"', '700 16px Nunito', '20px Coiny'].map((f) => document.fonts.load(f, sample)));
    return ['800 20px "Baloo 2"', '700 16px Nunito', '20px Coiny'].map((f) => document.fonts.check(f, sample));
  });
  if (ok.some((x) => !x)) throw new Error('font check failed ' + JSON.stringify(ok));
});

await shot('intro');
await step('intro → start', async () => {
  for (let i = 0; i < 5; i++) await page.locator('.intro-actions .btn').last().click();
  await page.locator('.intro-actions .btn').last().click();
  await page.waitForTimeout(500);
});
await step('daily login claim', async () => {
  await page.waitForSelector('.modal', { timeout: 3000 });
  await shot('login');
  await page.locator('.modal-actions .btn').first().click();
  await page.waitForTimeout(600);
});
await shot('farm-map');

await step('map has every zone, field and building', async () => {
  const c = await ev(() => ({ zones: document.querySelectorAll('.zone').length, plots: document.querySelectorAll('.plot').length, blds: document.querySelectorAll('.bld').length }));
  if (c.zones !== 7 || c.plots !== 18 || c.blds !== 18) throw new Error(JSON.stringify(c));
});

await step('plant from the seed picker (tutorial step 1)', async () => {
  if ((await tutStep()) !== 'plant') throw new Error('tutorial at ' + (await tutStep()));
  await tapMap('#plot-crop-0');
  await page.waitForSelector('.sheet .pick');
  await page.waitForTimeout(300);
  await shot('seed-picker');
  // the tip asks for rice: pick a rice seed
  const riceName = await ev(() => NOA.t('item.seedName', { species: NOA.t('species.rice') }));
  await page.locator(`.sheet .pick[title^="${riceName}"]`).first().click();
  await page.waitForTimeout(400);
  const planted = await ev(() => NOA.state.fields.crop[0].seed && NOA.state.fields.crop[0].seed.species);
  if (planted !== 'rice') throw new Error('rice not planted: ' + planted);
  // the picker moves on to the next empty field: plant two more for the swipe test
  for (let k = 0; k < 2; k++) {
    if (!(await page.locator('.sheet .pick').count())) break;
    await page.locator('.sheet .pick').first().click();
    await page.waitForTimeout(300);
  }
  await ev(() => NOA.ui.panels.closeSheet());
  await page.waitForTimeout(1200);
  await shot('planted');
  if ((await tutStep()) !== 'harvest') throw new Error('tutorial did not advance: ' + (await tutStep()));
});

await step('harvest: produce + straw + next-generation seeds', async () => {
  await finishAll();
  await page.waitForTimeout(400);
  const before = await ev(() => ({ rice: NOA.barn.count('rice_1'), straw: NOA.barn.count('straw'), seeds: NOA.grids.count('vault') + NOA.state.vault.pending.length }));
  await tapMap('#plot-crop-0');
  await page.waitForTimeout(1300);
  const after = await ev(() => ({ rice: NOA.barn.count('rice_1'), straw: NOA.barn.count('straw'), seeds: NOA.grids.count('vault') + NOA.state.vault.pending.length, empty: !NOA.state.fields.crop[0].seed }));
  if (!(after.rice > before.rice && after.straw > before.straw && after.seeds > before.seeds && after.empty)) throw new Error(JSON.stringify({ before, after }));
  await shot('harvested');
});

await step('✂️ swipe harvest across ripe fields', async () => {
  const ripe = await ev(() => NOA.state.fields.crop.map((p, i) => (p.seed && NOA.farm.isReady(p) ? i : -1)).filter((i) => i >= 0));
  if (ripe.length < 2) throw new Error('need 2 ripe fields, have ' + ripe.length);
  await ev((i) => NOA.ui.screens.farm.reveal(document.getElementById('plot-crop-' + i)), ripe[0]);
  await page.waitForTimeout(550);
  await dragTo('#plot-crop-' + ripe[0], '#plot-crop-' + ripe[1]);
  await page.waitForTimeout(500);
  const left = await ev((r) => r.filter((i) => NOA.state.fields.crop[i].seed).length, ripe);
  if (left) throw new Error(left + ' field(s) not harvested');
});

await step('merge two identical seeds in the greenhouse vault', async () => {
  await ev(() => { NOA.ui.show('farm'); });
  await tapMap('#bld-greenhouse');
  await page.waitForSelector('#scr-breed:not([hidden]) .mgrid');
  await shot('breed-vault');
  const pair = await ev(() => {
    const c = NOA.state.vault.cells;
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) if (NOA.items.canMerge(c[i], c[j])) return [i, j];
    return null;
  });
  if (!pair) throw new Error('no mergeable pair');
  const merges = await ev(() => NOA.state.stats.merges);
  await dragTo(`#scr-breed .cell[data-index="${pair[0]}"] .art`, `#scr-breed .cell[data-index="${pair[1]}"]`);
  await page.waitForTimeout(500);
  if ((await ev(() => NOA.state.stats.merges)) !== merges + 1) throw new Error('merge did not happen');
  await shot('merged');
  await closeModals();
  await page.locator('.awaken').click({ timeout: 300 }).catch(() => {});
});

await step('merge preview + item sheet', async () => {
  const i = await ev(() => NOA.state.vault.cells.findIndex((x) => x));
  await page.locator(`#scr-breed .cell[data-index="${i}"] .art`).click();
  await page.waitForSelector('.sheet .stats');
  await shot('item-sheet');
  await page.locator('.sheet .sh-x').click();
});

await step('deliver the tutorial order', async () => {
  await page.locator('#tabbar [data-tab="orders"]').click();
  await page.waitForTimeout(300);
  await shot('orders');
  const before = await ev(() => NOA.state.stats.orders);
  const btn = page.locator('#scr-orders .order.ready .btn--leaf').first();
  if (!(await btn.count())) throw new Error('no deliverable order');
  await btn.click();
  await page.waitForTimeout(600);
  if ((await ev(() => NOA.state.stats.orders)) !== before + 1) throw new Error('order not delivered');
});

await step('chick from the nursery into the coop', async () => {
  await page.locator('#tabbar [data-tab="breed"]').click();
  await page.waitForTimeout(250);
  await page.locator('#scr-breed .seg button').nth(1).click();
  await page.waitForTimeout(250);
  const i = await ev(() => NOA.state.nursery.cells.findIndex((x) => x && x.species === 'chicken'));
  if (i < 0) throw new Error('no chick');
  await page.locator(`#scr-breed .cell[data-index="${i}"] .art`).click();
  await page.waitForSelector('.sheet');
  await shot('nursery-sheet');
  await page.locator('.sheet .btn--leaf').first().click();
  await page.waitForTimeout(400);
  if (!(await ev(() => NOA.state.pens.coop.slots.some((s) => s && s.animal.species === 'chicken')))) throw new Error('chick not in coop');
});

await step('feed the coop, then collect eggs', async () => {
  await page.locator('#tabbar [data-tab="farm"]').click();
  await page.waitForTimeout(300);
  await ev(() => { if (NOA.barn.count('rice_1') < 2) NOA.barn.add('rice_1', 4, { force: true }); });
  await tapMap('#bld-coop');
  await page.waitForSelector('.sheet .slot-list');
  await shot('pen-panel');
  await page.locator('.sheet .sh-actions .btn').first().click();
  await page.waitForTimeout(400);
  if (!(await ev(() => NOA.state.pens.coop.slots.some((s) => s && s.end > 0)))) throw new Error('not fed');
  await ev(() => NOA.ui.panels.closeSheet());
  await finishAll();
  await page.waitForTimeout(400);
  await shot('pen-ready');
  const eggs = await ev(() => NOA.barn.count('chicken_1'));
  await tapMap('#bld-coop');
  await page.waitForTimeout(500);
  if (!((await ev(() => NOA.barn.count('chicken_1'))) > eggs)) throw new Error('no eggs collected');
});

await step('mill: make fragrant rice, collect it', async () => {
  await ev(() => { NOA.ui.panels.closeSheet(); NOA.barn.add('rice_1', 6, { force: true }); });
  await tapMap('#bld-mill');
  await page.waitForSelector('.sheet .recipes');
  await page.locator('.sheet .recipe .btn--leaf').first().click();
  await page.waitForTimeout(400);
  await shot('mill-panel');
  if (!(await ev(() => NOA.state.factories.mill.queue.length))) throw new Error('job not started');
  await ev(() => NOA.ui.panels.closeSheet());
  await finishAll();
  await page.waitForTimeout(400);
  const before = await ev(() => NOA.barn.count('rice_2'));
  await tapMap('#bld-mill');
  await page.waitForTimeout(500);
  if (!((await ev(() => NOA.barn.count('rice_2'))) > before)) throw new Error('no fragrant rice');
  await ev(() => NOA.ui.panels.closeSheet());
});

await step('tutorial finished', async () => {
  await page.waitForTimeout(500);
  if ((await tutStep()) !== 'done') throw new Error('tutorial still at ' + (await tutStep()));
});

await step('level up to 3: level modal, bee-ship docks', async () => {
  await ev(() => { while (NOA.state.level < 3) NOA.progress.addXP(NOA.progress.xpToNext(NOA.state.level) - NOA.state.xp); });
  await page.waitForTimeout(500);
  await shot('level-up');
  await closeModals();
  await ev(() => NOA.ship.tick());
  await page.waitForTimeout(300);
  if (!(await ev(() => NOA.ship.docked()))) throw new Error('ship not docked');
});

await step('fill every crate, ship departs, Earth revives', async () => {
  await ev(() => { for (const c of NOA.state.ship.crates) NOA.barn.add(c.product, c.count, { force: true }); });
  await tapMap('#bld-dock');
  await page.waitForSelector('.sheet .slot-list');
  await shot('ship-panel');
  for (let k = 0; k < 3; k++) {
    const b = page.locator('.sheet .slot-row .btn--leaf').first();
    if (!(await b.count())) break;
    await b.click();
    await page.waitForTimeout(300);
  }
  await page.locator('.sheet .sh-actions .btn').first().click();
  await page.waitForTimeout(500);
  const s = await ev(() => ({ earth: NOA.state.earth, state: NOA.state.ship.state }));
  if (s.earth < 3 || s.state !== 'away') throw new Error(JSON.stringify(s));
  await ev(() => NOA.ui.panels.closeSheet());
});

await step('pan + zoom the map, jump to a zone', async () => {
  const t0 = await ev(() => document.querySelector('.map-world').style.transform);
  await page.locator('.zchip').nth(4).click();
  await page.waitForTimeout(600);
  const t1 = await ev(() => document.querySelector('.map-world').style.transform);
  if (t0 === t1) throw new Error('zone jump did not move the camera');
  await page.locator('.zoom-ctl .btn-icon').last().click();
  await page.waitForTimeout(600);
  await shot('livestock-zoomed');
  const vp = await center('.map-vp');
  await page.mouse.move(vp.x, vp.y);
  await page.mouse.down();
  await page.mouse.move(vp.x - 60, vp.y - 120, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  if (t1 === (await ev(() => document.querySelector('.map-world').style.transform))) throw new Error('drag did not pan');
});

await step('barn: stacks, sell one', async () => {
  await page.locator('#tabbar [data-tab="barn"]').click();
  await page.waitForTimeout(300);
  await shot('barn');
  const coins = await ev(() => NOA.state.res.coins);
  await page.locator('#scr-barn .stack').first().click();
  await page.waitForSelector('.sheet');
  await page.locator('.sheet .btn--sun').first().click();
  await page.waitForTimeout(300);
  if (!((await ev(() => NOA.state.res.coins)) > coins)) throw new Error('nothing sold');
  await ev(() => NOA.ui.panels.closeSheet());
});

await step('shop: buy a seed', async () => {
  await page.locator('#tabbar [data-tab="shop"]').click();
  await page.waitForTimeout(200);
  await ev(() => NOA.ui.screens.shop.tab('breeds'));
  await page.waitForTimeout(200);
  await shot('shop-breeds');
  const before = await ev(() => NOA.grids.count('vault'));
  await page.locator('#scr-shop .sitem .btn').first().click();
  await page.waitForTimeout(300);
  if ((await ev(() => NOA.grids.count('vault'))) !== before + 1) throw new Error('seed not bought');
});

await step('blindbox ×1', async () => {
  await ev(() => { NOA.res.add('coins', 5000); NOA.ui.screens.shop.tab('gacha'); });
  await page.waitForTimeout(200);
  await shot('shop-gacha');
  await page.locator('.box-card .btn').first().click();
  await page.waitForSelector('.gstage');
  await page.locator('.gstage').click({ position: { x: 195, y: 420 } });
  await page.waitForTimeout(1100);
  await shot('box-shaking');
  await page.waitForTimeout(2400);
  await shot('box-revealed');
  await page.locator('.gs-actions .btn').last().click();
  await page.waitForTimeout(400);
});
await step('blindbox ×10', async () => {
  await ev(() => { NOA.res.add('gems', 2000); NOA.state.level = Math.max(NOA.state.level, 6); NOA.ui.screens.shop.tab('gacha'); });
  await page.waitForTimeout(200);
  await page.locator('.box-card').nth(1).locator('.btn').nth(1).click();
  await page.waitForSelector('.gstage');
  await page.locator('.gstage').click({ position: { x: 195, y: 420 } });
  await page.waitForTimeout(6500);
  await shot('box-x10');
  await page.locator('.gs-actions .btn').last().click();
  await page.waitForTimeout(400);
});

await step('lab window: upgrade + cross-breeding', async () => {
  await ev(() => { NOA.ui.show('breed', { grid: 'vault' }); NOA.res.add('rp', 50); });
  await page.waitForTimeout(200);
  await page.locator('.lab-strip .btn').first().click();
  await page.waitForSelector('.lab-modal');
  await shot('lab-upgrade');
  await page.locator('.lab-modal .btn--leaf').first().click();
  await page.waitForTimeout(300);
  if ((await ev(() => NOA.labs.level('greenhouse'))) < 2) throw new Error('lab not upgraded');
  await closeModals();
});

await step('every screen renders', async () => {
  for (const id of ['farm', 'orders', 'breed', 'barn', 'shop', 'codex']) {
    await ev((t) => NOA.ui.show(t), id);
    await page.waitForTimeout(250);
  }
  for (const tab of ['species', 'genes', 'mascots', 'secrets', 'story']) {
    await ev((t) => NOA.ui.screens.codex.tab(t), tab);
    await page.waitForTimeout(150);
  }
  await shot('codex-story');
  for (const tab of ['items', 'gems', 'offers']) {
    await ev((t) => { NOA.ui.show('shop'); NOA.ui.screens.shop.tab(t); }, tab);
    await page.waitForTimeout(150);
  }
});

await step('settings + dev panel', async () => {
  await ev(() => NOA.ui.settings.open());
  await page.waitForSelector('.modal');
  await shot('settings');
  await closeModals();
  await ev(() => NOA.ui.settings.dev());
  await page.waitForTimeout(250);
  await shot('dev');
  await closeModals();
});

/** Visible text that still looks like an i18n key (e.g. "pen.feedAll") */
const rawKeys = () => ev(() => {
  const keys = Object.keys(NOA.I18N.vi);
  const txt = document.body.innerText;
  return keys.filter((k) => k.includes('.') && txt.includes(k)).slice(0, 10);
});
await step('no raw i18n keys (vi)', async () => {
  for (const id of ['farm', 'orders', 'breed', 'barn', 'shop']) {
    await ev((t) => NOA.ui.show(t), id);
    await page.waitForTimeout(200);
    const raw = await rawKeys();
    if (raw.length) throw new Error(id + ': ' + raw.join(', '));
  }
});
await step('english', async () => {
  await ev(() => { NOA.i18n.setLang('en'); NOA.ui.show('farm'); });
  await page.waitForTimeout(500);
  await shot('farm-en');
  for (const id of ['orders', 'breed', 'barn', 'shop']) {
    await ev((t) => NOA.ui.show(t), id);
    await page.waitForTimeout(200);
    const raw = await rawKeys();
    if (raw.length) throw new Error(id + ': ' + raw.join(', '));
  }
  await ev(() => { NOA.ui.show('farm'); });
});
await step('night + storm + meteor sky on the map', async () => {
  await ev(() => { NOA.state.dev.force = { night: true, fullMoon: true, meteor: true, weather: 'storm' }; NOA.ui.hud.updateSky(); NOA.ui.hud.spawnMeteor(); });
  await page.waitForTimeout(500);
  await shot('night');
  await ev(() => { NOA.state.dev.force = { weather: 'sunny', rainbow: false, night: false, fullMoon: false, meteor: false }; NOA.ui.hud.updateSky(); });
});
await step('payment (disabled) path', async () => {
  const r = await ev(() => NOA.payment.purchase('gems_60'));
  if (r.ok || r.code !== 'disabled') throw new Error('expected disabled, got ' + JSON.stringify(r));
  const r2 = await ev(async () => { NOA.state.dev.payProvider = 'mock'; const x = await NOA.payment.purchase('gems_60'); return { x }; });
  if (!r2.x.ok || !r2.x.granted.some((g) => g.key === 'res.gems' && g.n === 60)) throw new Error('mock purchase failed ' + JSON.stringify(r2));
});
await step('save survives a reload', async () => {
  await ev(() => NOA.save.write());
  const lvl = await ev(() => NOA.state.level);
  await page.reload();
  await page.waitForTimeout(800);
  const after = await ev(() => ({ level: NOA.state.level, map: !!document.querySelector('.map-world') }));
  if (after.level !== lvl || !after.map) throw new Error(JSON.stringify(after));
});

const overflow = await ev(() => document.documentElement.scrollWidth > innerWidth + 1);
if (overflow) errors.push('horizontal overflow at 390px');

await browser.close();
const fontFails = page404.filter((u) => /fonts\.(googleapis|gstatic)/.test(u));
if (fontFails.length) console.log('⚠️ font requests failed (network):', fontFails.slice(0, 3));
if (errors.length) {
  console.log('\nFAILED:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('\nAll smoke steps passed.');
