/*
 * Research labs: 🌱 Greenhouse (plants) and 🐾 Ranch (animals).
 * Levels raise gene / breakthrough / hybrid chances (applied through NOA.mods in genetics.js),
 * unlock purity caps and fusion tiers, and add cross-breeding slots.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const LABS = { greenhouse: 'plant', ranch: 'animal' };

  const L = NOA.labs = {
    ids: Object.keys(LABS),
    family(lab) { return LABS[lab]; },
    grid(lab) { return lab === 'greenhouse' ? 'vault' : 'nursery'; },
    level(lab) { return S().labs[lab].level; },
    data(lab, level) { return B().labs.levels[level != null ? level : L.level(lab)]; },
    isOpen(lab) { return lab === 'greenhouse' || NOA.progress.isUnlocked('ranch'); },
    nextCost(lab) {
      const next = L.level(lab) + 1;
      if (next > B().labs.maxLevel) return null;
      return B().labs.levels[next].cost;
    },
    upgrade(lab) {
      if (!L.isOpen(lab)) return { error: 'locked' };
      const cost = L.nextCost(lab);
      if (!cost) return { error: 'max' };
      if (!NOA.res.spend(cost)) return { error: 'cost' };
      S().labs[lab].level += 1;
      L.syncSlots(lab);
      NOA.progress.addXP(B().xp.labUpgrade);
      NOA.events.emit('lab.upgraded', { lab, level: S().labs[lab].level });
      NOA.save.schedule();
      return { ok: true, level: S().labs[lab].level };
    },
    syncSlots(lab) {
      const want = L.data(lab).slots;
      const slots = S().labs[lab].slots;
      while (slots.length < want) slots.push(null);
    },
    hybridOpen(lab) { return NOA.progress.isUnlocked('hybrid') && L.data(lab).slots > 0; },

    /* ------------------------------------------------------------ cross-breeding */
    recipe(a, b) {
      return C().hybrids.find((h) => (h.a === a && h.b === b) || (h.a === b && h.b === a)) || null;
    },
    discoveryChance(lab) {
      return NOA.mods.chance('hybrid.discovery', B().hybrid.baseDiscovery, { family: L.family(lab) });
    },
    /** Grid cells (vault / nursery) that may enter a cross-breeding slot for this lab */
    candidates(lab) {
      const out = [];
      S()[L.grid(lab)].cells.forEach((it, i) => {
        if (it && I().isBreed(it) && !it.locked && !C().species[it.species].hybrid) out.push(i);
      });
      return out;
    },
    startHybrid(lab, slotIdx, idxA, idxB) {
      const slots = S().labs[lab].slots;
      const cells = S()[L.grid(lab)].cells;
      const a = cells[idxA], b = cells[idxB];
      if (!L.hybridOpen(lab) || slots[slotIdx] !== null || slotIdx >= slots.length) return { error: 'slot' };
      if (!a || !b || idxA === idxB || a.species === b.species) return { error: 'pair' };
      if (I().family(a) !== L.family(lab) || I().family(b) !== L.family(lab)) return { error: 'family' };
      if (!NOA.res.spend({ coins: B().hybrid.costCoins })) return { error: 'coins' };
      cells[idxA] = null;
      cells[idxB] = null;
      const now = NOA.time.now();
      slots[slotIdx] = { a, b, start: now, end: now + NOA.time.dur(B().hybrid.durationSec) };
      NOA.grids.changed(L.grid(lab), { removed: [idxA, idxB] });
      NOA.events.emit('lab.changed', { lab });
      return { ok: true };
    },
    collectHybrid(lab, slotIdx) {
      const slots = S().labs[lab].slots;
      const job = slots[slotIdx];
      if (!job || NOA.time.now() < job.end) return null;
      if (!NOA.grids.hasRoom(L.grid(lab)) && L.grid(lab) === 'nursery') return { error: 'full' };
      const rec = L.recipe(job.a.species, job.b.species);
      const h = B().hybrid;
      let result;
      if (rec && U.chance(L.discoveryChance(lab))) {
        const fx = [];
        const ctx = NOA.genetics.ctxFor(job.a, job.b, 'hybrid');
        const level = Math.min(job.a.level, job.b.level);
        const cap = B().merge.statCapByLevel[level] + h.vigorBonus;
        const stats = {};
        for (const s of I().STATS) stats[s] = U.clamp(Math.round((job.a.stats[s] + job.b.stats[s]) / 2 + h.vigorBonus), 1, cap);
        const g = NOA.genetics.resolveGene(job.a, job.b, ctx, fx);
        const item = I().newBreed(rec.result, level, { stats, gene: g.gene, carrier: g.carrier });
        const isNew = !S().discovered.hybrids[rec.result];
        S().discovered.hybrids[rec.result] = true;
        S().discovered.species[rec.result] = true;
        if (isNew) {
          S().flags.firstHybrid = true;
          NOA.progress.addXP(B().xp.hybrid);
        }
        if (item.gene) NOA.grids.recordGene(item.gene.id, fx, I().family(item));
        const where = NOA.grids.place(item);
        result = { success: true, item, isNew, species: rec.result, where, fx };
      } else {
        const keep = job.a.level >= job.b.level ? job.a : job.b;
        const where = NOA.grids.place(keep);
        NOA.res.add('rp', h.failRefundRP);
        result = { success: false, item: keep, compatible: !!rec, where, rp: h.failRefundRP };
      }
      slots[slotIdx] = null;
      NOA.events.emit('hybrid.done', Object.assign({ lab }, result));
      NOA.events.emit('lab.changed', { lab });
      NOA.save.schedule();
      return result;
    },
    tick() {
      for (const lab of L.ids) {
        L.syncSlots(lab);
        for (const job of S().labs[lab].slots) {
          if (job && !job._ready && NOA.time.now() >= job.end) {
            job._ready = true;
            NOA.events.emit('lab.changed', { lab, ready: true });
          }
        }
      }
    }
  };
})();
