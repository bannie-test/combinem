/*
 * 🏭 Processing buildings (Township / Hay Day style): recipes turn barn goods into processed goods.
 * Each building runs one job at a time; extra queue slots hold waiting jobs.
 * Output quality: average stars of the inputs (+ a small chance of +1★); the gene survives only
 * when every input shares it (otherwise the usual low "gene + normal" chance applies).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const P = NOA.production = {
    ids() { return Object.keys(B().production.buildings); },
    cfg(bId) { return B().production.buildings[bId]; },
    isOpen(bId) { return S().level >= P.cfg(bId).unlockLevel; },
    recipesFor(bId) { return Object.keys(B().recipes).filter((pid) => B().recipes[pid].building === bId); },
    inputUnlocked(id) {
      if (I().isMaterial(id)) return true;
      return NOA.progress.speciesUnlocked(I().productSpecies(id)) && (!B().recipes[id] || P.recipeUnlocked(id));
    },
    recipeUnlocked(pid) {
      const r = B().recipes[pid];
      if (!r || !P.isOpen(r.building)) return false;
      return Object.keys(r.inputs).every((id) => P.inputUnlocked(id));
    },
    jobMs(pid) {
      return Math.max(1000, NOA.time.dur(B().recipes[pid].timeSec * NOA.mods.value('production.timeMult', 1, {})));
    },
    queue(bId) { return S().factories[bId].queue; },
    slots(bId) { return S().factories[bId].slots; },
    hasInputs(pid) {
      const r = B().recipes[pid];
      return Object.keys(r.inputs).every((id) => NOA.barn.has(id, r.inputs[id]));
    },
    canStart(pid) {
      const r = B().recipes[pid];
      return P.recipeUnlocked(pid) && P.queue(r.building).length < P.slots(r.building) && P.hasInputs(pid);
    },
    start(pid) {
      const r = B().recipes[pid];
      if (!P.recipeUnlocked(pid)) return { error: 'locked' };
      if (P.queue(r.building).length >= P.slots(r.building)) return { error: 'queue' };
      if (!P.hasInputs(pid)) return { error: 'inputs' };
      const taken = [];
      for (const id in r.inputs) taken.push(...NOA.barn.take(id, r.inputs[id]));
      const out = P.outputQuality(taken);
      const q = P.queue(r.building);
      const now = NOA.time.now();
      const startAt = q.length ? Math.max(now, q[q.length - 1].end) : now;
      q.push({ pid, start: startAt, end: startAt + P.jobMs(pid), stars: out.stars, gene: out.gene });
      NOA.events.emit('production.started', { building: r.building, pid });
      NOA.events.emit('factory.changed', { building: r.building });
      NOA.save.schedule();
      return { ok: true };
    },
    outputQuality(taken) {
      const goods = taken.filter((t) => !I().isMaterial(I().parseKey(t.key).pid));
      let n = 0, sum = 0;
      goods.forEach((t) => { sum += t.stars * t.n; n += t.n; });
      let stars = n ? Math.round(sum / n) : 1;
      if (stars < 5 && U.chance(B().production.starUpChance)) stars += 1;
      let gene = null;
      const genes = goods.filter((t) => t.gene);
      if (genes.length) {
        const allSame = genes.length === goods.length && genes.every((t) => t.gene.id === genes[0].gene.id);
        const keep = allSame ? B().gene.keep.sameGene : B().gene.keep.withNormal;
        if (U.chance(keep)) {
          const best = genes.reduce((a, t) => (t.gene.purity > a.gene.purity ? t : a), genes[0]);
          gene = { id: best.gene.id, purity: allSame ? best.gene.purity : Math.max(1, best.gene.purity - 1) };
        }
      }
      return { stars, gene };
    },
    readyJobs(bId) { return P.queue(bId).filter((j) => NOA.time.now() >= j.end); },
    collect(bId) {
      const q = P.queue(bId);
      const out = [];
      while (q.length && NOA.time.now() >= q[0].end) {
        if (NOA.barn.free() < 1) return { items: out, error: 'barn' };
        const j = q.shift();
        NOA.barn.add(j.pid, 1, { stars: j.stars, gene: j.gene, force: true });
        out.push(j);
        S().stats.crafted = (S().stats.crafted || 0) + 1;
        NOA.progress.addXP(B().recipes[j.pid].timeSec * B().production.xpPerSecond);
      }
      if (out.length) {
        NOA.events.emit('production.collected', { building: bId, items: out });
        NOA.events.emit('factory.changed', { building: bId });
      }
      return { items: out };
    },
    nextSlotCost(bId) {
      const c = P.cfg(bId);
      const n = P.slots(bId);
      if (n >= c.slotsMax) return null;
      return c.slotCost[n] || 0;
    },
    unlockSlot(bId) {
      const cost = P.nextSlotCost(bId);
      if (cost == null) return { error: 'max' };
      if (cost && !NOA.res.spend({ coins: cost })) return { error: 'coins' };
      S().factories[bId].slots += 1;
      NOA.events.emit('factory.changed', { building: bId });
      return { ok: true };
    },
    /** Growth tonic: finish the running job now (waiting jobs move up) */
    tonic(bId) {
      const q = P.queue(bId);
      const now = NOA.time.now();
      const i = q.findIndex((j) => now < j.end);
      if (i < 0 || (S().boosters.tonic || 0) < 1) return false;
      S().boosters.tonic -= 1;
      const saved = q[i].end - now;
      q[i].end = now;
      for (let k = i + 1; k < q.length; k++) { q[k].start -= saved; q[k].end -= saved; }
      NOA.events.emit('booster.used', { id: 'tonic' });
      NOA.events.emit('factory.changed', { building: bId });
      return true;
    },
    tick() {
      for (const bId of P.ids()) {
        const n = P.readyJobs(bId).length;
        const f = S().factories[bId];
        if (n !== (f._r || 0)) { f._r = n; NOA.events.emit('factory.changed', { building: bId, ready: true }); }
      }
    }
  };
})();
