/*
 * Merge grids: 🌰 Kho hạt giống (vault, plant seeds) and 🐣 Chuồng ươm (nursery, young animals).
 * Merging happens here: drag a seed / animal onto an identical one to get a higher-level breed.
 * No DOM here (the view lives in js/ui/grid-view.js).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const I = () => NOA.items;

  const GR = NOA.grids = {
    ids: ['vault', 'nursery'],
    combo: { count: 0, last: 0 },
    cells(id) { return S()[id].cells; },
    get(id, i) { return S()[id].cells[i] || null; },
    family(id) { return id === 'vault' ? 'plant' : 'animal'; },
    gridFor(item) { return I().family(item) === 'plant' ? 'vault' : 'nursery'; },
    size(id) { return S()[id].cells.length; },
    freeCount(id) { return S()[id].cells.filter((x) => !x).length; },
    count(id) { return S()[id].cells.filter(Boolean).length; },
    maxSize(id) { return id === 'vault' ? B().storage.vaultMax : B().storage.nurseryMax; },
    changed(id, detail) { NOA.events.emit('grid.changed', Object.assign({ grid: id }, detail || {})); NOA.save.schedule(); },

    /** Put a breed into its grid. -> index | 'pending' | -1 (lost) */
    place(item) {
      const id = GR.gridFor(item);
      const cells = S()[id].cells;
      const i = cells.indexOf(null);
      if (i >= 0) {
        cells[i] = item;
        S().discovered.species[item.species] = true;
        GR.changed(id, { placed: [i] });
        return i;
      }
      if (id === 'vault' && S().vault.pending.length < B().storage.pendingSeedsMax) {
        S().vault.pending.push(item);
        GR.changed(id, { pending: true });
        return 'pending';
      }
      return -1;
    },
    /** Move waiting seeds into free vault cells */
    flushPending() {
      const v = S().vault;
      let moved = 0;
      while (v.pending.length) {
        const i = v.cells.indexOf(null);
        if (i < 0) break;
        v.cells[i] = v.pending.shift();
        moved += 1;
      }
      if (moved) GR.changed('vault', { flushed: moved });
      return moved;
    },
    hasRoom(id, n) { return GR.freeCount(id) >= (n || 1); },
    remove(id, i) {
      const it = S()[id].cells[i];
      S()[id].cells[i] = null;
      GR.changed(id, { removed: [i] });
      if (id === 'vault') GR.flushPending();
      return it;
    },
    move(id, from, to) {
      if (from === to) return false;
      const cells = S()[id].cells;
      const a = cells[from], b = cells[to];
      cells[to] = a;
      cells[from] = b || null;
      GR.changed(id, { moved: [from, to] });
      return true;
    },
    expand(id, n) {
      const cells = S()[id].cells;
      const target = Math.min(GR.maxSize(id), cells.length + n);
      while (cells.length < target) cells.push(null);
      GR.changed(id, { expanded: true });
      if (id === 'vault') GR.flushPending();
    },

    /* ------------------------------------------------------------ merge */
    merge(id, from, to) {
      const cells = S()[id].cells;
      const a = cells[to], b = cells[from];
      if (!I().canMerge(a, b)) return null;
      const first = B().gene.firstGeneAtMerge;
      const s = S();
      s.stats.breedMerges = (s.stats.breedMerges || 0) + 1;
      const forceGene = first > 0 && !s.flags.firstGene && !a.gene && !b.gene && s.stats.breedMerges >= first;
      const res = NOA.genetics.merge(a, b, { forceGene });
      cells[from] = null;
      cells[to] = res.item;
      s.stats.merges += 1;
      const fam = I().family(res.item);
      NOA.progress.addXP(B().xp.mergePerLevel * a.level);
      s.discovered.maxLevel[res.item.species] = Math.max(s.discovered.maxLevel[res.item.species] || 0, res.item.level);
      if (res.item.gene) GR.recordGene(res.item.gene.id, res.fx, fam);
      const now = Date.now();
      const win = NOA.mods.value('combo.windowMs', B().merge.comboWindowMs, {});
      GR.combo.count = now - GR.combo.last <= win ? GR.combo.count + 1 : 1;
      GR.combo.last = now;
      s.stats.maxCombo = Math.max(s.stats.maxCombo || 0, GR.combo.count);
      res.combo = GR.combo.count;
      GR.changed(id, { merged: to, from });
      if (id === 'vault') GR.flushPending();
      NOA.events.emit('merge.done', { grid: id, item: res.item, index: to, from, fx: res.fx, family: fam, combo: res.combo });
      return res;
    },
    recordGene(geneId, fx, family) {
      const s = S();
      if (fx && fx.some((f) => f.type === 'awaken')) s.stats.genesAwakened += 1;
      if (!s.discovered.genes[geneId]) {
        s.discovered.genes[geneId] = true;
        if (!s.flags.firstGene) s.flags.firstGene = true;
        if (family === 'animal' && !s.flags.firstAnimalGene) s.flags.firstAnimalGene = true;
        NOA.res.add('rp', B().gene.firstDiscoveryRP);
        NOA.progress.addXP(B().xp.discovery);
        NOA.events.emit('gene.discovered', { gene: geneId });
      }
    },

    /* ------------------------------------------------------------ boosters */
    applyBooster(id, boosterId, i) {
      const it = S()[id].cells[i];
      const def = C().boosters[boosterId];
      if (!it || !I().isBreed(it) || !def || def.target !== 'breed') return { error: 'target' };
      if ((S().boosters[boosterId] || 0) < 1) return { error: 'none' };
      if (boosterId === 'loupe') {
        if (it.revealed) return { error: 'already' };
        S().boosters.loupe -= 1;
        it.revealed = true;
        GR.changed(id, { updated: [i] });
        NOA.events.emit('booster.used', { id: boosterId, item: it });
        return { ok: true, carrier: it.carrier };
      }
      if (it.charm) return { error: 'charmed' };
      S().boosters[boosterId] -= 1;
      it.charm = boosterId;
      GR.changed(id, { updated: [i] });
      NOA.events.emit('booster.used', { id: boosterId, item: it });
      return { ok: true };
    },

    /* ------------------------------------------------------------ selling & locking */
    salePrice(item) {
      const m = B().market;
      NOA.barn.rollMarketDay();
      const key = 'breed:' + item.species + ':' + item.level;
      const sold = S().market.sold[key] || 0;
      const sat = Math.max(m.saturationFloor, 1 - sold * m.saturationStep);
      return Math.max(1, Math.round(I().breedValue(item) * sat * NOA.mods.value('coins.mult', 1, {})));
    },
    needsConfirm(item) { return !!(item.gene || item.level >= B().market.confirmSellMinLevel); },
    sell(id, i) {
      const it = S()[id].cells[i];
      if (!it || it.locked) return null;
      const price = GR.salePrice(it);
      const key = 'breed:' + it.species + ':' + it.level;
      S().market.sold[key] = (S().market.sold[key] || 0) + 1;
      GR.remove(id, i);
      NOA.res.add('coins', price);
      NOA.events.emit('item.sold', { item: it, price });
      return price;
    },
    /** Sell every unlocked Lv1 breed without a (visible) gene — keeps `keepPerSpecies` of each species */
    sellCommon(id, keepPerSpecies) {
      const cells = S()[id].cells;
      const seen = {};
      let total = 0, n = 0;
      cells.forEach((it, i) => {
        if (!it || it.locked || it.gene || it.level > 1 || (it.revealed && it.carrier)) return;
        seen[it.species] = (seen[it.species] || 0) + 1;
        if (seen[it.species] <= keepPerSpecies) return;
        total += GR.sell(id, i) || 0;
        n += 1;
      });
      return { n, total };
    },
    toggleLock(id, i) {
      const it = S()[id].cells[i];
      if (!it) return;
      it.locked = !it.locked;
      GR.changed(id, { updated: [i] });
    }
  };
})();
