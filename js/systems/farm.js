/*
 * Farm: 🌾 crop fields, 🌸 flower beds and 🐄 livestock pens.
 *   Plant a seed from the vault -> harvest gives produce (barn) + next-generation SEEDS (vault)
 *   + byproducts (straw / pollen). Animals eat feed from the barn -> produce goods, sometimes
 *   young animals (nursery) and manure (fertilizer).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const F = NOA.farm = {
    /* ------------------------------------------------------------ timing & yield */
    growMs(item) {
      const h = B().harvest;
      const eco = B().species[item.species];
      const base = item.kind === 'seed' ? eco.growSec : eco.cycleSec;
      const red = Math.min(h.maxTimeReduction, I().stat(item, 'growth') * h.growthReductionPerPoint);
      const key = item.kind === 'seed' ? 'plant.timeMult' : 'animal.timeMult';
      const mult = NOA.mods.value(key, 1, { family: I().family(item) });
      return Math.max(1000, NOA.time.dur(base * (h.timeMultByLevel[item.level] || 1) * (1 - red) * mult));
    },
    units(item) {
      const h = B().harvest;
      const base = h.baseUnitsByLevel[item.level] || 1;
      const u = base * (1 + I().stat(item, 'yield') * h.yieldBonusPerPoint);
      return NOA.mods.value('harvest.units', u, { family: I().family(item) });
    },
    estimateUnits(item) { return Math.max(1, Math.round(F.units(item))); },
    roll(x) { let n = Math.floor(x); if (U.chance(x - n)) n += 1; return n; },
    isReady(slot) { return !!(slot && slot.end && NOA.time.now() >= slot.end); },
    progress(slot) {
      if (!slot || !slot.end) return 0;
      return U.clamp((NOA.time.now() - slot.start) / Math.max(1, slot.end - slot.start), 0, 1);
    },

    /** Goods for one harvest / production cycle: [{ pid, stars, gene }] (hybrids split across both parents) */
    makeGoods(item, units) {
      const h = B().harvest;
      const sp = C().species[item.species];
      const parts = sp.hybrid ? [[sp.hybrid[0], Math.ceil(units / 2)], [sp.hybrid[1], Math.floor(units / 2)]] : [[item.species, units]];
      const out = [];
      for (const [speciesId, n] of parts) {
        const pid = C().species[speciesId].products[0];
        for (let i = 0; i < n; i++) {
          const q = I().stat(item, 'quality') + U.randInt(-h.starJitter, h.starJitter);
          const gene = item.gene && U.chance(h.geneProductChance) ? { id: item.gene.id, purity: item.gene.purity } : null;
          out.push({ pid, stars: I().starsFor(q), gene });
        }
      }
      return out;
    },
    addGoods(list) {
      for (const g of list) NOA.barn.add(g.pid, 1, { stars: g.stars, gene: g.gene, force: true });
      return list.length;
    },
    countGenes(list) { return list.filter((g) => g.gene).length; },

    /* ------------------------------------------------------------ fields */
    plots(bed) { return S().fields[bed]; },
    plotFits(bed, item) { return !!item && item.kind === 'seed' && C().species[item.species].bed === bed; },
    /** Plant the seed at vault[vaultIdx] into fields[bed][idx] */
    plant(bed, idx, vaultIdx) {
      const plot = S().fields[bed][idx];
      const it = S().vault.cells[vaultIdx];
      if (!plot || plot.seed || !F.plotFits(bed, it) || it.locked) return false;
      S().vault.cells[vaultIdx] = null;
      plot.seed = it;
      plot.start = NOA.time.now();
      plot.end = plot.start + F.growMs(it);
      NOA.grids.changed('vault', { removed: [vaultIdx] });
      NOA.grids.flushPending();
      NOA.events.emit('plot.planted', { bed, idx, item: it });
      NOA.events.emit('field.changed', { bed });
      return true;
    },
    /** -> { goods, seeds:[{item, where}], mats:{id:n}, lostSeeds } | { error:'barn', need } | null */
    harvest(bed, idx) {
      const plot = S().fields[bed][idx];
      if (!plot || !plot.seed || !F.isReady(plot)) return null;
      const seed = plot.seed;
      const fert = plot.fert ? B().fertilizer : null;
      let units = F.roll(F.units(seed) * (fert ? fert.unitsMult : 1));
      units = Math.max(1, units);
      const sp = C().species[seed.species];
      const mats = {};
      if (sp.byproduct) {
        const bp = B().byproducts[sp.byproduct];
        mats[sp.byproduct] = bp.base + Math.floor(units / bp.perUnits);
      }
      const need = units + Object.values(mats).reduce((a, b) => a + b, 0);
      if (NOA.barn.free() < need) return { error: 'barn', need };
      const goods = F.makeGoods(seed, units);
      F.addGoods(goods);
      for (const m in mats) NOA.barn.add(m, mats[m], { force: true });
      // next-generation seeds
      const cfg = B().harvest.seeds;
      let nSeeds = (cfg.countByLevel[seed.level] || 1) + (fert ? fert.extraSeeds : 0);
      if (U.chance(cfg.extraChance + I().stat(seed, 'yield') * cfg.extraPerYieldPoint)) nSeeds += 1;
      const seeds = [];
      let lostSeeds = 0;
      for (let i = 0; i < nSeeds; i++) {
        const child = NOA.genetics.offspring(seed);
        const where = NOA.grids.place(child);
        if (where === -1) lostSeeds += 1;
        else seeds.push({ item: child, where });
        if (child.gene) NOA.grids.recordGene(child.gene.id, [], 'plant');
      }
      plot.seed = null;
      plot.start = plot.end = 0;
      plot.fert = false;
      F.afterOutput(goods, units);
      S().stats.harvests += 1;
      NOA.events.emit('harvest', { bed, idx, item: seed, goods, seeds, mats, lostSeeds });
      NOA.events.emit('field.changed', { bed });
      return { goods, seeds, mats, lostSeeds, units };
    },
    afterOutput(goods, units) {
      const h = B().harvest;
      NOA.progress.addXP(units * B().xp.harvestPerUnit);
      const g = F.countGenes(goods);
      if (g) NOA.res.add('rp', g * h.geneRP);
      if (U.chance(h.naturalCloverChance)) {
        S().boosters.clover = (S().boosters.clover || 0) + 1;
        NOA.events.emit('harvest.clover', {});
      }
    },
    fertilize(bed, idx) {
      const plot = S().fields[bed][idx];
      if (!plot || plot.fert) return { error: 'already' };
      if (!NOA.barn.take('manure', 1)) return { error: 'none' };
      plot.fert = true;
      NOA.events.emit('field.changed', { bed });
      return { ok: true };
    },
    nextPlotCost(bed) {
      const f = B().fields[bed];
      const i = S().fields[bed].length;
      if (i >= f.max) return null;
      return { coins: f.cost[i], level: f.levelReq[i] };
    },
    /** Plots whose price is 0 open by themselves once the level is reached */
    grantFreePlots() {
      let n = 0;
      for (const bed of ['crop', 'flower']) {
        for (let c = F.nextPlotCost(bed); c && !c.coins && S().level >= c.level; c = F.nextPlotCost(bed)) {
          S().fields[bed].push(NOA.newPlot(bed));
          n += 1;
        }
      }
      if (n) NOA.events.emit('field.changed', { granted: n });
      return n;
    },
    unlockPlot(bed) {
      const c = F.nextPlotCost(bed);
      if (!c) return { error: 'max' };
      if (S().level < c.level) return { error: 'level', level: c.level };
      if (c.coins && !NOA.res.spend({ coins: c.coins })) return { error: 'coins' };
      S().fields[bed].push(NOA.newPlot(bed));
      NOA.events.emit('field.changed', { bed });
      return { ok: true };
    },

    /* ------------------------------------------------------------ pens */
    penSpecies(penId) {
      return Object.keys(C().species).filter((id) => C().species[id].pen === penId);
    },
    penOpen(penId) { return F.penSpecies(penId).some((sp) => !C().species[sp].hybrid && NOA.progress.speciesUnlocked(sp)); },
    penFits(penId, item) { return !!item && item.kind === 'animal' && C().species[item.species].pen === penId; },
    placeAnimal(penId, nurseryIdx) {
      const pen = S().pens[penId];
      const it = S().nursery.cells[nurseryIdx];
      if (!pen || !F.penFits(penId, it) || it.locked) return { error: 'fit' };
      const slot = pen.slots.indexOf(null);
      if (slot < 0) return { error: 'full' };
      S().nursery.cells[nurseryIdx] = null;
      pen.slots[slot] = { animal: it, start: 0, end: 0 };
      NOA.grids.changed('nursery', { removed: [nurseryIdx] });
      NOA.events.emit('pen.placed', { penId, slot, item: it });
      NOA.events.emit('pens.changed', { penId });
      return { ok: true, slot };
    },
    feedFor(animal) { return C().species[animal.species].feed || []; },
    hungry(slot) { return !!(slot && slot.animal && !slot.end); },
    /** Feed every idle animal of a pen from the barn -> { fed, missing:[feedIds] } */
    feedAll(penId) {
      const pen = S().pens[penId];
      let fed = 0;
      const missing = new Set();
      pen.slots.forEach((slot) => {
        if (!F.hungry(slot)) return;
        const feeds = F.feedFor(slot.animal);
        const f = feeds.find((id) => NOA.barn.has(id, 1));
        if (!f) { feeds.forEach((x) => missing.add(x)); return; }
        NOA.barn.take(f, 1);
        slot.start = NOA.time.now();
        slot.end = slot.start + F.growMs(slot.animal);
        fed += 1;
      });
      if (fed) {
        NOA.events.emit('pen.fed', { penId, fed });
        NOA.events.emit('pens.changed', { penId });
      }
      return { fed, missing: [...missing] };
    },
    readyCount(penId) { return S().pens[penId].slots.filter((s) => s && F.isReady(s)).length; },
    /** Collect every ready animal -> { goods, young, manure, lostYoung } | { error:'barn' } */
    collectAll(penId) {
      const pen = S().pens[penId];
      const lv = B().livestock;
      const result = { goods: [], young: [], manure: 0, lostYoung: 0, collected: 0 };
      for (const slot of pen.slots) {
        if (!slot || !F.isReady(slot)) continue;
        const a = slot.animal;
        const units = Math.max(1, F.roll(F.units(a)));
        const manure = C().species[a.species].manure && U.chance(lv.manureChance) ? 1 : 0;
        if (NOA.barn.free() < units + manure) { result.error = 'barn'; break; }
        const goods = F.makeGoods(a, units);
        F.addGoods(goods);
        if (manure) NOA.barn.add('manure', manure, { force: true });
        result.goods.push(...goods);
        result.manure += manure;
        if (U.chance(lv.offspringChance + lv.offspringPerLevel * a.level)) {
          const child = NOA.genetics.offspring(a);
          const where = NOA.grids.place(child);
          if (where === -1) result.lostYoung += 1;
          else result.young.push({ item: child, where });
          if (child.gene) NOA.grids.recordGene(child.gene.id, [], 'animal');
        }
        slot.start = slot.end = 0;
        result.collected += 1;
        F.afterOutput(goods, units);
      }
      if (result.collected) {
        S().stats.harvests += 1;
        NOA.events.emit('harvest', Object.assign({ penId, kind: 'pen' }, result));
        NOA.events.emit('pens.changed', { penId });
      }
      return result;
    },
    removeAnimal(penId, slotIdx) {
      const pen = S().pens[penId];
      const slot = pen.slots[slotIdx];
      if (!slot || F.isReady(slot)) return false;
      if (!NOA.grids.hasRoom('nursery')) return false;
      NOA.grids.place(slot.animal);
      pen.slots[slotIdx] = null;
      NOA.events.emit('pens.changed', { penId });
      return true;
    },
    nextSlotCost(penId) {
      const cfg = B().livestock.pens[penId];
      const n = S().pens[penId].slots.length;
      if (n >= cfg.slotsMax) return null;
      return cfg.slotCost[n] || 0;
    },
    unlockSlot(penId) {
      const cost = F.nextSlotCost(penId);
      if (cost == null) return { error: 'max' };
      if (cost && !NOA.res.spend({ coins: cost })) return { error: 'coins' };
      S().pens[penId].slots.push(null);
      NOA.events.emit('pens.changed', { penId });
      return { ok: true };
    },

    /* ------------------------------------------------------------ growth tonic */
    tonicPlot(bed, idx) {
      const plot = S().fields[bed][idx];
      if (!plot || !plot.end || F.isReady(plot) || (S().boosters.tonic || 0) < 1) return false;
      S().boosters.tonic -= 1;
      plot.end = NOA.time.now();
      NOA.events.emit('booster.used', { id: 'tonic' });
      NOA.events.emit('field.changed', { bed });
      return true;
    },
    tonicPen(penId) {
      const pen = S().pens[penId];
      const slot = pen.slots.find((s) => s && s.end && !F.isReady(s));
      if (!slot || (S().boosters.tonic || 0) < 1) return false;
      S().boosters.tonic -= 1;
      pen.slots.forEach((s) => { if (s && s.end && !F.isReady(s)) s.end = NOA.time.now(); });
      NOA.events.emit('booster.used', { id: 'tonic' });
      NOA.events.emit('pens.changed', { penId });
      return true;
    },

    /** Called every tick: emits when something becomes ready */
    tick() {
      for (const bed in S().fields) {
        let changed = false;
        for (const p of S().fields[bed]) {
          const r = F.isReady(p);
          if (r !== !!p._r) { p._r = r; changed = true; }
        }
        if (changed) NOA.events.emit('field.changed', { bed, ready: true });
      }
      for (const penId in S().pens) {
        const n = F.readyCount(penId);
        const pen = S().pens[penId];
        if (n !== (pen._r || 0)) { pen._r = n; NOA.events.emit('pens.changed', { penId, ready: true }); }
      }
    }
  };
})();
