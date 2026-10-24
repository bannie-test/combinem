/*
 * 📦 Kho nông sản (barn): products and materials stored as stacks with a shared capacity
 * (Hay Day style). Variants of the same product (stars / gene) are separate stacks.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const S = () => NOA.state;
  const I = () => NOA.items;

  const BN = NOA.barn = {
    items() { return S().barn.items; },
    cap() {
      const s = B().storage;
      return Math.round(NOA.mods.value('barn.cap', s.barnStart + S().barn.upgrades * s.barnUpgrade.step, {}));
    },
    used() { let n = 0; for (const k in BN.items()) n += BN.items()[k]; return n; },
    free() { return Math.max(0, BN.cap() - BN.used()); },
    changed(detail) { NOA.events.emit('barn.changed', detail || {}); NOA.save.schedule(); },

    /** Add goods. force=true ignores capacity (rewards, refunds). -> false when it does not fit */
    add(pid, n, opts) {
      opts = opts || {};
      if (!n) return true;
      if (!opts.force && BN.free() < n) return false;
      const key = I().key(pid, opts.stars, opts.gene);
      BN.items()[key] = (BN.items()[key] || 0) + n;
      if (!I().isMaterial(pid)) S().discovered.products[pid] = true;
      BN.changed({ added: pid });
      return true;
    },
    addKey(key, n) {
      BN.items()[key] = (BN.items()[key] || 0) + n;
      BN.changed({ added: key });
    },
    /** Stacks of a product that satisfy a requirement, cheapest first */
    variants(pid, req) {
      req = req || {};
      const out = [];
      for (const key in BN.items()) {
        const n = BN.items()[key];
        if (!n) continue;
        const p = I().parseKey(key);
        if (p.pid !== pid) continue;
        if (req.minStars && p.stars < req.minStars) continue;
        if (req.needGene && !p.gene) continue;
        out.push({ key, n, stars: p.stars, gene: p.gene, value: I().keyValue(key) });
      }
      // plain goods first, gene goods last, then by value
      out.sort((a, b) => (!!a.gene - !!b.gene) || (a.value - b.value));
      return out;
    },
    count(pid, req) { return BN.variants(pid, req).reduce((a, v) => a + v.n, 0); },
    has(pid, n, req) { return BN.count(pid, req) >= n; },
    /** Remove n of a product (cheapest matching stacks first). -> [{key, n, stars, gene}] or null */
    take(pid, n, req) {
      if (!BN.has(pid, n, req)) return null;
      const taken = [];
      let left = n;
      for (const v of BN.variants(pid, req)) {
        if (!left) break;
        const k = Math.min(v.n, left);
        BN.items()[v.key] -= k;
        if (BN.items()[v.key] <= 0) delete BN.items()[v.key];
        taken.push({ key: v.key, n: k, stars: v.stars, gene: v.gene, value: v.value });
        left -= k;
      }
      BN.changed({ taken: pid });
      return taken;
    },
    takeKey(key, n) {
      const have = BN.items()[key] || 0;
      if (have < n) return false;
      BN.items()[key] = have - n;
      if (BN.items()[key] <= 0) delete BN.items()[key];
      BN.changed({ taken: key });
      return true;
    },

    /* ------------------------------------------------------------ selling */
    rollMarketDay() {
      const day = NOA.time.dayKey();
      if (S().market.day !== day) { S().market.day = day; S().market.sold = {}; }
    },
    salePrice(key) { return BN.quote(key, 1); },
    /** Coins for selling n of a stack right now (each sale lowers today's price a little) */
    quote(key, n) {
      const m = B().market;
      BN.rollMarketDay();
      const pid = I().parseKey(key).pid;
      const sold = S().market.sold[pid] || 0;
      const base = I().keyValue(key) * NOA.mods.value('coins.mult', 1, {});
      let total = 0;
      for (let k = 0; k < n; k++) total += Math.max(1, Math.round(base * Math.max(m.saturationFloor, 1 - (sold + k) * m.saturationStep)));
      return total;
    },
    sell(key, n) {
      let total = 0, sold = 0;
      const pid = I().parseKey(key).pid;
      for (let i = 0; i < n; i++) {
        if (!(BN.items()[key] > 0)) break;
        total += BN.salePrice(key);
        BN.items()[key] -= 1;
        if (BN.items()[key] <= 0) delete BN.items()[key];
        S().market.sold[pid] = (S().market.sold[pid] || 0) + 1;
        sold += 1;
      }
      if (!sold) return null;
      NOA.res.add('coins', total);
      BN.changed({ sold: key });
      NOA.events.emit('goods.sold', { key, n: sold, price: total });
      return { n: sold, total };
    },

    /* ------------------------------------------------------------ upgrades */
    upgradeCost() {
      const u = B().storage.barnUpgrade;
      return Math.round(u.costBase * Math.pow(u.costGrowth, S().barn.upgrades));
    },
    canUpgrade() {
      const u = B().storage.barnUpgrade;
      return B().storage.barnStart + (S().barn.upgrades + 1) * u.step <= u.max;
    },
    upgrade() {
      if (!BN.canUpgrade()) return { error: 'max' };
      if (!NOA.res.spend({ coins: BN.upgradeCost() })) return { error: 'coins' };
      S().barn.upgrades += 1;
      BN.changed({ upgraded: true });
      return { ok: true, cap: BN.cap() };
    }
  };
})();
