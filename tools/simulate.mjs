#!/usr/bin/env node
// Monte Carlo check: do the rates the game actually rolls match config/balance.js?
//   node tools/simulate.mjs            (20,000 trials per scenario)
//   node tools/simulate.mjs 100000
// Exits with code 1 if any observed rate is more than 4 standard errors away from its expected value.
import { loadGame } from './load.mjs';

const N = Number(process.argv[2]) || 20000;
const NOA = loadGame({ seed: 20261025 });
const B = NOA.BALANCE;
const I = NOA.items;
const S = NOA.state;

const rows = [];
let failed = 0;

function check(name, expected, trial, n = N) {
  let hits = 0;
  for (let i = 0; i < n; i++) if (trial(i)) hits++;
  const obs = hits / n;
  const se = Math.sqrt(Math.max(expected * (1 - expected), 1e-9) / n);
  const z = Math.abs(obs - expected) / se;
  const ok = z <= 4;
  if (!ok) failed++;
  rows.push({ scenario: name, expected: pct(expected), observed: pct(obs), z: z.toFixed(2), ok: ok ? '✓' : '✗' });
}
const pct = (p) => (p * 100).toFixed(2) + '%';

function breed(species, level, gene, extra = {}) {
  const it = I.newBreed(species, level, { gene: gene ? { id: gene[0], purity: gene[1] } : null, carrier: extra.carrier ?? null });
  if (extra.charm) it.charm = extra.charm;
  return it;
}
function setLab(lab, level) { S.labs[lab].level = level; }
function merge(a, b) { return NOA.genetics.mergeBreed(a, b); }

// No world / mascot noise: daytime, sunny, no full moon
S.dev.force = { night: false, fullMoon: false, weather: 'sunny', rainbow: false };

setLab('greenhouse', 1);
const ctx1 = NOA.genetics.ctxFor(breed('rice', 1), breed('rice', 1));
check('Thường+Thường → gen mới (Viện 1)', NOA.mods.chance('gene.spawn', B.gene.spawnChance, ctx1),
  () => !!merge(breed('rice', 1), breed('rice', 1)).item.gene);

check('Cao cấp+Thường → giữ gen (Viện 1)', NOA.mods.chance('gene.keep.withNormal', B.gene.keep.withNormal, ctx1),
  () => !!merge(breed('rice', 2, ['solar', 2]), breed('rice', 2)).item.gene);

const cl = breed('rice', 2, ['solar', 2], { charm: 'clover' });
check('Cao cấp+Thường + 🍀 → giữ gen', NOA.mods.chance('gene.keep.withNormal', B.gene.keep.withNormal, NOA.genetics.ctxFor(cl, breed('rice', 2))),
  () => !!merge(breed('rice', 2, ['solar', 2], { charm: 'clover' }), breed('rice', 2)).item.gene);

check('Cao cấp+Cao cấp cùng gen → giữ gen', NOA.mods.chance('gene.keep.sameGene', B.gene.keep.sameGene, ctx1),
  () => !!merge(breed('rice', 2, ['lunar', 1]), breed('rice', 2, ['lunar', 1])).item.gene);

{
  const keep = NOA.mods.chance('gene.keep.sameGene', B.gene.keep.sameGene, ctx1);
  const up = NOA.mods.chance('gene.purityUp', B.gene.purityUpChance[1], ctx1);
  check('Cùng gen ◆1+◆1 → lên ◆2', keep * up, () => {
    const r = merge(breed('rice', 2, ['lunar', 1]), breed('rice', 2, ['lunar', 1])).item;
    return r.gene && r.gene.purity === 2;
  });
}

setLab('greenhouse', 3);
{
  const c = NOA.genetics.ctxFor(breed('rice', 2, ['solar', 2]), breed('rice', 2, ['crystal', 2]));
  const p = NOA.genetics.fusionChance('rainbow', c);
  check('☀️◆2 + 💧◆2 → 🌈 Cầu Vồng (Viện 3)', p, () => {
    const r = merge(breed('rice', 2, ['solar', 2]), breed('rice', 2, ['crystal', 2])).item;
    return r.gene && r.gene.id === 'rainbow';
  });
}
setLab('greenhouse', 1);

check('Đột phá Lv1 → Lv3', NOA.mods.chance('merge.breakthrough', B.merge.breakthroughChance[1], ctx1),
  () => merge(breed('rice', 1), breed('rice', 1)).item.level === 3);

{
  const spawn = NOA.mods.chance('gene.spawn', B.gene.spawnChance, ctx1);
  const rec = B.recessive.expressChance;
  check('Gen lặn ×2 (Mendel 1/4) → biểu hiện', rec + (1 - rec) * spawn,
    () => !!merge(breed('rice', 1, null, { carrier: 'lunar' }), breed('rice', 1, null, { carrier: 'lunar' })).item.gene);
}

// Harvest seeds / young animals: next-generation inheritance (balance.harvest.seeds, balance.livestock)
{
  const cfg = B.harvest.seeds;
  check('Hạt con giữ gen của cây mẹ', cfg.geneInherit, () => !!NOA.genetics.offspring(breed('rice', 3, ['solar', 2])).gene);
  check('Cây mẹ có gen → hạt con mang gen LẶN', (1 - cfg.geneInherit) * cfg.carrierFromGene,
    () => { const c = NOA.genetics.offspring(breed('rice', 3, ['solar', 2])); return !c.gene && c.carrier === 'solar'; });
  check('Cây mẹ mang gen lặn → hạt con mang tiếp', cfg.carrierInherit,
    () => NOA.genetics.offspring(breed('rice', 3, null, { carrier: 'lunar' })).carrier === 'lunar');
  const lv = B.livestock;
  const p = lv.offspringChance + lv.offspringPerLevel * 1;
  rows.push({ scenario: 'Con non mỗi lứa (Lv1) — cấu hình', expected: pct(p), observed: '-', z: '-', ok: 'i' });
}

// Gacha: rarity distribution + pity guarantees
for (const boxId of Object.keys(B.gacha.boxes)) {
  NOA.state.gacha[boxId] = { opened: 0, since: {} };
  const counts = {};
  let gap = {}, maxGap = {};
  const box = B.gacha.boxes[boxId];
  for (let i = 0; i < N; i++) {
    const [r] = NOA.gacha.roll(boxId, 1);
    counts[r.rarity] = (counts[r.rarity] || 0) + 1;
    for (const pr in box.pity) {
      const reached = B.gacha.rarityOrder.indexOf(r.rarity) >= B.gacha.rarityOrder.indexOf(pr);
      gap[pr] = reached ? 0 : (gap[pr] || 0) + 1;
      maxGap[pr] = Math.max(maxGap[pr] || 0, gap[pr]);
    }
  }
  const rates = NOA.gacha.rates(boxId);
  for (const r of rates) {
    rows.push({ scenario: `Hộp ${boxId}: ${r.rarity} (gốc, chưa tính pity)`, expected: pct(r.p), observed: pct((counts[r.rarity] || 0) / N), z: '-', ok: 'i' });
  }
  for (const pr in box.pity) {
    const ok = maxGap[pr] < box.pity[pr];
    if (!ok) failed++;
    rows.push({ scenario: `Hộp ${boxId}: pity ${pr} ≤ ${box.pity[pr]} lần`, expected: `< ${box.pity[pr]}`, observed: `chuỗi trượt dài nhất ${maxGap[pr]}`, z: '-', ok: ok ? '✓' : '✗' });
  }
}

console.log(`\nNoa Farm · kiểm tra tỉ lệ (${N.toLocaleString('vi-VN')} lần / kịch bản)\n`);
console.table(rows);

// Progression snapshot: 16 Lv1 seeds merged up to Lv5
const runs = Math.max(200, Math.floor(N / 40));
let genes = 0, statSum = 0, units = 0;
for (let k = 0; k < runs; k++) {
  let layer = Array.from({ length: 16 }, () => breed('tomato', 1));
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(merge(layer[i], layer[i + 1]).item);
    layer = next;
  }
  const top = layer[0];
  if (top.gene) genes++;
  statSum += I.statTotal(top);
  units += NOA.farm.units(top);
}
console.log(`Từ 16 hạt Lv1 merge lên 1 hạt (Viện 1, ${runs} lần): có gen ${pct(genes / runs)} · tổng chỉ số TB ${(statSum / runs).toFixed(1)} · sản lượng TB ${(units / runs).toFixed(1)} đơn vị\n`);

const warnings = NOA.validateConfig();
console.log(warnings.length ? '⚠️ Cấu hình:\n - ' + warnings.join('\n - ') : 'Cấu hình hợp lệ ✓');
if (failed || warnings.length) process.exit(1);
