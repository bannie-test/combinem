/*
 * Rewards: one grant() used by login days, level-ups, shop, secrets, gacha currency and payments.
 * Reward shape: { coins, gems, energy, rp, tickets:{sprout,star}, boosters:{id:n}, storage, mascot, items:[spec] }
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;

  const R = NOA.rewards = {
    /** Apply a reward; returns display entries [{ icon, key, n, params }] */
    grant(r, source) {
      const out = [];
      if (!r) return out;
      const s = S();
      if (r.coins) { NOA.res.add('coins', r.coins); out.push({ icon: '🪙', key: 'res.coins', n: r.coins }); }
      if (r.gems) { NOA.res.add('gems', r.gems); out.push({ icon: '💎', key: 'res.gems', n: r.gems }); }
      if (r.energy) { NOA.res.add('energy', r.energy); out.push({ icon: '⚡', key: 'res.energy', n: r.energy }); }
      if (r.energyFull) {
        const need = Math.max(0, NOA.res.energyMax() - s.res.energy);
        NOA.res.add('energy', need);
        out.push({ icon: '⚡', key: 'res.energy', n: need });
      }
      if (r.rp) { NOA.res.add('rp', r.rp); out.push({ icon: '🔬', key: 'res.rp', n: r.rp }); }
      for (const t in r.tickets || {}) {
        s.tickets[t] = (s.tickets[t] || 0) + r.tickets[t];
        out.push({ icon: '🎟️', key: 'ticket.' + t, n: r.tickets[t] });
      }
      for (const b in r.boosters || {}) {
        s.boosters[b] = (s.boosters[b] || 0) + r.boosters[b];
        out.push({ icon: C().boosters[b].emoji, key: 'booster.' + b, n: r.boosters[b] });
      }
      if (r.storage) {
        s.storageCap = Math.min(B().board.storageMax, s.storageCap + r.storage);
        out.push({ icon: '📦', key: 'res.storage', n: r.storage });
      }
      if (r.mascot) {
        const m = NOA.mascots.add(r.mascot);
        out.push({ icon: C().mascots[r.mascot].emoji, key: 'mascot.' + r.mascot, n: 1, mascot: m });
      }
      for (const spec of r.items || []) {
        const item = R.makeItem(spec);
        const where = NOA.board.placeOrStore(item, null);
        out.push({ icon: NOA.items.emoji(item), key: null, label: NOA.items.name(item), n: 1, item, where });
      }
      NOA.events.emit('rewards.granted', { source, entries: out });
      NOA.events.emit('res.changed', { k: 'all' });
      NOA.save.schedule();
      return out;
    },
    makeItem(spec) {
      if (spec.kind === 'product') return NOA.items.newProduct(spec.product, spec.stars || 1, spec.gene || null);
      const gene = spec.gene ? { id: spec.gene, purity: spec.purity || 1 } : null;
      return NOA.items.newBreed(spec.species, spec.level || 1, { gene });
    },

    levelReward(level) {
      const t = B().levelRewards[level];
      if (t) return t;
      const f = B().levelRewardFormula;
      const r = { coins: f.coinsBase + f.coinsPerLevel * level, gems: f.gems, energy: f.energy };
      if (f.starTicketEvery && level % f.starTicketEvery === 0) r.tickets = { star: 1 };
      return r;
    },

    /* ------------------------------------------------------------ daily login */
    login: {
      days() { return B().login.days; },
      canClaim() { return S().login.lastDay !== NOA.time.dayKey(); },
      /** index of the day that the next claim pays */
      dayIndex() {
        const s = S().login;
        const days = B().login.days.length;
        if (B().login.resetOnMiss && s.lastDay) {
          const y = NOA.time.dayKey(NOA.time.now() - NOA.time.DAY);
          if (s.lastDay !== y && s.lastDay !== NOA.time.dayKey()) return 0;
        }
        return s.claimed % days;
      },
      claim() {
        if (!R.login.canClaim()) return null;
        const idx = R.login.dayIndex();
        const reward = B().login.days[idx];
        const s = S().login;
        if (B().login.resetOnMiss && idx === 0) s.claimed = 0;
        s.claimed += 1;
        s.lastDay = NOA.time.dayKey();
        const granted = R.grant(reward, 'login');
        NOA.events.emit('login.claimed', { day: idx, granted });
        return { day: idx, granted };
      }
    }
  };
})();
