/*
 * Rewards: one grant() used by login days, level-ups, shop, secrets, gacha and payments.
 * Reward shape: { coins, gems, rp, tickets:{sprout,star}, boosters:{id:n}, materials:{id:n}, products:{id:n},
 *                 seeds:[{species,level,gene?,purity?}], animals:[...], vault:n, nursery:n, mascot }
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;

  const R = NOA.rewards = {
    /** Apply a reward; returns display entries [{ icon, key, n, label? }] */
    grant(r, source) {
      const out = [];
      if (!r) return out;
      const s = S();
      if (r.coins) { NOA.res.add('coins', r.coins); out.push({ icon: '🪙', key: 'res.coins', n: r.coins }); }
      if (r.gems) { NOA.res.add('gems', r.gems); out.push({ icon: '💎', key: 'res.gems', n: r.gems }); }
      if (r.rp) { NOA.res.add('rp', r.rp); out.push({ icon: '🔬', key: 'res.rp', n: r.rp }); }
      for (const t in r.tickets || {}) {
        s.tickets[t] = (s.tickets[t] || 0) + r.tickets[t];
        out.push({ icon: '🎟️', key: 'ticket.' + t, n: r.tickets[t] });
      }
      for (const b in r.boosters || {}) {
        s.boosters[b] = (s.boosters[b] || 0) + r.boosters[b];
        out.push({ icon: C().boosters[b].emoji, key: 'booster.' + b, n: r.boosters[b] });
      }
      for (const m in r.materials || {}) {
        NOA.barn.add(m, r.materials[m], { force: true });
        out.push({ icon: C().materials[m].emoji, key: 'material.' + m, n: r.materials[m] });
      }
      for (const pid in r.products || {}) {
        NOA.barn.add(pid, r.products[pid], { force: true });
        out.push({ icon: C().products[pid].emoji, key: 'product.' + pid, n: r.products[pid] });
      }
      for (const spec of (r.seeds || []).concat(r.animals || [])) {
        const item = R.makeItem(spec);
        const where = NOA.grids.place(item);
        out.push({ icon: NOA.items.emoji(item), key: null, label: NOA.items.name(item) + ' Lv' + item.level, n: 1, item, where });
      }
      if (r.vault) { NOA.grids.expand('vault', r.vault); out.push({ icon: '🌰', key: 'res.vault', n: r.vault }); }
      if (r.nursery) { NOA.grids.expand('nursery', r.nursery); out.push({ icon: '🐣', key: 'res.nursery', n: r.nursery }); }
      if (r.mascot) {
        const m = NOA.mascots.add(r.mascot);
        out.push({ icon: C().mascots[r.mascot].emoji, key: 'mascot.' + r.mascot, n: 1, mascot: m });
      }
      NOA.events.emit('rewards.granted', { source, entries: out });
      NOA.events.emit('res.changed', { k: 'all' });
      NOA.save.schedule();
      return out;
    },
    makeItem(spec) {
      const gene = spec.gene ? { id: spec.gene, purity: spec.purity || 1 } : null;
      return NOA.items.newBreed(spec.species, spec.level || 1, { gene });
    },

    levelReward(level) {
      const t = B().levelRewards[level];
      if (t) return t;
      const f = B().levelRewardFormula;
      const r = { coins: f.coinsBase + f.coinsPerLevel * level, gems: f.gems, materials: { manure: f.manure } };
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
