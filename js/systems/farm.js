/*
 * Farm: planting seeds in plots, raising animals in pens, feeding, harvesting.
 * Harvest output = base units by level × (1 + Yield%) × modifiers, packed into
 * the highest product tiers so the board does not flood.
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
    /* ------------------------------------------------------------ timing */
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
    /** Estimated product count (for the info card) */
    estimateUnits(item) { return Math.max(1, Math.round(F.units(item))); },

    /** Build the product items for one harvest / production cycle */
    makeOutput(item) {
      const h = B().harvest;
      const raw = F.units(item);
      let n = Math.floor(raw);
      if (U.chance(raw - n)) n += 1;
      n = Math.max(1, n);
      const sp = C().species[item.species];
      const parts = sp.hybrid ? [[sp.hybrid[0], Math.ceil(n / 2)], [sp.hybrid[1], Math.floor(n / 2)]] : [[item.species, n]];
      const out = [];
      let geneCount = 0;
      const tierUnits = B().product.tierUnits;
      const pack = h.packFromUnits || {};
      for (const [speciesId, count] of parts) {
        let left = count;
        const prods = C().species[speciesId].products;
        let top = Math.min(h.maxProductTier, prods.length);
        while (top > 1 && pack[top] && count < pack[top]) top -= 1;
        while (left > 0) {
          let tier = top;
          while (tier > 1 && tierUnits[tier] > left) tier -= 1;
          left -= tierUnits[tier];
          const q = I().stat(item, 'quality') + U.randInt(-h.starJitter, h.starJitter);
          const gene = item.gene && U.chance(h.geneProductChance) ? { id: item.gene.id, purity: item.gene.purity } : null;
          if (gene) geneCount += 1;
          out.push(I().newProduct(prods[tier - 1], I().starsFor(q), gene));
        }
      }
      return { products: out, units: n, geneCount };
    },

    /* ------------------------------------------------------------ plots */
    plant(plotIdx, boardIdx) {
      const plot = S().plots[plotIdx];
      const it = S().board[boardIdx];
      if (!plot || plot.seed || !it || it.kind !== 'seed' || it.locked) return false;
      S().board[boardIdx] = null;
      plot.seed = it;
      plot.charm = null;
      plot.start = NOA.time.now();
      plot.end = plot.start + F.growMs(it);
      plot.out = [];
      NOA.board.changed({ removed: [boardIdx] });
      NOA.events.emit('plot.planted', { plotIdx, item: it });
      NOA.events.emit('field.changed', {});
      return true;
    },
    isReady(slot) { return !!(slot && slot.end && NOA.time.now() >= slot.end); },
    progress(slot) {
      if (!slot || !slot.end) return 0;
      return U.clamp((NOA.time.now() - slot.start) / Math.max(1, slot.end - slot.start), 0, 1);
    },
    /** Collect a ready plot -> { placed, remaining } */
    harvest(plotIdx) {
      const plot = S().plots[plotIdx];
      if (!plot || !plot.seed || !F.isReady(plot)) return null;
      let first = false;
      if (!plot.out || !plot.out.length) {
        const res = F.makeOutput(plot.seed);
        plot.out = res.products;
        plot.units = res.units;
        first = true;
        F.onOutput(plot.seed, res);
      }
      const placed = F.placeAll(plot.out);
      const seed = plot.seed;
      if (!plot.out.length) { plot.seed = null; plot.start = plot.end = 0; plot.units = 0; }
      if (first || placed.length) {
        S().stats.harvests += first ? 1 : 0;
        NOA.events.emit('harvest', { plotIdx, item: seed, placed, remaining: plot.out.length, kind: 'plot' });
      }
      NOA.events.emit('field.changed', {});
      return { placed, remaining: plot.out.length };
    },
    placeAll(list) {
      const placed = [];
      while (list.length) {
        const r = NOA.board.placeOrStore(list[0], null);
        if (!r) break;
        placed.push({ item: list.shift(), where: r.where, index: r.index });
      }
      return placed;
    },
    onOutput(source, res) {
      const h = B().harvest;
      NOA.progress.addXP(res.units * B().xp.harvestPerUnit);
      if (res.geneCount) NOA.res.add('rp', res.geneCount * h.geneRP);
      res.products.forEach((p) => { S().discovered.products[p.product] = true; });
      if (U.chance(h.naturalCloverChance)) {
        S().boosters.clover = (S().boosters.clover || 0) + 1;
        NOA.events.emit('harvest.clover', {});
      }
    },
    unlockPlot() {
      const i = S().plots.length;
      const f = B().farm;
      if (i >= f.plotsMax) return { error: 'max' };
      if (S().level < f.plotLevelReq[i]) return { error: 'level', level: f.plotLevelReq[i] };
      if (!NOA.res.spend({ coins: f.plotCost[i] })) return { error: 'coins' };
      S().plots.push({ seed: null, start: 0, end: 0, out: [] });
      NOA.events.emit('field.changed', {});
      return { ok: true };
    },

    /* ------------------------------------------------------------ pens */
    placeAnimal(penIdx, boardIdx) {
      const pen = S().pens[penIdx];
      const it = S().board[boardIdx];
      if (!pen || pen.animal || !it || it.kind !== 'animal' || it.locked) return false;
      S().board[boardIdx] = null;
      pen.animal = it;
      pen.start = pen.end = 0;
      pen.out = [];
      NOA.board.changed({ removed: [boardIdx] });
      F.startCycle(pen);
      NOA.events.emit('pen.placed', { penIdx, item: it });
      NOA.events.emit('field.changed', {});
      return true;
    },
    canFeed(pen, item) {
      if (!pen || !pen.animal || !item || item.kind !== 'product' || item.locked) return false;
      const feed = C().species[pen.animal.species].feed || [];
      return feed.indexOf(C().products[item.product].species) >= 0 && pen.feed < B().farm.feedCapacity;
    },
    feed(penIdx, boardIdx) {
      const pen = S().pens[penIdx];
      const it = S().board[boardIdx];
      if (!F.canFeed(pen, it)) return false;
      const units = B().product.tierUnits[C().products[it.product].tier];
      pen.feed = Math.min(B().farm.feedCapacity, pen.feed + units);
      S().board[boardIdx] = null;
      NOA.board.changed({ removed: [boardIdx] });
      F.startCycle(pen);
      NOA.events.emit('pen.fed', { penIdx, units });
      NOA.events.emit('field.changed', {});
      return true;
    },
    startCycle(pen) {
      if (!pen.animal || pen.end || pen.feed < 1) return false;
      pen.feed -= 1;
      pen.start = NOA.time.now();
      pen.end = pen.start + F.growMs(pen.animal);
      return true;
    },
    collect(penIdx) {
      const pen = S().pens[penIdx];
      if (!pen || !pen.animal || !F.isReady(pen)) return null;
      let first = false;
      if (!pen.out || !pen.out.length) {
        const res = F.makeOutput(pen.animal);
        pen.out = res.products;
        pen.units = res.units;
        first = true;
        F.onOutput(pen.animal, res);
      }
      const placed = F.placeAll(pen.out);
      if (!pen.out.length) {
        pen.start = pen.end = 0;
        pen.units = 0;
        F.startCycle(pen);
      }
      if (first || placed.length) {
        S().stats.harvests += first ? 1 : 0;
        NOA.events.emit('harvest', { penIdx, item: pen.animal, placed, remaining: pen.out.length, kind: 'pen' });
      }
      NOA.events.emit('field.changed', {});
      return { placed, remaining: pen.out.length };
    },
    removeAnimal(penIdx) {
      const pen = S().pens[penIdx];
      if (!pen || !pen.animal || (pen.out && pen.out.length)) return false;
      const i = NOA.board.nearestEmpty(null);
      if (i < 0) return false;
      S().board[i] = pen.animal;
      pen.animal = null;
      pen.start = pen.end = 0;
      NOA.board.changed({ placed: [i] });
      NOA.events.emit('field.changed', {});
      return true;
    },
    unlockPen() {
      const i = S().pens.length;
      const f = B().farm;
      if (i >= f.pensMax) return { error: 'max' };
      if (S().level < f.penLevelReq[i]) return { error: 'level', level: f.penLevelReq[i] };
      if (!NOA.res.spend({ coins: f.penCost[i] })) return { error: 'coins' };
      S().pens.push({ animal: null, feed: 0, start: 0, end: 0, out: [] });
      NOA.events.emit('field.changed', {});
      return { ok: true };
    },

    /* ------------------------------------------------------------ growth tonic */
    tonic(type, idx) {
      const slot = type === 'plot' ? S().plots[idx] : S().pens[idx];
      if (!slot || !slot.end || F.isReady(slot) || (S().boosters.tonic || 0) < 1) return false;
      S().boosters.tonic -= 1;
      slot.end = NOA.time.now();
      NOA.events.emit('booster.used', { id: 'tonic' });
      NOA.events.emit('field.changed', {});
      return true;
    },

    /** Called every tick: emits when slots become ready */
    tick() {
      let changed = false;
      for (const list of [S().plots, S().pens]) {
        for (const slot of list) {
          const ready = F.isReady(slot);
          if (ready !== !!slot._ready) { slot._ready = ready; changed = true; }
        }
      }
      if (changed) NOA.events.emit('field.changed', { ready: true });
    }
  };
})();
