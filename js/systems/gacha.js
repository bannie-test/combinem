/*
 * Blindbox (gacha): rarity roll with pity counters, x10 guarantee, reward pools,
 * and a rate-disclosure table computed straight from config/balance.js.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const order = () => B().gacha.rarityOrder;
  const rIdx = (r) => order().indexOf(r);

  const GA = NOA.gacha = {
    box(id) { return B().gacha.boxes[id]; },
    state(id) {
      const s = S().gacha;
      if (!s[id]) s[id] = { opened: 0, since: {} };
      return s[id];
    },
    isUnlocked(id) { return NOA.progress.isUnlocked(C().boxes[id].unlock); },

    /** Cost for opening `count`: tickets first, otherwise currency (x10 discounted) */
    cost(id, count) {
      const box = GA.box(id);
      const tickets = S().tickets[box.ticket] || 0;
      if (tickets >= count) return { tickets: { [box.ticket]: count } };
      const mult = count > 1 ? box.multi.costMult : 1;
      const out = {};
      for (const k in box.cost) out[k] = box.cost[k] * mult;
      return out;
    },
    canOpen(id, count) {
      if (!GA.isUnlocked(id)) return { ok: false, reason: 'locked' };
      const cost = GA.cost(id, count);
      if (!NOA.res.canAfford(cost)) return { ok: false, reason: 'cost', cost };
      return { ok: true, cost };
    },

    /* ------------------------------------------------------------ rolling */
    forcedMin(id) {
      const box = GA.box(id), st = GA.state(id);
      let min = -1;
      for (const r in box.pity || {}) {
        if ((st.since[r] || 0) + 1 >= box.pity[r]) min = Math.max(min, rIdx(r));
      }
      return min;
    },
    rollRarity(id, minIdx) {
      const box = GA.box(id);
      const w = {};
      for (const r of order()) {
        const wt = box.rarityWeights[r] || 0;
        const pool = box.pool[r] || {};
        if (wt > 0 && Object.keys(pool).length && rIdx(r) >= (minIdx || 0)) w[r] = wt;
      }
      let r = U.pickWeighted(w);
      if (!r) {
        // nothing at or above the forced floor has weight: take the lowest non-empty rarity above it
        r = order().find((x, i) => i >= minIdx && Object.keys(box.pool[x] || {}).length) || order()[0];
      }
      return r;
    },
    updatePity(id, rarity) {
      const box = GA.box(id), st = GA.state(id);
      for (const r in box.pity || {}) {
        if (rIdx(rarity) >= rIdx(r)) st.since[r] = 0;
        else st.since[r] = (st.since[r] || 0) + 1;
      }
    },
    /** Pure roll (no granting) — used by open() and by the simulator */
    roll(id, count) {
      const box = GA.box(id);
      const rarities = [];
      for (let i = 0; i < count; i++) {
        let min = GA.forcedMin(id);
        const isLast = i === count - 1;
        if (count > 1 && isLast && box.multi && box.multi.guaranteeMinRarity) {
          const g = rIdx(box.multi.guaranteeMinRarity);
          if (!rarities.some((r) => rIdx(r) >= g)) min = Math.max(min, g);
        }
        const r = GA.rollRarity(id, min);
        GA.updatePity(id, r);
        rarities.push(r);
      }
      return rarities.map((r) => ({ rarity: r, reward: U.pickWeighted(box.pool[r]) }));
    },
    open(id, count) {
      const can = GA.canOpen(id, count);
      if (!can.ok) return can;
      NOA.res.spend(can.cost);
      const rolls = GA.roll(id, count);
      const st = GA.state(id);
      st.opened += count;
      S().stats.opens += count;
      const results = rolls.map((r) => Object.assign({ rarity: r.rarity, rewardId: r.reward }, GA.apply(r.reward)));
      NOA.events.emit('gacha.opened', { box: id, count, results });
      NOA.save.schedule();
      return { ok: true, results };
    },

    /* ------------------------------------------------------------ rewards */
    randomSpecies(family) {
      const w = {};
      for (const id in C().species) {
        const sp = C().species[id];
        if (sp.family === family && !sp.hybrid && NOA.progress.speciesUnlocked(id)) w[id] = B().gacha.speciesWeights[id] || 0;
      }
      return U.pickWeighted(w);
    },
    randomGene(family, tier) {
      const ids = Object.keys(C().genes).filter((g) => C().genes[g].family === family && C().genes[g].tier === tier && !C().genes[g].secret);
      if (tier === 1) {
        const w = {};
        ids.forEach((g) => { w[g] = B().gene.spawnWeights[family][g] || 1; });
        return U.pickWeighted(w);
      }
      return U.pick(ids);
    },
    apply(rewardId) {
      const def = B().gacha.rewards[rewardId];
      if (def.type === 'seed' || def.type === 'animal') {
        const fam = def.type === 'seed' ? 'plant' : 'animal';
        const species = GA.randomSpecies(fam);
        const level = U.randInt(def.level[0], def.level[1]);
        let gene = null;
        if (def.geneTier) {
          const p = def.purity || [1, 1];
          gene = { id: GA.randomGene(fam, def.geneTier), purity: U.randInt(p[0], p[1]) };
        }
        const item = I().newBreed(species, level, { gene });
        S().discovered.species[species] = true;
        const isNewGene = gene && !S().discovered.genes[gene.id];
        if (gene) NOA.grids.recordGene(gene.id, [], fam);
        const where = NOA.grids.place(item);
        let refund = 0;
        if (where === -1) {   // grid full: pay the item's value instead of losing it
          refund = I().breedValue(item) * 2;
          NOA.res.add('coins', refund);
        }
        return { type: 'item', item, where, refund, isNew: !!isNewGene };
      }
      if (def.type === 'material') {
        NOA.barn.add(def.id, def.qty, { force: true });
        return { type: 'material', id: def.id, qty: def.qty };
      }
      if (def.type === 'booster') {
        S().boosters[def.id] = (S().boosters[def.id] || 0) + def.qty;
        return { type: 'booster', id: def.id, qty: def.qty };
      }
      if (def.type === 'currency') {
        const entries = NOA.rewards.grant({ coins: def.coins, gems: def.gems }, 'gacha');
        return { type: 'currency', entries };
      }
      if (def.type === 'mascot') {
        const id = U.pickWeighted(B().gacha.mascotPools[def.pool]);
        const res = NOA.mascots.add(id);
        return { type: 'mascot', id, res, isNew: res.isNew };
      }
      return { type: 'none' };
    },

    /* ------------------------------------------------------------ rate disclosure */
    rates(id) {
      const box = GA.box(id);
      const tot = U.sum(order().map((r) => (Object.keys(box.pool[r] || {}).length ? box.rarityWeights[r] || 0 : 0)));
      return order().filter((r) => (box.rarityWeights[r] || 0) > 0 && Object.keys(box.pool[r] || {}).length).map((r) => {
        const p = (box.rarityWeights[r] || 0) / tot;
        const pool = box.pool[r];
        const pt = U.sum(Object.values(pool));
        return {
          rarity: r,
          p,
          entries: Object.keys(pool).map((rid) => ({ rewardId: rid, p: p * pool[rid] / pt }))
        };
      });
    },
    pityLeft(id) {
      const box = GA.box(id), st = GA.state(id);
      const out = [];
      for (const r in box.pity || {}) out.push({ rarity: r, left: box.pity[r] - (st.since[r] || 0) });
      return out;
    }
  };
})();
