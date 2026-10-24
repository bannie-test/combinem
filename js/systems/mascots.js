/*
 * Mascots (linh vật): temporary ones buff for a duration (duplicates stack time);
 * permanent ones work while placed in the shrine (duplicates add stars).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;

  const M = NOA.mascots = {
    def(id) { return C().mascots[id]; },
    stars(id) { const o = S().mascots.owned[id]; return o ? o.stars : 0; },
    tempRemaining(id) { return Math.max(0, (S().mascots.temp[id] || 0) - NOA.time.now()); },
    isActive(id) {
      const d = M.def(id);
      if (!d) return false;
      if (d.type === 'temp') return M.tempRemaining(id) > 0;
      return S().mascots.shrine.indexOf(id) >= 0;
    },
    add(id) {
      const d = M.def(id);
      const s = S().mascots;
      const isNew = !S().discovered.mascots[id];
      S().discovered.mascots[id] = true;
      if (d.type === 'temp') {
        const now = NOA.time.now();
        const minutes = B().mascots.durationMin[id] || 10;
        s.temp[id] = Math.max(now, s.temp[id] || 0) + NOA.time.dur(minutes * 60);
        NOA.events.emit('mascots.changed', { id });
        return { isNew, type: 'temp', minutes };
      }
      const owned = s.owned[id];
      if (!owned) {
        s.owned[id] = { stars: 1 };
        const free = s.shrine.indexOf(null);
        if (free >= 0) s.shrine[free] = id;
        NOA.events.emit('mascots.changed', { id });
        return { isNew: true, type: 'perm', stars: 1, placed: free >= 0 };
      }
      const max = B().gacha.duplicatePerm.maxStars;
      if (owned.stars < max) {
        owned.stars += 1;
        NOA.events.emit('mascots.changed', { id });
        return { isNew, type: 'perm', stars: owned.stars, starUp: true };
      }
      const gems = B().gacha.duplicatePerm.overflowGems;
      NOA.res.add('gems', gems);
      return { isNew, type: 'perm', stars: owned.stars, overflowGems: gems };
    },
    place(id, slot) {
      const s = S().mascots;
      if (!s.owned[id] || slot < 0 || slot >= s.shrine.length) return false;
      const cur = s.shrine.indexOf(id);
      if (cur >= 0) s.shrine[cur] = null;
      s.shrine[slot] = id;
      NOA.events.emit('mascots.changed', {});
      NOA.save.schedule();
      return true;
    },
    unplace(slot) {
      S().mascots.shrine[slot] = null;
      NOA.events.emit('mascots.changed', {});
      NOA.save.schedule();
    },
    /** Effects of every active mascot with star scaling */
    activeMods() {
      const out = [];
      const eff = B().mascots.effects;
      const push = (id, stars) => {
        for (const e of eff[id] || []) {
          const extra = (e.perStar || 0) * Math.max(0, stars - 1);
          const m = { key: e.key, src: 'mascot', id };
          if (e.mult != null) m.mult = e.mult + extra;
          if (e.add != null) m.add = e.add + extra;
          out.push(m);
        }
      };
      for (const id in S().mascots.temp) if (M.tempRemaining(id) > 0) push(id, 1);
      for (const id of S().mascots.shrine) if (id) push(id, M.stars(id));
      return out;
    },
    tick() {
      const t = S().mascots.temp;
      for (const id in t) {
        if (t[id] <= NOA.time.now()) {
          delete t[id];
          NOA.events.emit('mascot.expired', { id });
          NOA.events.emit('mascots.changed', {});
        }
      }
    }
  };

  NOA.mods.register('mascots', () => (NOA.state ? M.activeMods() : []));
})();
