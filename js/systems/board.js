/*
 * Board logic: placement, storage overflow, generators, moving / swapping,
 * attaching luck boosters, selling.  No DOM here (the view lives in js/ui/farm-view.js).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const BD = NOA.board = {
    combo: { count: 0, last: 0 },
    cols() { return B().board.cols; },
    rows() { return B().board.rows; },
    get(i) { return S().board[i] || null; },
    indexOf(id) { return S().board.findIndex((it) => it && it.id === id); },
    freeCount() { return S().board.filter((x) => !x).length; },
    changed(detail) { NOA.events.emit('board.changed', detail || {}); NOA.save.schedule(); },

    /** Nearest empty cell to `from` (index) by grid distance; null `from` = top-centre */
    nearestEmpty(from) {
      const cols = BD.cols(), rows = BD.rows();
      const origin = from == null ? Math.floor(cols / 2) : from;
      const ox = origin % cols, oy = Math.floor(origin / cols);
      let best = -1, bestD = Infinity;
      for (let i = 0; i < cols * rows; i++) {
        if (S().board[i]) continue;
        const dx = (i % cols) - ox, dy = Math.floor(i / cols) - oy;
        const d = dx * dx + dy * dy + (dy < 0 ? 0.01 : 0);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    },
    place(item, near) {
      const i = BD.nearestEmpty(near);
      if (i < 0) return -1;
      S().board[i] = item;
      BD.changed({ placed: [i] });
      return i;
    },
    /** Board first, storage second. -> { where:'board', index } | { where:'storage' } | null */
    placeOrStore(item, near) {
      const i = BD.place(item, near);
      if (i >= 0) return { where: 'board', index: i };
      if (S().storage.length < S().storageCap) {
        S().storage.push(item);
        NOA.events.emit('storage.changed', {});
        NOA.save.schedule();
        return { where: 'storage' };
      }
      return null;
    },
    hasRoom(n) { return BD.freeCount() + (S().storageCap - S().storage.length) >= (n || 1); },
    remove(i) {
      const it = S().board[i];
      S().board[i] = null;
      BD.changed({ removed: [i] });
      return it;
    },
    move(from, to) {
      if (from === to) return false;
      const a = S().board[from], b = S().board[to];
      S().board[to] = a;
      S().board[from] = b || null;
      BD.changed({ moved: [from, to] });
      return true;
    },
    takeFromStorage(idx) {
      const it = S().storage[idx];
      if (!it) return -1;
      const i = BD.nearestEmpty(null);
      if (i < 0) return -1;
      S().storage.splice(idx, 1);
      S().board[i] = it;
      BD.changed({ placed: [i] });
      NOA.events.emit('storage.changed', {});
      return i;
    },
    toStorage(i) {
      const it = S().board[i];
      if (!it || it.kind === 'generator') return false;
      if (S().storage.length >= S().storageCap) return false;
      S().board[i] = null;
      S().storage.push(it);
      BD.changed({ removed: [i] });
      NOA.events.emit('storage.changed', {});
      return true;
    },

    /* ------------------------------------------------------------ generators */
    spawnPool(family) {
      const w = {};
      const lv = S().level;
      for (const id in C().species) {
        const sp = C().species[id];
        if (sp.family !== family) continue;
        if (sp.hybrid) {
          if (S().discovered.hybrids[id]) w[id] = B().hybrid.hybridSpawnWeight;
        } else if (B().species[id].unlockLevel <= lv) {
          w[id] = B().species[id].spawnWeight;
        }
      }
      return w;
    },
    /** Tap on a generator -> { item, index } or { error } */
    spawn(genIndex) {
      const gen = S().board[genIndex];
      if (!gen || gen.kind !== 'generator') return { error: 'none' };
      const cfg = B().generators[gen.generator];
      const fam = C().generators[gen.generator].family;
      if (BD.freeCount() < 1) return { error: 'full' };
      if (S().res.energy < cfg.energy) return { error: 'energy' };
      NOA.res.spend({ energy: cfg.energy });
      let species = NOA.hooks.run('spawn.species', null, { family: fam, gen: gen.generator });
      if (!species) species = U.pickWeighted(BD.spawnPool(fam));
      const lv2 = NOA.mods.chance('gen.lv2', 0, { family: fam });
      const level = U.chance(lv2) ? 2 : 1;
      const item = I().newBreed(species, level);
      const index = BD.place(item, genIndex);
      S().discovered.species[species] = true;
      NOA.events.emit('item.spawned', { item, index, genIndex, family: fam });
      return { item, index };
    },

    /* ------------------------------------------------------------ boosters */
    /** Attach a luck booster (clover / stabilizer / stardust) or use the loupe on a breed item */
    applyBooster(boosterId, boardIndex) {
      const it = S().board[boardIndex];
      const def = C().boosters[boosterId];
      if (!it || !I().isBreed(it) || !def || def.target !== 'breed') return { error: 'target' };
      if ((S().boosters[boosterId] || 0) < 1) return { error: 'none' };
      if (boosterId === 'loupe') {
        if (it.revealed) return { error: 'already' };
        S().boosters.loupe -= 1;
        it.revealed = true;
        BD.changed({ updated: [boardIndex] });
        NOA.events.emit('booster.used', { id: boosterId, item: it });
        return { ok: true, carrier: it.carrier };
      }
      if (it.charm) return { error: 'charmed' };
      S().boosters[boosterId] -= 1;
      it.charm = boosterId;
      BD.changed({ updated: [boardIndex] });
      NOA.events.emit('booster.used', { id: boosterId, item: it });
      return { ok: true };
    },

    /* ------------------------------------------------------------ merge on the board */
    /** Drag `from` onto `to` -> merge result or null */
    merge(from, to) {
      const a = S().board[to], b = S().board[from];
      if (!I().canMerge(a, b)) return null;
      const first = B().gene.firstGeneAtMerge;
      const breedMerge = I().isBreed(a);
      if (breedMerge) S().stats.breedMerges = (S().stats.breedMerges || 0) + 1;
      const forceGene = breedMerge && first > 0 && !S().flags.firstGene && !a.gene && !b.gene && S().stats.breedMerges >= first;
      const res = NOA.genetics.merge(a, b, { forceGene });
      S().board[from] = null;
      S().board[to] = res.item;
      S().stats.merges += 1;
      const fam = I().family(res.item);
      if (I().isBreed(res.item)) {
        NOA.progress.addXP(B().xp.mergePerLevel * a.level);
        const key = res.item.species;
        S().discovered.maxLevel[key] = Math.max(S().discovered.maxLevel[key] || 0, res.item.level);
      } else {
        S().discovered.products[res.item.product] = true;
      }
      if (res.item.gene) BD.recordGene(res.item.gene.id, res.fx, fam);
      // combo: merges inside the window climb the musical scale (and can unlock a secret)
      const now = Date.now();
      const win = NOA.mods.value('combo.windowMs', B().merge.comboWindowMs, {});
      BD.combo.count = now - BD.combo.last <= win ? BD.combo.count + 1 : 1;
      BD.combo.last = now;
      S().stats.maxCombo = Math.max(S().stats.maxCombo || 0, BD.combo.count);
      res.combo = BD.combo.count;
      BD.changed({ merged: to, from });
      NOA.events.emit('merge.done', { item: res.item, index: to, from, fx: res.fx, family: fam, combo: res.combo });
      return res;
    },
    recordGene(geneId, fx, family) {
      const s = S();
      const awakened = fx && fx.some((f) => f.type === 'awaken');
      if (awakened) s.stats.genesAwakened += 1;
      if (!s.discovered.genes[geneId]) {
        s.discovered.genes[geneId] = true;
        if (!s.flags.firstGene) s.flags.firstGene = true;
        if (family === 'animal' && !s.flags.firstAnimalGene) s.flags.firstAnimalGene = true;
        NOA.res.add('rp', B().gene.firstDiscoveryRP);
        NOA.progress.addXP(B().xp.discovery);
        NOA.events.emit('gene.discovered', { gene: geneId });
      }
    },

    /* ------------------------------------------------------------ selling */
    salePrice(item) {
      const base = I().value(item);
      const m = B().market;
      BD.rollMarketDay();
      const sold = S().market.sold[I().marketKey(item)] || 0;
      const sat = Math.max(m.saturationFloor, 1 - sold * m.saturationStep);
      return Math.max(1, Math.round(base * sat * NOA.mods.value('coins.mult', 1, {})));
    },
    rollMarketDay() {
      const day = NOA.time.dayKey();
      if (S().market.day !== day) { S().market.day = day; S().market.sold = {}; }
    },
    needsConfirm(item) {
      return !!(item.gene || (I().isBreed(item) && item.level >= B().market.confirmSellMinLevel));
    },
    sell(i) {
      const it = S().board[i];
      if (!it || it.kind === 'generator' || it.locked) return null;
      const price = BD.salePrice(it);
      const key = I().marketKey(it);
      S().market.sold[key] = (S().market.sold[key] || 0) + 1;
      BD.remove(i);
      NOA.res.add('coins', price);
      NOA.events.emit('item.sold', { item: it, price, index: i });
      return price;
    },
    toggleLock(i) {
      const it = S().board[i];
      if (!it || it.kind === 'generator') return;
      it.locked = !it.locked;
      BD.changed({ updated: [i] });
    }
  };
})();
