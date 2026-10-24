/*
 * Config validator: catches typos and impossible numbers after someone edits
 * config/balance.js or config/content.js. Results show in Dev panel + console.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';

  NOA.validateConfig = function () {
    const B = NOA.BALANCE, C = NOA.CONTENT, P = NOA.PAYMENT;
    const out = [];
    const warn = (msg) => out.push(msg);
    const prob = (path, v) => {
      if (typeof v !== 'number' || isNaN(v) || v < 0 || v > 1) warn(path + ' phải là xác suất 0..1 (đang là ' + v + ')');
    };
    const sumPositive = (path, obj) => {
      const s = Object.values(obj || {}).reduce((a, b) => a + (b > 0 ? b : 0), 0);
      if (s <= 0) warn(path + ': tổng trọng số phải > 0');
      return s;
    };

    // species
    for (const id in C.species) {
      const sp = C.species[id];
      const eco = B.species[id];
      if (!eco) { warn('balance.species thiếu "' + id + '"'); continue; }
      const timeKey = sp.family === 'plant' ? 'growSec' : 'cycleSec';
      if (!(eco[timeKey] > 0)) warn('balance.species.' + id + '.' + timeKey + ' phải > 0');
      if (sp.hybrid) {
        sp.hybrid.forEach((p) => { if (!C.species[p]) warn('Giống lai ' + id + ' tham chiếu loài không tồn tại: ' + p); });
        if (!(eco.hybridPriceMult > 0)) warn('balance.species.' + id + '.hybridPriceMult phải > 0');
      } else {
        if (!(eco.price > 0)) warn('balance.species.' + id + '.price phải > 0');
        if (!(eco.unlockLevel >= 1)) warn('balance.species.' + id + '.unlockLevel phải >= 1');
        (sp.products || []).forEach((pid, i) => {
          const p = C.products[pid];
          if (!p) warn('content.products thiếu "' + pid + '"');
          else if (p.species !== id || p.tier !== i + 1) warn('Sản phẩm ' + pid + ' sai loài/cấp');
        });
      }
      (sp.feed || []).forEach((f) => { if (!C.products[f] && !C.materials[f]) warn('Thức ăn của ' + id + ' không tồn tại: ' + f); });
      if (sp.family === 'plant' && ['crop', 'flower'].indexOf(sp.bed) < 0) warn('Loài cây ' + id + ' thiếu bed (crop/flower)');
      if (sp.family === 'animal') {
        if (!sp.pen || !C.buildings[sp.pen]) warn('Vật nuôi ' + id + ': chuồng không tồn tại ' + sp.pen);
        else if (!B.livestock.pens[sp.pen]) warn('balance.livestock.pens thiếu "' + sp.pen + '"');
        if (!(sp.feed || []).length) warn('Vật nuôi ' + id + ' thiếu feed');
      }
      if (sp.byproduct && (!C.materials[sp.byproduct] || !B.byproducts[sp.byproduct])) warn('Phụ phẩm của ' + id + ' không tồn tại: ' + sp.byproduct);
    }
    for (const id in B.species) if (!C.species[id]) warn('balance.species có "' + id + '" nhưng content.species không có');

    // genes
    for (const id in C.genes) {
      const g = C.genes[id];
      if (g.parents) {
        g.parents.forEach((p) => {
          const pg = C.genes[p];
          if (!pg) warn('Gen ' + id + ': gen cha/mẹ không tồn tại ' + p);
          else if (pg.family !== g.family) warn('Gen ' + id + ': gen cha/mẹ khác họ ' + p);
          else if (pg.tier !== g.tier - 1) warn('Gen ' + id + ': gen cha/mẹ ' + p + ' phải ở tầng ' + (g.tier - 1));
        });
      }
      if (!B.gene.priceMult[g.tier]) warn('balance.gene.priceMult thiếu tầng ' + g.tier);
    }
    for (const fam of ['plant', 'animal']) {
      const w = B.gene.spawnWeights[fam] || {};
      sumPositive('gene.spawnWeights.' + fam, w);
      for (const id in w) {
        if (!C.genes[id]) warn('gene.spawnWeights.' + fam + ': gen không tồn tại ' + id);
        else if (C.genes[id].tier !== 1 || C.genes[id].family !== fam) warn('gene.spawnWeights.' + fam + '.' + id + ' phải là gen tầng 1 họ ' + fam);
      }
    }

    // probabilities
    prob('gene.spawnChance', B.gene.spawnChance);
    for (const k in B.gene.keep) prob('gene.keep.' + k, B.gene.keep[k]);
    B.gene.purityUpChance.forEach((v, i) => prob('gene.purityUpChance[' + i + ']', v));
    for (const k in B.gene.fusion.chanceByTier) prob('gene.fusion.chanceByTier.' + k, B.gene.fusion.chanceByTier[k]);
    for (const k in B.recessive) prob('recessive.' + k, B.recessive[k]);
    B.merge.breakthroughChance.forEach((v, i) => prob('merge.breakthroughChance[' + i + ']', v));
    prob('harvest.geneProductChance', B.harvest.geneProductChance);
    prob('harvest.naturalCloverChance', B.harvest.naturalCloverChance);
    prob('breeds.carrierChance', B.breeds.carrierChance);
    for (const k of ['extraChance', 'geneInherit', 'carrierFromGene', 'carrierInherit', 'inheritRatio']) prob('harvest.seeds.' + k, B.harvest.seeds[k]);
    prob('livestock.offspringChance', B.livestock.offspringChance);
    prob('livestock.manureChance', B.livestock.manureChance);
    prob('production.starUpChance', B.production.starUpChance);
    prob('orders.vip.chance', B.orders.vip.chance);
    prob('hybrid.baseDiscovery', B.hybrid.baseDiscovery);

    // recipes & buildings
    for (const pid in B.recipes) {
      const r = B.recipes[pid];
      if (!C.products[pid]) warn('recipes: sản phẩm không tồn tại ' + pid);
      if (!B.production.buildings[r.building]) warn('recipes.' + pid + ': xưởng không tồn tại ' + r.building);
      for (const inp in r.inputs) {
        if (!C.products[inp] && !C.materials[inp]) warn('recipes.' + pid + ': nguyên liệu không tồn tại ' + inp);
        if (!(r.inputs[inp] > 0)) warn('recipes.' + pid + ': số lượng ' + inp + ' phải > 0');
      }
      if (!(r.timeSec > 0)) warn('recipes.' + pid + '.timeSec phải > 0');
    }
    for (const id in C.species) {
      const sp = C.species[id];
      (sp.products || []).slice(1).forEach((pid) => { if (!B.recipes[pid]) warn('Thiếu công thức chế biến cho ' + pid); });
    }
    for (const b in B.production.buildings) if (!C.buildings[b]) warn('content.buildings thiếu xưởng "' + b + '"');
    for (const b in B.livestock.pens) if (!C.buildings[b]) warn('content.buildings thiếu chuồng "' + b + '"');
    for (const b in C.buildings) if (!C.map.buildings[b]) warn('content.map.buildings thiếu vị trí cho "' + b + '"');
    for (const bed of ['crop', 'flower']) {
      const f = B.fields[bed];
      if (f.cost.length < f.max || f.levelReq.length < f.max) warn('fields.' + bed + ': cost/levelReq phải đủ ' + f.max + ' phần tử');
      if (!C.map.plots[bed]) warn('content.map.plots thiếu "' + bed + '"');
    }
    for (const m in C.materials) if (!B.materials[m]) warn('balance.materials thiếu "' + m + '"');

    // labs
    if (B.labs.levels.length !== B.labs.maxLevel + 1) warn('labs.levels phải có ' + (B.labs.maxLevel + 1) + ' phần tử (kể cả null ở index 0)');
    for (let i = 2; i < B.labs.levels.length; i++) {
      const L = B.labs.levels[i];
      if (!L || !L.cost) warn('labs.levels[' + i + '] thiếu cost');
    }

    // gacha
    for (const boxId in B.gacha.boxes) {
      const box = B.gacha.boxes[boxId];
      if (!C.boxes[boxId]) warn('content.boxes thiếu "' + boxId + '"');
      sumPositive('gacha.boxes.' + boxId + '.rarityWeights', box.rarityWeights);
      for (const r in box.rarityWeights) {
        if (B.gacha.rarityOrder.indexOf(r) < 0) warn('Hộp ' + boxId + ': độ hiếm lạ ' + r);
        if (box.rarityWeights[r] > 0) {
          const pool = box.pool[r] || {};
          if (!Object.keys(pool).length) warn('Hộp ' + boxId + ': độ hiếm ' + r + ' có trọng số nhưng pool rỗng');
          for (const rid in pool) if (!B.gacha.rewards[rid]) warn('Hộp ' + boxId + ': phần thưởng không tồn tại ' + rid);
        }
      }
      for (const r in box.pity || {}) if (B.gacha.rarityOrder.indexOf(r) < 0) warn('Hộp ' + boxId + ': pity độ hiếm lạ ' + r);
    }
    for (const id in B.gacha.speciesWeights) if (!C.species[id] || C.species[id].hybrid) warn('gacha.speciesWeights: loài không hợp lệ ' + id);
    for (const id in C.species) if (!C.species[id].hybrid && !(B.gacha.speciesWeights[id] > 0)) warn('gacha.speciesWeights: thiếu trọng số cho ' + id);
    for (const pool in B.gacha.mascotPools) {
      for (const id in B.gacha.mascotPools[pool]) if (!C.mascots[id]) warn('gacha.mascotPools.' + pool + ': linh vật không tồn tại ' + id);
    }
    for (const rid in B.gacha.rewards) {
      const r = B.gacha.rewards[rid];
      if (r.type === 'booster' && !C.boosters[r.id]) warn('gacha.rewards.' + rid + ': booster không tồn tại ' + r.id);
      if (r.type === 'mascot' && !B.gacha.mascotPools[r.pool]) warn('gacha.rewards.' + rid + ': nhóm linh vật không tồn tại ' + r.pool);
      if (r.type === 'material' && !C.materials[r.id]) warn('gacha.rewards.' + rid + ': vật liệu không tồn tại ' + r.id);
    }

    // mascots
    for (const id in C.mascots) {
      if (!B.mascots.effects[id]) warn('mascots.effects thiếu "' + id + '"');
      if (C.mascots[id].type === 'temp' && !(B.mascots.durationMin[id] > 0)) warn('mascots.durationMin thiếu "' + id + '"');
    }

    // rewards tables
    if ((B.login.days || []).length < 1) warn('login.days rỗng');
    const checkReward = (path, r) => {
      for (const b in (r && r.boosters) || {}) if (!C.boosters[b]) warn(path + ': booster không tồn tại ' + b);
      for (const tk in (r && r.tickets) || {}) if (!B.gacha.boxes[tk]) warn(path + ': vé không tồn tại ' + tk);
      if (r && r.mascot && !C.mascots[r.mascot]) warn(path + ': linh vật không tồn tại ' + r.mascot);
      for (const m in (r && r.materials) || {}) if (!C.materials[m]) warn(path + ': vật liệu không tồn tại ' + m);
      for (const p in (r && r.products) || {}) if (!C.products[p]) warn(path + ': sản phẩm không tồn tại ' + p);
      ((r && r.seeds) || []).concat((r && r.animals) || []).forEach((sp) => { if (!C.species[sp.species]) warn(path + ': loài không tồn tại ' + sp.species); });
    };
    B.login.days.forEach((d, i) => checkReward('login.days[' + i + ']', d));
    for (const lv in B.levelRewards) checkReward('levelRewards.' + lv, B.levelRewards[lv]);
    B.shop.items.forEach((it) => checkReward('shop.' + it.id, it.grant));
    for (const s in B.secrets.rewards) checkReward('secrets.rewards.' + s, B.secrets.rewards[s]);

    // payment
    const skus = {};
    (P.products || []).forEach((p) => {
      if (skus[p.sku]) warn('payment: trùng sku ' + p.sku);
      skus[p.sku] = true;
      checkReward('payment.' + p.sku, p.grant);
    });
    if (P.enabled && P.provider === 'disabled') warn('payment.enabled = true nhưng provider vẫn là "disabled"');

    // i18n coverage for content names
    if (NOA.I18N && NOA.I18N.vi && NOA.I18N.en) {
      const need = [];
      for (const id in C.species) need.push('species.' + id);
      for (const id in C.products) need.push('product.' + id);
      for (const id in C.genes) need.push('gene.' + id);
      for (const id in C.mascots) need.push('mascot.' + id);
      for (const id in C.boosters) need.push('booster.' + id);
      for (const id in C.materials) need.push('material.' + id);
      for (const id in C.buildings) need.push('bld.' + id);
      for (const z of C.map.zones) need.push('zone.' + z.id);
      for (const s of C.tutorial) need.push('tut.' + s.id);
      for (const k of need) {
        if (NOA.I18N.vi[k] == null) warn('i18n/vi.js thiếu "' + k + '"');
        if (NOA.I18N.en[k] == null) warn('i18n/en.js thiếu "' + k + '"');
      }
    }
    return out;
  };
})();
